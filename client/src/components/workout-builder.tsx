import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ExerciseForm } from './exercise-form';
import { Plus, Save, Eye, Download, Utensils, Users } from 'lucide-react';
import { useCreateWorkout, useUpdateWorkout } from '@/hooks/use-workouts';
import { useCoachProfile, useClients } from '@/hooks/use-clients';
import { useToast } from '@/hooks/use-toast';
import { pdfGenerator } from '@/lib/pdf-generator';
import { workoutTypes, levels, insertWorkoutSchema, type InsertWorkout, type Week, type Exercise, type Day, type Workout } from '@shared/schema';
import { z } from 'zod';

const formSchema = insertWorkoutSchema.extend({
  name: z.string().min(1, "Nome scheda richiesto"),
  clientName: z.string().min(1, "Nome cliente richiesto"),
  duration: z.number().min(1, "Durata richiesta")
});

interface WorkoutBuilderProps {
  existingWorkout?: Workout;
  onSuccess?: () => void;
}

export function WorkoutBuilder({ existingWorkout, onSuccess }: WorkoutBuilderProps) {
  const [weeks, setWeeks] = useState<Week[]>(existingWorkout?.weeks || []);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(existingWorkout?.clientId || null);
  const { data: coachProfile } = useCoachProfile();
  const { data: clients } = useClients();
  const createWorkout = useCreateWorkout();
  const updateWorkout = useUpdateWorkout();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: existingWorkout?.name || '',
      coachName: coachProfile?.name || '', // Coach preso dalle impostazioni
      clientName: existingWorkout?.clientName || '',
      clientId: existingWorkout?.clientId || '',
      workoutType: existingWorkout?.workoutType || '',
      level: existingWorkout?.level || undefined, // Nuovo campo livello
      duration: existingWorkout?.duration || 8,
      description: existingWorkout?.description || '',
      dietaryAdvice: existingWorkout?.dietaryAdvice || '',
      weeks: existingWorkout?.weeks || []
    }
  });

  // Gestore per la selezione del cliente
  const handleClientSelect = (clientId: string) => {
    if (clientId === 'new') {
      setSelectedClientId(null);
      form.setValue('clientName', '');
      form.setValue('clientId', '');
    } else {
      const selectedClient = clients?.find(c => c.id === clientId);
      if (selectedClient) {
        setSelectedClientId(clientId);
        form.setValue('clientName', selectedClient.name);
        form.setValue('clientId', clientId);
      }
    }
  };

  useEffect(() => {
    if (existingWorkout) {
      setWeeks(existingWorkout.weeks);
      setSelectedClientId(existingWorkout.clientId || null);
      form.reset({
        name: existingWorkout.name || '',
        coachName: coachProfile?.name || '', // Coach dalle impostazioni
        clientName: existingWorkout.clientName,
        clientId: existingWorkout.clientId || '',
        workoutType: existingWorkout.workoutType,
        level: existingWorkout.level || undefined, // Nuovo campo livello
        duration: existingWorkout.duration,
        description: existingWorkout.description || '',
        dietaryAdvice: existingWorkout.dietaryAdvice || '',
        weeks: existingWorkout.weeks
      });
    }
  }, [existingWorkout, form]);

  const addWeek = () => {
    const newWeek: Week = {
      id: crypto.randomUUID(),
      number: weeks.length + 1,
      name: `SETTIMANA ${weeks.length + 1}`, // Nome default customizzabile
      days: [
        {
          id: crypto.randomUUID(),
          name: "Giorno 1",
          exercises: []
        }
      ]
    };
    setWeeks([...weeks, newWeek]);
  };

  const updateWeek = (weekId: string, updatedWeek: Week) => {
    setWeeks(weeks.map(week => 
      week.id === weekId ? updatedWeek : week
    ));
  };

  const removeWeek = (weekId: string) => {
    const filtered = weeks.filter(week => week.id !== weekId);
    const renumbered = filtered.map((week, index) => ({ ...week, number: index + 1 }));
    setWeeks(renumbered);
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (existingWorkout) {
        // Update existing workout - forza l'uso delle settimane attuali
        await updateWorkout.mutateAsync({
          id: existingWorkout.id,
          updates: {
            ...data,
            coachName: coachProfile?.name || data.coachName, // Usa il coach dalle impostazioni
            weeks: weeks, // Forza l'uso dello stato attuale delle settimane
            updatedAt: new Date()
          }
        });
        
        toast({
          title: "Scheda aggiornata",
          description: "Le modifiche sono state salvate con successo"
        });
      } else {
        // Create new workout - forza l'uso delle settimane attuali
        const workoutData: InsertWorkout = {
          ...data,
          coachName: coachProfile?.name || data.coachName, // Usa il coach dalle impostazioni
          weeks: weeks // Forza l'uso dello stato attuale delle settimane
        };
        
        await createWorkout.mutateAsync(workoutData);
        
        toast({
          title: "Scheda creata",
          description: "La scheda è stata creata con successo"
        });
        
        // Reset form for new workouts
        form.reset();
        setWeeks([]);
      }

      onSuccess?.();
    } catch (error) {
      toast({
        title: "Errore",
        description: existingWorkout ? "Impossibile aggiornare la scheda" : "Impossibile salvare la scheda",
        variant: "destructive"
      });
    }
  };

  const handlePreviewPDF = async () => {
    const formData = form.getValues();
    const workout = {
      id: 'preview',
      ...formData,
      weeks,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      // Include coach profile per applicare le impostazioni nell'anteprima
      const blob = await pdfGenerator.generateWorkoutPDF(workout, coachProfile);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile generare l'anteprima PDF",
        variant: "destructive"
      });
    }
  };

  const handleExportPDF = async () => {
    const formData = form.getValues();
    const workout = {
      id: 'export',
      ...formData,
      weeks,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      const blob = await pdfGenerator.generateWorkoutPDF(workout, coachProfile);
      const filename = `scheda-${formData.clientName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      
      pdfGenerator.downloadPDF(blob, filename, coachProfile?.exportPath);

      // Update export count
      const currentCount = parseInt(localStorage.getItem('exportedPDFs') || '0');
      localStorage.setItem('exportedPDFs', (currentCount + 1).toString());

      toast({
        title: "PDF esportato",
        description: "Il PDF è stato scaricato con successo"
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile esportare il PDF",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="lg:col-span-2">
      <div className="glass-effect rounded-2xl p-6 mb-8 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {existingWorkout ? 'Modifica Scheda' : 'Crea Nuova Scheda'}
          </h2>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Nome Scheda */}
            <div className="mb-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold">Nome Scheda</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="es. Scheda Planche" 
                        {...field}
                        className="glass-effect bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-lg"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Client Info */}
            <div className="mb-6">
              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Users size={16} />
                      Cliente
                    </FormLabel>
                    <div className="space-y-3">
                      {clients && clients.length > 0 && (
                        <Select 
                          value={selectedClientId || 'new'} 
                          onValueChange={handleClientSelect}
                        >
                          <SelectTrigger className="glass-effect bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                            <SelectValue placeholder="Seleziona cliente esistente" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">Nuovo cliente</SelectItem>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <FormControl>
                        <Input 
                          placeholder="Nome del cliente" 
                          {...field}
                          className="glass-effect bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                          disabled={!!selectedClientId}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Workout Type, Level and Duration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="workoutType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo di Scheda</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="glass-effect bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                          <SelectValue placeholder="Seleziona tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {workoutTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Livello (Opzionale)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="glass-effect bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                          <SelectValue placeholder="Seleziona livello" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nessun livello</SelectItem>
                        {levels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durata (Settimane)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="1"
                        max="52"
                        placeholder="8"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value))}
                        className="glass-effect bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrizione Iniziale</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Programma di allenamento personalizzato..."
                      rows={3}
                      {...field}
                      className="glass-effect bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Weekly Progression */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="hidden md:block text-lg font-semibold text-gray-900 dark:text-white">
                  Progressione Settimanale
                </h3>
                <Button 
                  type="button"
                  onClick={addWeek}
                  size="sm"
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  <Plus className="mr-1" size={14} />
                  Aggiungi Settimana
                </Button>
              </div>

              <div className="space-y-4">
                {weeks.map((week) => (
                  <ExerciseForm
                    key={week.id}
                    week={week}
                    onUpdateWeek={(updatedWeek) => updateWeek(week.id, updatedWeek)}
                    onRemoveWeek={() => removeWeek(week.id)}
                  />
                ))}
              </div>
            </div>

            {/* Dietary Advice */}
            <FormField
              control={form.control}
              name="dietaryAdvice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <Utensils className="mr-2 text-emerald-500" size={16} />
                    Consigli Dietistici
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Consigli nutrizionali per il cliente..."
                      rows={4}
                      {...field}
                      className="glass-effect bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                type="submit"
                disabled={createWorkout.isPending || updateWorkout.isPending}
                className="flex-1 bg-gradient-primary hover:opacity-90 transition-opacity"
              >
                <Save className="mr-2" size={16} />
                {(createWorkout.isPending || updateWorkout.isPending) ? 'Salvando...' : (existingWorkout ? 'Aggiorna Scheda' : 'Salva Scheda')}
              </Button>
              
              <Button 
                type="button"
                onClick={handlePreviewPDF}
                className="flex-1 bg-gradient-secondary hover:opacity-90 transition-opacity"
              >
                <Eye className="mr-2" size={16} />
                Anteprima PDF
              </Button>
              
              <Button 
                type="button"
                onClick={handleExportPDF}
                className="flex-1 bg-gradient-accent hover:opacity-90 transition-opacity"
              >
                <Download className="mr-2" size={16} />
                Esporta PDF
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
