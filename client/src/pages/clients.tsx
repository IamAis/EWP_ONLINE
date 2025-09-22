import { useState } from 'react';
import { Plus, Search, User, Mail, Phone, Edit, Trash2, FileText, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '@/hooks/use-clients';
import { useToast } from '@/hooks/use-toast';
import { usePremium } from '@/hooks/use-premium';
import { PremiumDialog } from '@/components/premium-dialog';
import { insertClientSchema, type InsertClient, type Client } from '@shared/schema';
import { useWorkouts, useUpdateWorkout } from '@/hooks/use-workouts';
import { Link } from 'wouter';

export default function Clients() {
  const { data: clients = [], isLoading } = useClients();
  const { data: workouts = [] } = useWorkouts();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [workoutsDialogOpen, setWorkoutsDialogOpen] = useState(false);
  const [selectedClientForWorkouts, setSelectedClientForWorkouts] = useState<Client | null>(null);
  const [commentValues, setCommentValues] = useState<Record<string, string>>({});
  const [savingComments, setSavingComments] = useState<Record<string, boolean>>({});
  const updateWorkout = useUpdateWorkout();
  
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const { toast } = useToast();
  const { canAccess } = usePremium();

  const form = useForm<InsertClient>({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      notes: ''
    }
  });

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm)
  );

  const handleSubmit = async (data: InsertClient) => {
    try {
      // Se stiamo modificando un cliente esistente o se l'utente può creare un nuovo cliente
      if (editingClient || canAccess('clients', clients.length)) {
        if (editingClient) {
          await updateClient.mutateAsync({ id: editingClient.id, updates: data });
          toast({
            title: "Cliente aggiornato",
            description: "Le informazioni del cliente sono state aggiornate"
          });
        } else {
          await createClient.mutateAsync(data);
          toast({
            title: "Cliente creato",
            description: "Il nuovo cliente è stato aggiunto"
          });
        }
        
        setIsDialogOpen(false);
        setEditingClient(null);
        form.reset();
      } else {
        // Se l'utente non può creare un nuovo cliente, mostra il popup premium
        setIsDialogOpen(false);
        setShowPremiumDialog(true);
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile salvare il cliente",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    form.reset({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      notes: client.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (client: Client) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteClient = async () => {
    if (!clientToDelete) return;
    try {
      await deleteClient.mutateAsync(clientToDelete.id);
      toast({
        title: "Cliente eliminato",
        description: `${clientToDelete.name} è stato rimosso`
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile eliminare il cliente",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };

  const openCreateDialog = () => {
    // Verifica se l'utente può creare un nuovo cliente
    if (canAccess('clients', clients.length)) {
      setEditingClient(null);
      form.reset();
      setIsDialogOpen(true);
    } else {
      // Mostra il popup premium
      setShowPremiumDialog(true);
    }
  };
  
  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    form.reset({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      notes: client.notes || ''
    });
    setIsDialogOpen(true);
  };

  const openWorkoutsDialog = (client: Client) => {
    setSelectedClientForWorkouts(client);
    setWorkoutsDialogOpen(true);
    // Inizializza i valori dei commenti per questo cliente
    const clientWorkouts = workouts.filter(w => w.clientName === client.name);
    const initialComments: Record<string, string> = {};
    clientWorkouts.forEach(w => {
      initialComments[w.id] = w.clientComment || '';
    });
    setCommentValues(initialComments);
  };

  const saveComment = async (workoutId: string) => {
    const commentValue = commentValues[workoutId] || '';
    setSavingComments(prev => ({ ...prev, [workoutId]: true }));
    
    try {
      await updateWorkout.mutateAsync({ 
        id: workoutId, 
        updates: { clientComment: commentValue } 
      });
      toast({ 
        title: 'Commento salvato', 
        description: 'Il commento è stato salvato con successo' 
      });
    } catch {
      toast({ 
        title: 'Errore', 
        description: 'Impossibile salvare il commento', 
        variant: 'destructive' 
      });
    } finally {
      setSavingComments(prev => ({ ...prev, [workoutId]: false }));
    }
  };

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-mobile-nav">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-mobile-nav">
      {/* Premium Dialog */}
      <PremiumDialog 
        open={showPremiumDialog} 
        onOpenChange={setShowPremiumDialog} 
        feature="clients" 
      />
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Gestione Clienti
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Aggiungi e gestisci i tuoi clienti
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-gradient-primary hover:opacity-90 transition-opacity h-12 px-6 text-lg font-semibold">
              <Plus className="mr-2" size={18} />
              Nuovo Cliente
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? 'Modifica Cliente' : 'Nuovo Cliente'}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome cliente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (opzionale)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@esempio.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefono (opzionale)</FormLabel>
                      <FormControl>
                        <Input placeholder="+39 123 456 7890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note (opzionale)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Note aggiuntive sul cliente..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit" 
                    disabled={createClient.isPending || updateClient.isPending}
                    className="flex-1 bg-gradient-primary hover:opacity-90 transition-opacity"
                  >
                    {editingClient ? 'Aggiorna' : 'Crea'} Cliente
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Annulla
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Cerca clienti..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass-effect bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
          />
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id} className="glass-effect rounded-2xl hover:scale-105 transition-transform duration-300 animate-fade-in">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mr-3">
                      <User className="text-white" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {client.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Cliente
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      onClick={() => openWorkoutsDialog(client)}
                      className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-xs font-medium rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                      title="Visualizza schede"
                    >
                      <FileText size={12} className="mr-1" />
                      Schede
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(client)}
                      className="p-1 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(client)}
                      className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {client.email && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Mail size={14} className="mr-2" />
                      {client.email}
                    </div>
                  )}
                  
                  {client.phone && (
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <Phone size={14} className="mr-2" />
                      {client.phone}
                    </div>
                  )}
                  
                  {client.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      {client.notes}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 opacity-50">
            <User size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'Nessun cliente trovato' : 'Nessun cliente ancora'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm 
              ? 'Prova a modificare il termine di ricerca'
              : 'Aggiungi il tuo primo cliente per iniziare'
            }
          </p>
          <Button onClick={openCreateDialog} className="bg-gradient-primary hover:opacity-90 transition-opacity">
            <Plus className="mr-2" size={16} />
            Aggiungi Cliente
          </Button>
        </div>
      )}

      {/* Dialog conferma eliminazione cliente */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Elimina cliente</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Sei sicuro di voler eliminare "{clientToDelete?.name}"? Questa azione non può essere annullata.
          </p>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setDeleteDialogOpen(false); setClientToDelete(null); }}
              className="flex-1"
            >
              Annulla
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteClient}
              className="flex-1"
            >
              Elimina
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog schede cliente */}
      <Dialog open={workoutsDialogOpen} onOpenChange={setWorkoutsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Schede di {selectedClientForWorkouts?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedClientForWorkouts && (workouts.filter(w => w.clientName === selectedClientForWorkouts.name)).length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Nessuna scheda per questo cliente
                </p>
              </div>
            ) : (
              selectedClientForWorkouts && (workouts.filter(w => w.clientName === selectedClientForWorkouts.name)).map((w) => (
                <div key={w.id} className="p-4 rounded-lg bg-white/40 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-base font-medium text-gray-900 dark:text-white">
                      {w.name || w.workoutType} • {w.duration} settimane
                    </span>
                    <Link href={`/workout/${w.id}`}>
                      <Button size="sm" variant="outline" className="text-xs">
                        Apri Scheda
                      </Button>
                    </Link>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                        Commenti del cliente
                      </label>
                      <div className="space-y-2">
                        <textarea
                          value={commentValues[w.id] || ''}
                          onChange={(e) => {
                            setCommentValues(prev => ({
                              ...prev,
                              [w.id]: e.target.value
                            }));
                          }}
                          placeholder="Aggiungi un commento per questa scheda..."
                          className="w-full text-sm p-3 rounded-md border bg-white/70 dark:bg-gray-900/40 border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                          rows={3}
                        />
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => saveComment(w.id)}
                            disabled={savingComments[w.id] || commentValues[w.id] === (w.clientComment || '')}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-1 text-xs"
                          >
                            {savingComments[w.id] ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                Salvando...
                              </>
                            ) : (
                              <>
                                <Save size={12} className="mr-1" />
                                Salva Commento
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="flex justify-end pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setWorkoutsDialogOpen(false);
                setSelectedClientForWorkouts(null);
              }}
            >
              Chiudi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
