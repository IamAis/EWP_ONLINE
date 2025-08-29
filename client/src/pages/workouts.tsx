import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { WorkoutCard } from '@/components/workout-card';
import { WorkoutBuilder } from '@/components/workout-builder';
import { useWorkouts, useCreateWorkout } from '@/hooks/use-workouts';
import { useToast } from '@/hooks/use-toast';
import { usePremium } from '@/hooks/use-premium';
import { PremiumDialog } from '@/components/premium-dialog';
import { workoutTypes, type Workout } from '@shared/schema';

export default function Workouts() {
  const { data: workouts = [], isLoading } = useWorkouts();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const createWorkout = useCreateWorkout();
  const { toast } = useToast();
  const { canAccess } = usePremium();

  const filteredWorkouts = workouts.filter(workout => {
    const matchesSearch = 
      workout.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (workout.level?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) || //DA DEBUGGARE
      workout.workoutType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || workout.workoutType === filterType;
    
    return matchesSearch && matchesType;
  });

  const handleEditWorkout = (workout: Workout) => {
    setEditingWorkout(workout);
  };

  const handleDuplicateWorkout = async (workout: Workout) => {
    try {
      const duplicatedWorkout = {
        ...workout,
        clientName: `${workout.clientName} (Copia)`,
        weeks: workout.weeks.map(week => ({
          ...week,
          id: crypto.randomUUID(),
          days: week.days.map(day => ({
            ...day,
            id: crypto.randomUUID(),
            exercises: day.exercises.map(exercise => ({
              ...exercise,
              id: crypto.randomUUID()
            }))
          }))
        }))
      };
      delete (duplicatedWorkout as any).id;
      delete (duplicatedWorkout as any).createdAt;
      delete (duplicatedWorkout as any).updatedAt;
      
      await createWorkout.mutateAsync(duplicatedWorkout);
      toast({
        title: "Scheda duplicata",
        description: "La scheda è stata copiata con successo"
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile duplicare la scheda",
        variant: "destructive"
      });
    }
  };

  const handleCloseDialogs = () => {
    setShowCreateDialog(false);
    setEditingWorkout(null);
  };

  const handleCreateWorkout = () => {
    // Verifica se l'utente può creare una nuova scheda
    if (canAccess('workouts', workouts.length)) {
      setShowCreateDialog(true);
    } else {
      // Mostra il popup premium
      setShowPremiumDialog(true);
    }
  };

  if (isLoading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-mobile-nav">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
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
            Schede di Allenamento
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Gestisci e organizza le tue schede workout
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <Button 
            className="bg-gradient-primary hover:opacity-90 transition-opacity h-12 px-6 text-lg font-semibold"
            onClick={handleCreateWorkout}
          >
            <Plus className="mr-2" size={18} />
            Nuova Scheda
          </Button>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crea Nuova Scheda</DialogTitle>
            </DialogHeader>
            <WorkoutBuilder onSuccess={() => setShowCreateDialog(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Premium Dialog */}
      <PremiumDialog 
        open={showPremiumDialog} 
        onOpenChange={setShowPremiumDialog} 
        feature="workouts" 
      />

      {/* Edit Dialog */}
      {editingWorkout && (
        <Dialog open={!!editingWorkout} onOpenChange={() => setEditingWorkout(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifica Scheda - {editingWorkout.clientName}</DialogTitle>
            </DialogHeader>
            <WorkoutBuilder existingWorkout={editingWorkout} onSuccess={() => setEditingWorkout(null)} />
          </DialogContent>
        </Dialog>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Cerca per cliente, coach o tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass-effect bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="text-gray-400" size={16} />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-48 glass-effect bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <SelectValue placeholder="Filtra per tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i tipi</SelectItem>
              {workoutTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Workouts Grid */}
      {filteredWorkouts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkouts.map((workout) => (
            <div key={workout.id} className="glass-effect rounded-2xl p-2">
              <WorkoutCard 
                workout={workout}
                onEdit={handleEditWorkout}
                onDuplicate={handleDuplicateWorkout}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 opacity-50">
            <Plus size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {searchTerm || filterType !== 'all' ? 'Nessun risultato' : 'Nessuna scheda ancora'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm || filterType !== 'all' 
              ? 'Prova a modificare i filtri di ricerca'
              : 'Crea la tua prima scheda di allenamento'
            }
          </p>
          <Button
            className="bg-gradient-primary hover:opacity-90 transition-opacity"
            onClick={handleCreateWorkout}
          >
            <Plus className="mr-2" size={16} />
            Crea Nuova Scheda
          </Button>
        </div>
      )}
    </main>
  );
}
