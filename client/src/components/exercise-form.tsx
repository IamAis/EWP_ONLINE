import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Minus, Edit, Trash2, Image, Calendar } from 'lucide-react';
import { processImageForUpload } from '@/lib/image-utils';
import { useToast } from '@/hooks/use-toast';
import type { Week, Exercise, Day } from '@shared/schema';

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
  const { toast } = useToast();

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

  const handleImageUpload = async (dayId: string, exerciseId: string, file: File) => {
    try {
      const compressedDataUrl = await processImageForUpload(file, 800, 600);
      updateExercise(dayId, exerciseId, 'imageUrl', compressedDataUrl);
      
      toast({
        title: "Immagine caricata",
        description: "L'immagine è stata aggiunta all'esercizio"
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile caricare l'immagine",
        variant: "destructive"
      });
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
      <div className="space-y-12">
        {(localWeek.days || []).map((day, dayIndex) => (
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
                  size="sm"
                  variant="ghost"
                  onClick={() => addExercise(day.id)}
                  className="p-1 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                >
                  <Plus size={12} />
                </Button>
                <Button
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
            <div className="space-y-2">
              {(day.exercises || []).map((exercise) => (
                <div 
                  key={exercise.id} 
                  className="flex items-start space-x-2 p-2 bg-white/40 dark:bg-gray-700/40 rounded-lg animate-fade-in"
                >
                  {/* Image upload */}
                  <div className="relative flex-shrink-0">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(day.id, exercise.id, file);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="w-10 h-10 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-75 transition-opacity">
                      {exercise.imageUrl ? (
                        <img 
                          src={exercise.imageUrl} 
                          alt="Exercise" 
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Image className="text-gray-500 dark:text-gray-400" size={12} />
                      )}
                    </div>
                  </div>

                  {/* Exercise fields */}
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-1">
                    <Input
                      placeholder="Esercizio"
                      value={exercise.name}
                      onChange={(e) => updateExercise(day.id, exercise.id, 'name', e.target.value)}
                      className="text-xs bg-white/50 dark:bg-gray-800/50 col-span-2 md:col-span-1"
                    />
                    <Input
                      placeholder="Serie"
                      value={exercise.sets}
                      onChange={(e) => updateExercise(day.id, exercise.id, 'sets', e.target.value)}
                      className="text-xs bg-white/50 dark:bg-gray-800/50"
                    />
                    <Input
                      placeholder="Reps"
                      value={exercise.reps}
                      onChange={(e) => updateExercise(day.id, exercise.id, 'reps', e.target.value)}
                      className="text-xs bg-white/50 dark:bg-gray-800/50"
                    />
                    <Input
                      placeholder="Carico"
                      value={exercise.load || ''}
                      onChange={(e) => updateExercise(day.id, exercise.id, 'load', e.target.value)}
                      className="text-xs bg-white/50 dark:bg-gray-800/50"
                    />
                    <Input
                      placeholder="Recupero"
                      value={exercise.rest || ''}
                      onChange={(e) => updateExercise(day.id, exercise.id, 'rest', e.target.value)}
                      className="text-xs bg-white/50 dark:bg-gray-800/50"
                    />
                  </div>

                  <Button 
                    size="sm"
                    variant="ghost"
                    onClick={() => removeExercise(day.id, exercise.id)}
                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                  >
                    <Minus size={12} />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add exercise to day button */}
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
    </div>
  );
}
