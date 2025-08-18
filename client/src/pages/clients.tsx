import { useState } from 'react';
import { Plus, Search, User, Mail, Phone, Edit, Trash2 } from 'lucide-react';
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
import { insertClientSchema, type InsertClient, type Client } from '@shared/schema';

export default function Clients() {
  const { data: clients = [], isLoading } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const { toast } = useToast();

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
    if (window.confirm(`Sei sicuro di voler eliminare ${client.name}?`)) {
      try {
        await deleteClient.mutateAsync(client.id);
        toast({
          title: "Cliente eliminato",
          description: `${client.name} è stato rimosso`
        });
      } catch (error) {
        toast({
          title: "Errore",
          description: "Impossibile eliminare il cliente",
          variant: "destructive"
        });
      }
    }
  };

  const openCreateDialog = () => {
    setEditingClient(null);
    form.reset();
    setIsDialogOpen(true);
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
    </main>
  );
}
