import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, Check, Info, Loader2, X } from 'lucide-react';
import { dbOps } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import type { ExerciseGlossary } from '@shared/schema';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ExerciseGlossarySelectorProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSelect?: (exercise: ExerciseGlossary) => void;
  // Nuove proprietà per compatibilità
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelectExercise?: (exercise: ExerciseGlossary) => void;
  currentDayId?: string;
}

export function ExerciseGlossarySelector({ 
  isOpen, 
  onClose, 
  onSelect,
  // Supporto per le nuove proprietà
  open,
  onOpenChange,
  onSelectExercise,
  currentDayId
}: ExerciseGlossarySelectorProps) {
  // Normalizzazione delle proprietà per supportare entrambi i set
  const dialogOpen = isOpen || open || false;
  const handleClose = onClose || (onOpenChange ? () => onOpenChange(false) : () => {});
  const handleSelect = onSelect || onSelectExercise || (() => {});
  const [exercises, setExercises] = useState<ExerciseGlossary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseGlossary | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (dialogOpen) {
      loadExercises();
    }
  }, [dialogOpen]);

  const loadExercises = async () => {
    setIsLoading(true);
    try {
      const allExercises = await dbOps.getAllExerciseGlossary();
      setExercises(allExercises);
    } catch (error) {
      console.error('Errore nel caricamento degli esercizi:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare gli esercizi dal glossario',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredExercises = exercises.filter(exercise =>
    exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (exercise.description && exercise.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectExercise = (exercise: ExerciseGlossary) => {
    handleSelect(exercise);
    handleClose();
  };

  const handlePreviewExercise = (exercise: ExerciseGlossary) => {
    setSelectedExercise(exercise);
    setPreviewMode(true);
  };

  const closePreview = () => {
    setPreviewMode(false);
    setSelectedExercise(null);
  };

  // Render preview mode
  if (previewMode && selectedExercise) {
    return (
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedExercise.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedExercise.description && (
              <div>
                <h3 className="text-sm font-medium mb-1">Descrizione</h3>
                <p className="text-sm">{selectedExercise.description}</p>
              </div>
            )}
            
            {selectedExercise.images && selectedExercise.images.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Immagini</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedExercise.images.map((img, index) => (
                    <img 
                      key={index} 
                      src={img} 
                      alt={`${selectedExercise.name} - immagine ${index + 1}`} 
                      className="rounded object-cover w-full h-40"
                    />
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={closePreview}>
                Indietro
              </Button>
              <Button onClick={() => handleSelectExercise(selectedExercise)}>
                Seleziona
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Seleziona Esercizio dal Glossario</DialogTitle>
        </DialogHeader>
        
        <TooltipProvider>
          <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
            <span>Gli esercizi selezionati verranno inclusi nella scheda dal <b>Glossario</b></span>
          </div>
        </TooltipProvider>
        
        <div className="mb-4">
          <div className="relative">

            <Input
              placeholder="Cerca esercizio..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredExercises.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Nessun esercizio trovato</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredExercises.map((exercise) => (
              <Card 
                key={exercise.id} 
                className="overflow-hidden hover:shadow-md transition-shadow"
              >
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-lg flex justify-between items-center">
                    <span className="truncate">{exercise.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  {exercise.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {exercise.description}
                    </p>
                  )}
                  {exercise.images && exercise.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {exercise.images.slice(0, 2).map((img, index) => (
                        <div key={index} className="relative w-12 h-12 rounded overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <img
                            src={img}
                            alt={`${exercise.name} - immagine ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {exercise.images.length > 2 && (
                        <div className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
                          <span className="text-xs text-gray-500 dark:text-gray-400">+{exercise.images.length - 2}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handlePreviewExercise(exercise)}
                    >
                      Anteprima
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => handleSelectExercise(exercise)}
                    >
                      Seleziona
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Annulla</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}