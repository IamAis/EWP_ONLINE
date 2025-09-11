import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Download, Image, Edit, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { processImageForUpload } from '@/lib/image-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { dbOps } from '@/lib/database';
import { jsPDF } from 'jspdf';
import type { ExerciseGlossary } from '@shared/schema';
import { usePDFGenerator } from '@/hooks/use-pdf-generator';

export function ExerciseGlossaryManager() {
  const [exercises, setExercises] = useState<ExerciseGlossary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<Partial<ExerciseGlossary>>({
    name: '',
    description: '',
    images: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { generatePDF } = usePDFGenerator();

  const loadExercises = useCallback(async () => {
    setIsLoading(true);
    try {
      const loadedExercises = await dbOps.getExerciseGlossary();
      setExercises(loadedExercises);
    } catch (error) {
      console.error('Errore nel caricamento del glossario esercizi:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare il glossario esercizi',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  const handleOpenDialog = (exercise?: ExerciseGlossary) => {
    if (exercise) {
      setCurrentExercise(exercise);
      setIsEditing(true);
    } else {
      setCurrentExercise({
        name: '',
        description: '',
        images: []
      });
      setIsEditing(false);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentExercise({
      name: '',
      description: '',
      images: []
    });
  };

  const handleImageUpload = async (file: File) => {
    try {
      const imageBase64 = await processImageForUpload(file, 800, 600);
      setCurrentExercise(prev => ({
        ...prev,
        images: [...(prev.images || []), imageBase64]
      }));
      
      toast({
        title: 'Immagine caricata',
        description: 'L\'immagine è stata aggiunta all\'esercizio'
      });
    } catch (error) {
      toast({
        title: 'Errore',
        description: error instanceof Error ? error.message : 'Impossibile caricare l\'immagine',
        variant: 'destructive'
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    setCurrentExercise(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index)
    }));
  };

  const handleSaveExercise = async () => {
    if (!currentExercise.name) {
      toast({
        title: 'Errore',
        description: 'Il nome dell\'esercizio è obbligatorio',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (isEditing && currentExercise.id) {
        // Aggiorna esercizio esistente
        await dbOps.updateExerciseGlossary(currentExercise.id, currentExercise as ExerciseGlossary);
        toast({
          title: 'Esercizio aggiornato',
          description: `L'esercizio "${currentExercise.name}" è stato aggiornato`
        });
      } else {
        // Crea nuovo esercizio
        const newExercise: ExerciseGlossary = {
          ...currentExercise as ExerciseGlossary,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await dbOps.createExerciseGlossary(newExercise);
        toast({
          title: 'Esercizio creato',
          description: `L'esercizio "${newExercise.name}" è stato creato`
        });
      }
      
      handleCloseDialog();
      loadExercises();
    } catch (error) {
      console.error('Errore nel salvataggio dell\'esercizio:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile salvare l\'esercizio',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteExercise = async (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo esercizio?')) {
      try {
        await dbOps.deleteExerciseGlossary(id);
        toast({
          title: 'Esercizio eliminato',
          description: 'L\'esercizio è stato eliminato con successo'
        });
        loadExercises();
      } catch (error) {
        console.error('Errore nell\'eliminazione dell\'esercizio:', error);
        toast({
          title: 'Errore',
          description: 'Impossibile eliminare l\'esercizio',
          variant: 'destructive'
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-2 w-full">
            <Button
              onClick={() => generatePDF(true)}
              variant="outline"
              className="flex items-center gap-2 w-full"
            >
              Anteprima
            </Button>
            <Button
              onClick={() => generatePDF(false)}
              variant="outline"
              className="flex items-center gap-2 w-full"
            >
              <Download size={16} />
              Esporta PDF
            </Button>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-gradient-primary hover:opacity-90 transition-opacity w-full"
            >
              <Plus className="mr-2" size={16} />
              Nuovo Esercizio
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <p>Caricamento...</p>
        </div>
      ) : exercises.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Nessun esercizio nel glossario
          </p>
          <Button
            onClick={() => handleOpenDialog()}
            variant="outline"
            className="bg-white dark:bg-gray-800"
          >
            <Plus className="mr-2" size={16} />
            Aggiungi il primo esercizio
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((exercise) => (
            <Card key={exercise.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg flex justify-between items-center">
                  <span className="truncate">{exercise.name}</span>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-blue-500"
                      onClick={() => handleOpenDialog(exercise)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500"
                      onClick={() => handleDeleteExercise(exercise.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {exercise.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                    {exercise.description}
                  </p>
                )}
                {exercise.images && exercise.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {exercise.images.slice(0, 2).map((img, index) => (
                      <div key={index} className="w-16 h-16 rounded overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                        <img src={img} alt={`Immagine ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {exercise.images.length > 2 && (
                      <div className="w-16 h-16 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs">
                        +{exercise.images.length - 2}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Modifica Esercizio' : 'Nuovo Esercizio'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right">Nome</label>
              <Input
                id="name"
                value={currentExercise.name || ''}
                onChange={(e) => setCurrentExercise({ ...currentExercise, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <label htmlFor="description" className="text-right">Descrizione</label>
              <Textarea
                id="description"
                value={currentExercise.description || ''}
                onChange={(e) => setCurrentExercise({ ...currentExercise, description: e.target.value })}
                className="col-span-3 min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <label className="text-right">Immagini</label>
              <div className="col-span-3">
                <div className="flex flex-wrap gap-2 mb-4">
                  {currentExercise.images && currentExercise.images.map((img, index) => (
                    <div key={index} className="relative w-24 h-24 rounded overflow-hidden border border-gray-200 dark:border-gray-700">
                      <img src={img} alt={`Anteprima ${index + 1}`} className="w-full h-full object-cover" />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 rounded-full"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 flex items-center justify-center gap-2"
                >
                  <Image size={16} />
                  Aggiungi Immagine
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(file);
                      e.target.value = ''; // Reset input
                    }
                  }}
                  className="hidden"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Annulla</Button>
            <Button onClick={handleSaveExercise} className="bg-gradient-primary hover:opacity-90 transition-opacity">
              <Save className="mr-2" size={16} />
              {isEditing ? 'Aggiorna' : 'Salva'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}