import { useParams, useLocation, Link } from 'wouter';
import { useState } from 'react';
import { ArrowLeft, Edit, Copy, FileText, Save, Plus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkout, useUpdateWorkout } from '@/hooks/use-workouts';
import { useCoachProfile } from '@/hooks/use-clients';
import { useToast } from '@/hooks/use-toast';
import { pdfGenerator } from '@/lib/pdf-generator';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import type { Workout, Day, Exercise } from '@shared/schema';

export default function WorkoutDetail() {
  const params = useParams();
  const workoutId = params.id as string;
  const [, setLocation] = useLocation();
  const { data: workout, isLoading } = useWorkout(workoutId);
  const { data: coachProfile } = useCoachProfile();
  const updateWorkout = useUpdateWorkout();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedWorkout, setEditedWorkout] = useState<Workout | null>(null);

  if (isLoading || !workout) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-mobile-nav">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  const handleEdit = () => {
    setEditedWorkout({ ...workout });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editedWorkout) return;
    
    try {
      await updateWorkout.mutateAsync({
        id: workout.id,
        updates: {
          ...editedWorkout,
          updatedAt: new Date()
        }
      });
      
      toast({
        title: "Scheda aggiornata",
        description: "Le modifiche sono state salvate con successo"
      });
      
      setIsEditing(false);
      setEditedWorkout(null);
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile salvare le modifiche",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedWorkout(null);
  };

  const handleExportPDF = async () => {
    try {
      const blob = await pdfGenerator.generateWorkoutPDF(workout, coachProfile);
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
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile esportare il PDF",
        variant: "destructive"
      });
    }
  };

  const currentWorkout = isEditing ? editedWorkout : workout;
  const timeAgo = formatDistanceToNow(workout.updatedAt, {
    addSuffix: true,
    locale: it
  });

  // Early return if currentWorkout is not available
  if (!currentWorkout) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-mobile-nav">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-mobile-nav">
      {/* Header */}
      <div className="mb-8">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/workouts">
              <Button variant="ghost" size="sm" className="glass-effect">
                <ArrowLeft size={16} className="mr-2" />
                Indietro
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {currentWorkout.clientName}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentWorkout.workoutType} • {currentWorkout.duration} settimane • {timeAgo}
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <Button onClick={handleSave} disabled={updateWorkout.isPending} className="bg-emerald-500 hover:bg-emerald-600">
                  <Save size={16} className="mr-2" />
                  Salva
                </Button>
                <Button onClick={handleCancel} variant="outline">
                  Annulla
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleEdit} className="bg-indigo-500 hover:bg-indigo-600">
                  <Edit size={16} className="mr-2" />
                  Modifica
                </Button>
                <Button onClick={handleExportPDF} className="bg-orange-500 hover:bg-orange-600">
                  <FileText size={16} className="mr-2" />
                  Esporta PDF
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Header - Stack Layout */}
        <div className="md:hidden space-y-4">
          <div className="flex items-center justify-between">
            <Link href="/workouts">
              <Button variant="ghost" size="sm" className="glass-effect">
                <ArrowLeft size={16} className="mr-2" />
                Indietro
              </Button>
            </Link>
          </div>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {currentWorkout.clientName}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {currentWorkout.workoutType} • {currentWorkout.duration} settimane
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
              {timeAgo}
            </p>
          </div>

          <div className="flex flex-col space-y-2">
            {isEditing ? (
              <>
                <Button 
                  onClick={handleSave} 
                  disabled={updateWorkout.isPending} 
                  className="w-full bg-emerald-500 hover:bg-emerald-600"
                >
                  <Save size={16} className="mr-2" />
                  Salva Modifiche
                </Button>
                <Button onClick={handleCancel} variant="outline" className="w-full">
                  Annulla
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleEdit} className="w-full bg-indigo-500 hover:bg-indigo-600">
                  <Edit size={16} className="mr-2" />
                  Modifica Scheda
                </Button>
                <Button onClick={handleExportPDF} className="w-full bg-orange-500 hover:bg-orange-600">
                  <FileText size={16} className="mr-2" />
                  Esporta PDF
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <Card className="glass-effect rounded-2xl mb-8 animate-fade-in">
        <CardHeader>
          <CardTitle>Informazioni Generali</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Coach
            </label>
            {isEditing ? (
              <Input
                value={currentWorkout.coachName}
                onChange={(e) => setEditedWorkout({ ...currentWorkout, coachName: e.target.value })}
                className="glass-effect bg-white/50 dark:bg-gray-800/50"
              />
            ) : (
              <p className="text-gray-900 dark:text-white">{currentWorkout.coachName}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo di Scheda
            </label>
            {isEditing ? (
              <Input
                value={currentWorkout.workoutType}
                onChange={(e) => setEditedWorkout({ ...currentWorkout, workoutType: e.target.value })}
                className="glass-effect bg-white/50 dark:bg-gray-800/50"
              />
            ) : (
              <p className="text-gray-900 dark:text-white">{currentWorkout.workoutType}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrizione
            </label>
            {isEditing ? (
              <Textarea
                value={currentWorkout.description || ''}
                onChange={(e) => setEditedWorkout({ ...currentWorkout, description: e.target.value })}
                rows={3}
                className="glass-effect bg-white/50 dark:bg-gray-800/50"
              />
            ) : (
              <p className="text-gray-900 dark:text-white">{currentWorkout.description || 'Nessuna descrizione'}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Progression */}
      <Card className="glass-effect rounded-2xl mb-8 animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 text-indigo-500" size={20} />
            Progressione Settimanale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {(currentWorkout.weeks || []).map((week) => (
              <div key={week.id} className="border border-gray-200 dark:border-gray-600 rounded-xl p-4 bg-white/20 dark:bg-gray-800/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    Settimana {week.number}
                  </h3>
                </div>

                {week.notes && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">{week.notes}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {(week.days || []).map((day) => (
                    <div key={day.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-3 bg-white/30 dark:bg-gray-900/30">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                        {day.name}
                      </h4>

                      {day.notes && (
                        <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                          <p className="text-xs text-gray-600 dark:text-gray-400">{day.notes}</p>
                        </div>
                      )}

                      {(day.exercises || []).length > 0 ? (
                        <>
                          {/* Desktop Table View */}
                          <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm table-fixed">
                              <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-600">
                                  <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-300 w-1/2">Esercizio</th>
                                  <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-300 w-16">Serie</th>
                                  <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-300 w-20">Reps</th>
                                  <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-300 w-24">Carico</th>
                                  <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-300 w-28">Recupero</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(day.exercises || []).map((exercise) => (
                                  <tr key={exercise.id} className="border-b border-gray-100 dark:border-gray-700">
                                    <td className="py-2 px-2 align-top">
                                      <div className="flex items-start space-x-2 min-w-0">
                                        {exercise.imageUrl && (
                                          <img 
                                            src={exercise.imageUrl} 
                                            alt="Exercise" 
                                            className="w-8 h-8 object-cover rounded"
                                          />
                                        )}
                                        <span className="text-gray-900 dark:text-white break-words whitespace-normal block min-w-0">{exercise.name}</span>
                                      </div>
                                    </td>
                                    <td className="py-2 px-2 text-gray-700 dark:text-gray-300 break-words whitespace-normal align-top">{exercise.sets}</td>
                                    <td className="py-2 px-2 text-gray-700 dark:text-gray-300 break-words whitespace-normal align-top">{exercise.reps}</td>
                                    <td className="py-2 px-2 text-gray-700 dark:text-gray-300 break-words whitespace-normal align-top">{exercise.load || '-'}</td>
                                    <td className="py-2 px-2 text-gray-700 dark:text-gray-300 break-words whitespace-normal align-top">{exercise.rest || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Mobile Card View */}
                          <div className="md:hidden space-y-3">
                            {(day.exercises || []).map((exercise) => (
                              <div key={exercise.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-2">
                                <div className="flex items-center space-x-2">
                                  {exercise.imageUrl && (
                                    <img 
                                      src={exercise.imageUrl} 
                                      alt="Exercise" 
                                      className="w-10 h-10 object-cover rounded"
                                    />
                                  )}
                                  <h5 className="font-medium text-gray-900 dark:text-white text-sm">{exercise.name}</h5>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="font-medium text-gray-600 dark:text-gray-400">Serie:</span>
                                    <span className="ml-1 text-gray-900 dark:text-white">{exercise.sets}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600 dark:text-gray-400">Reps:</span>
                                    <span className="ml-1 text-gray-900 dark:text-white">{exercise.reps}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600 dark:text-gray-400">Carico:</span>
                                    <span className="ml-1 text-gray-900 dark:text-white">{exercise.load || '-'}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600 dark:text-gray-400">Recupero:</span>
                                    <span className="ml-1 text-gray-900 dark:text-white">{exercise.rest || '-'}</span>
                                  </div>
                                </div>
                                {exercise.notes && (
                                  <div className="pt-1 border-t border-gray-200 dark:border-gray-600">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">{exercise.notes}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                          Nessun esercizio per questo giorno
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dietary Advice */}
      {currentWorkout.dietaryAdvice && (
        <Card className="glass-effect rounded-2xl animate-fade-in">
          <CardHeader>
            <CardTitle>Consigli Dietistici</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={currentWorkout.dietaryAdvice}
                onChange={(e) => setEditedWorkout({ ...currentWorkout, dietaryAdvice: e.target.value })}
                rows={4}
                className="glass-effect bg-white/50 dark:bg-gray-800/50"
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {currentWorkout.dietaryAdvice}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}