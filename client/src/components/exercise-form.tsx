import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Minus, Trash2, Calendar, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { ExerciseGlossarySelector } from '@/components/exercise-glossary-selector';
import { PremiumDialog } from '@/components/premium-dialog';
import type { Week, Exercise, Day } from '@shared/schema';
import type { ExerciseGlossary } from '@shared/schema';

interface ExerciseFormProps {
  week: Week;
  onUpdateWeek: (week: Week) => void;
  onRemoveWeek: () => void;
}

export function ExerciseForm({ week, onUpdateWeek, onRemoveWeek }: ExerciseFormProps) {
  const [localWeek, setLocalWeek] = useState<Week>({
    ...week,
    days: week.days || []
  });
  const [glossarySelectorOpen, setGlossarySelectorOpen] = useState(false);
  const [currentDayId, setCurrentDayId] = useState<string | null>(null);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const addDay = () => {
    const newDay: Day = {
      id: crypto.randomUUID(),
      name: `Giorno ${(localWeek.days || []).length + 1}`,
      exercises: []
    };
    const updated = { ...localWeek, days: [...(localWeek.days || []), newDay] };
    setLocalWeek(updated);
    onUpdateWeek(updated);
  };

  const updateDay = (dayId: string, field: keyof Day, value: string | Exercise[]) => {
    const updated = {
      ...localWeek,
      days: (localWeek.days || []).map(day =>
        day.id === dayId ? { ...day, [field]: value } : day
      )
    };
    setLocalWeek(updated);
    onUpdateWeek(updated);
  };

  const removeDay = (dayId: string) => {
    const updated = {
      ...localWeek,
      days: (localWeek.days || []).filter(day => day.id !== dayId)
    };
    setLocalWeek(updated);
    onUpdateWeek(updated);
  };

  const addExercise = (dayId: string) => {
    const newExercise: Exercise = {
      id: crypto.randomUUID(),
      name: '',
      sets: '',
      reps: '',
      load: '',
      rest: '',
      notes: '',
      order: 0
    };

    const day = (localWeek.days || []).find(d => d.id === dayId);
    if (day) {
      const updatedExercises = [...(day.exercises || []), { ...newExercise, order: (day.exercises || []).length }];
      updateDay(dayId, 'exercises', updatedExercises);
    }
  };

  const openGlossarySelector = (dayId: string) => {
    if (!user) {
      setShowPremiumDialog(true);
      return;
    }
    setCurrentDayId(dayId);
    setGlossarySelectorOpen(true);
  };

  const handleSelectGlossaryExercise = (glossaryExercise: ExerciseGlossary) => {
    if (!currentDayId) return;

    const newExercise: Exercise = {
      id: crypto.randomUUID(),
      name: glossaryExercise.name,
      sets: '3',
      reps: '10',
      load: '',
      rest: '',
      notes: '',
      order: 0,
      // Importiamo solo il nome, senza descrizione e immagini
      glossaryId: glossaryExercise.id
    } as Exercise;

    const day = (localWeek.days || []).find(d => d.id === currentDayId);
    if (day) {
      const updatedExercises = [...(day.exercises || []), { ...newExercise, order: (day.exercises || []).length }];
      updateDay(currentDayId, 'exercises', updatedExercises);

      toast({
        title: "Esercizio importato",
        description: `${glossaryExercise.name} aggiunto alla scheda`
      });
    }
  };

  const updateExercise = (dayId: string, exerciseId: string, field: keyof Exercise, value: string) => {
    const day = (localWeek.days || []).find(d => d.id === dayId);
    if (day) {
      const updatedExercises = (day.exercises || []).map(exercise =>
        exercise.id === exerciseId ? { ...exercise, [field]: value } : exercise
      );
      updateDay(dayId, 'exercises', updatedExercises);
    }
  };

  const removeExercise = (dayId: string, exerciseId: string) => {
    const day = (localWeek.days || []).find(d => d.id === dayId);
    if (day) {
      const updatedExercises = (day.exercises || []).filter(exercise => exercise.id !== exerciseId);
      updateDay(dayId, 'exercises', updatedExercises);
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 bg-white/30 dark:bg-gray-800/30 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <Input
          value={localWeek.name || `SETTIMANA ${localWeek.number}`}
          onChange={(e) => {
            const updated = { ...localWeek, name: e.target.value };
            setLocalWeek(updated);
            onUpdateWeek(updated);
          }}
          className="font-medium bg-transparent border-none p-0 text-lg text-gray-900 dark:text-white focus:bg-white/50 dark:focus:bg-gray-800/50 w-auto max-w-xs"
          placeholder={`SETTIMANA ${localWeek.number}`}
        />
        <div className="flex space-x-2">
          <Button 
            type="button"
            size="sm" 
            variant="ghost"
            onClick={addDay}
            className="p-1 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
          >
            <Calendar size={14} />
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={onRemoveWeek}
            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {/* Week notes */}
      <div className="mb-4">
        <Textarea
          placeholder="Note per la settimana..."
          value={localWeek.notes || ''}
          onChange={(e) => {
            const updated = { ...localWeek, notes: e.target.value };
            setLocalWeek(updated);
            onUpdateWeek(updated);
          }}
          rows={2}
          className="text-sm bg-white/50 dark:bg-gray-800/50"
        />
      </div>

      {/* Days */}
      <div className="space-y-8 md:space-y-12">
        {(localWeek.days || []).map((day) => (
          <div key={day.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white/40 dark:bg-gray-900/20">
            <div className="flex items-center justify-between mb-3">
              <Input
                value={day.name}
                onChange={(e) => updateDay(day.id, 'name', e.target.value)}
                className="font-medium bg-transparent border-none p-0 text-sm text-gray-900 dark:text-white focus:bg-white/50 dark:focus:bg-gray-800/50"
                placeholder="Nome del giorno"
              />
              <div className="flex space-x-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => openGlossarySelector(day.id)}
                  className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <BookOpen size={12} />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => addExercise(day.id)}
                  className="p-1 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                >
                  <Plus size={12} />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeDay(day.id)}
                  className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>

            {/* Day notes */}
            {day.notes !== undefined && (
              <Textarea
                placeholder="Note per il giorno..."
                value={day.notes || ''}
                onChange={(e) => updateDay(day.id, 'notes', e.target.value)}
                rows={2}
                className="text-xs bg-white/30 dark:bg-gray-800/30 mb-3"
              />
            )}

            {/* Exercises for this day */}
            <div className="space-y-3 md:space-y-2">
              {(day.exercises || []).map((exercise) => (
                <div 
                  key={exercise.id} 
                  className="flex flex-col md:flex-col space-y-2 md:space-y-0 p-3 md:p-2 bg-white/40 dark:bg-gray-700/40 rounded-lg animate-fade-in"
                >
                  {/* Campi esercizio */}
                  <div className="flex md:flex-1 md:items-start">
                    <div className="flex-1 space-y-2 md:space-y-0 md:grid md:grid-cols-5 md:gap-1">
                      <div className="md:col-span-1">
                        <Input
                          placeholder="Esercizio"
                          value={exercise.name}
                          onChange={(e) => updateExercise(day.id, exercise.id, 'name', e.target.value)}
                          className={`text-sm md:text-xs bg-white/50 dark:bg-gray-800/50 w-full touch-manipulation min-h-[44px] md:min-h-[32px] ${exercise.glossaryId ? 'border-blue-300 dark:border-blue-700' : ''}`}
                          style={{ WebkitAppearance: 'none' }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 md:contents">
                        <Input
                          placeholder="Serie"
                          value={exercise.sets}
                          onChange={(e) => updateExercise(day.id, exercise.id, 'sets', e.target.value)}
                          className="text-sm md:text-xs bg-white/50 dark:bg-gray-800/50 touch-manipulation min-h-[44px] md:min-h-[32px]"
                          style={{ WebkitAppearance: 'none' }}
                        />
                        <Input
                          placeholder="Reps"
                          value={exercise.reps}
                          onChange={(e) => updateExercise(day.id, exercise.id, 'reps', e.target.value)}
                          className="text-sm md:text-xs bg-white/50 dark:bg-gray-800/50 touch-manipulation min-h-[44px] md:min-h-[32px]"
                          style={{ WebkitAppearance: 'none' }}
                        />
                        <Input
                          placeholder="Carico"
                          value={exercise.load || ''}
                          onChange={(e) => updateExercise(day.id, exercise.id, 'load', e.target.value)}
                          className="text-sm md:text-xs bg-white/50 dark:bg-gray-800/50 touch-manipulation min-h-[44px] md:min-h-[32px]"
                          style={{ WebkitAppearance: 'none' }}
                        />
                        <Input
                          placeholder="Recupero"
                          value={exercise.rest || ''}
                          onChange={(e) => updateExercise(day.id, exercise.id, 'rest', e.target.value)}
                          className="text-sm md:text-xs bg-white/50 dark:bg-gray-800/50 touch-manipulation min-h-[44px] md:min-h-[32px]"
                          style={{ WebkitAppearance: 'none' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bottone rimozione */}
                  <Button 
                    size="sm"
                    variant="ghost"
                    onClick={() => removeExercise(day.id, exercise.id)}
                    className="w-full md:w-auto p-2 md:p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 min-h-[44px] md:min-h-[32px]"
                  >
                    <Minus size={16} className="md:w-3 md:h-3" />
                    <span className="ml-1 md:hidden text-sm">Rimuovi</span>
                  </Button>
                </div>
              ))}
            </div>

            {/* Add exercise to day */}
            <Button 
              type="button"
              onClick={() => addExercise(day.id)}
              variant="outline"
              size="sm"
              className="mt-2 w-full py-1 text-xs text-indigo-500 border border-dashed border-indigo-300 dark:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            >
              <Plus className="mr-1" size={12} />
              Aggiungi Esercizio
            </Button>
          </div>
        ))}
      </div>

      {/* Add day button */}
      <Button 
        type="button"
        onClick={addDay}
        variant="outline"
        className="mt-4 w-full py-2 text-emerald-500 border-2 border-dashed border-emerald-300 dark:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
      >
        <Calendar className="mr-2" size={16} />
        Aggiungi Giorno
      </Button>
      
      {/* Selettore glossario */}
      <ExerciseGlossarySelector 
        open={glossarySelectorOpen}
        onOpenChange={setGlossarySelectorOpen}
        onSelectExercise={handleSelectGlossaryExercise}
        currentDayId={currentDayId || undefined}
      />
      
      {/* Premium Dialog */}
      <PremiumDialog 
        open={showPremiumDialog} 
        onOpenChange={setShowPremiumDialog} 
        feature="glossary" 
      />
    </div>
  );
}
