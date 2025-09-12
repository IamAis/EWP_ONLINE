import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Search, Download, FileText, X, Loader2 } from 'lucide-react';
import { dbOps } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { usePDFGenerator } from '@/hooks/use-pdf-generator';
import { useAuth } from '@/hooks/use-auth';
import { PremiumDialog } from './premium-dialog';
import type { Workout, CoachProfile, ExerciseGlossary } from '@shared/schema';

interface WorkoutExportDialogProps {
  workout: Workout;
  coachProfile?: CoachProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkoutExportDialog({ workout, coachProfile, open, onOpenChange }: WorkoutExportDialogProps) {
  const [exercises, setExercises] = useState<ExerciseGlossary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const pdfGenerator = usePDFGenerator();

  useEffect(() => {
    if (open) {
      loadExercises();
    } else {
      // Reset state when dialog closes
      setSelectedExercises([]);
      setSearchTerm('');
    }
  }, [open]);

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

  const handleToggleExercise = (exerciseId: string) => {
    setSelectedExercises(prev => {
      if (prev.includes(exerciseId)) {
        return prev.filter(id => id !== exerciseId);
      } else {
        return [...prev, exerciseId];
      }
    });
  };

  const handleExportPDF = async (preview = false) => {
    // Verifica se l'utente è autenticato
    if (!user) {
      setShowPremiumDialog(true);
      return;
    }

    try {
      // Get selected exercises data and map them to the expected format
      const selectedExercisesData = exercises
        .filter(ex => selectedExercises.includes(ex.id))
        .map(ex => ({
          id: ex.id,
          name: ex.name,
          order: 0,
          sets: '',
          reps: '',
          glossaryId: ex.id,
          glossaryContent: {
            description: ex.description,
            images: ex.images
          }
        }));
      
      // Use the updated PDF generator method that accepts selected exercises
      const blob = await pdfGenerator.generateWorkoutPDF(workout, coachProfile, undefined, selectedExercisesData);
      
      if (preview) {
        // Show preview
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        URL.revokeObjectURL(url);
      } else {
        // Download PDF
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scheda-${workout.clientName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Update export count
        const currentCount = parseInt(localStorage.getItem('exportedPDFs') || '0');
        localStorage.setItem('exportedPDFs', (currentCount + 1).toString());

        toast({
          title: "PDF esportato",
          description: "Il PDF è stato scaricato con successo"
        });
        
        // Close dialog after export
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Errore nell\'esportazione del PDF:', error);
      toast({
        title: "Errore",
        description: "Impossibile esportare il PDF",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Esporta Scheda con Esercizi dal Glossario</DialogTitle>
          </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Seleziona gli esercizi dal glossario che vuoi includere nella scheda esportata.<br></br>
            Gli esercizi selezionati verranno aggiunti in fondo al PDF.
          </p>
          

    <div className="mb-4">
      <div className="relative">
        {/* Icona lente a sinistra, visibile solo se searchTerm è vuoto */}
        {!searchTerm && (
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        )}

        <Input
          placeholder="     Cerca esercizio..."
          className="pl-10" // padding per spostare il testo a destra della lente
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Pulsante "X" per svuotare il campo */}
        {searchTerm && (
          <Button
            variant="ghost"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => setSearchTerm('')}
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
            <div className="border rounded-md divide-y max-h-[50vh] overflow-y-auto">
              {filteredExercises.map((exercise) => (
                <div 
                  key={exercise.id} 
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <Checkbox 
                    id={`exercise-${exercise.id}`}
                    checked={selectedExercises.includes(exercise.id)}
                    onCheckedChange={() => handleToggleExercise(exercise.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <Label 
                      htmlFor={`exercise-${exercise.id}`}
                      className="font-medium cursor-pointer"
                    >
                      {exercise.name}
                    </Label>
                    
                  </div>
                  {exercise.images && exercise.images.length > 0 && (
                    <div className="flex-shrink-0 w-10 h-10 rounded overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <img
                        src={exercise.images[0]}
                        alt={exercise.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-between space-x-2">
          <div className="flex-1 text-sm text-muted-foreground">
            {selectedExercises.length} esercizi selezionati
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button 
              onClick={() => handleExportPDF(true)}
              variant="outline"
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              <FileText size={16} />
              Anteprima
            </Button>
            <Button 
              onClick={() => handleExportPDF(false)}
              className="bg-gradient-primary hover:opacity-90 transition-opacity"
              disabled={isLoading}
            >
              <Download className="mr-2" size={16} />
              Esporta PDF
            </Button>
          </div>
        </DialogFooter>
        </DialogContent>
      </Dialog>
      <PremiumDialog open={showPremiumDialog} onOpenChange={setShowPremiumDialog} feature="workouts" />
    </>
  );
}