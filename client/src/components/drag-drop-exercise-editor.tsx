import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Plus, Minus, GripVertical, Calendar, Dumbbell, BookOpen, ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { Exercise, Day, Week, ExerciseGlossary } from '@shared/schema';
import { ExerciseGlossarySelector } from './exercise-glossary-selector';
import { useAuth } from '../hooks/use-auth';

import { LoginDialogControlled } from './login-dialog-controlled';
import { usePDFGenerator } from '../hooks/use-pdf-generator';
import type { Workout } from '@shared/schema';

interface DragDropExerciseEditorProps {
  weeks: Week[];
  onWeeksChange: (weeks: Week[]) => void;
}

const DragDropExerciseEditor: React.FC<DragDropExerciseEditorProps> = ({
  weeks,
  onWeeksChange,
}) => {
  const { user } = useAuth();
  const pdfGenerator = usePDFGenerator();
  const [glossarySelectorOpen, setGlossarySelectorOpen] = useState(false);
  const [currentDayId, setCurrentDayId] = useState<string | null>(null);
  const [currentWeekId, setCurrentWeekId] = useState<string | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [showPreview, setShowPreview] = useState(() => {
    try {
      return localStorage.getItem('dde_showPreview') === 'true';
    } catch { return false; }
  });
  const [collapsedWeeks, setCollapsedWeeks] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem('dde_collapsedWeeks');
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem('dde_collapsedDays');
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });
  // Rileva se siamo su mobile per disabilitare il drag & drop
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    try {
      const mql = window.matchMedia('(pointer: coarse), (max-width: 640px)');
      const update = () => setIsMobile(mql.matches);
      update();
      mql.addEventListener('change', update);
      return () => mql.removeEventListener('change', update);
    } catch {
      setIsMobile(window.innerWidth <= 640);
    }
  }, []);

  // Salva la preferenza dell'anteprima
  useEffect(() => {
    try {
      localStorage.setItem('dde_showPreview', showPreview.toString());
    } catch {}
  }, [showPreview]);

  // Cleanup dell'URL del PDF quando il componente viene smontato
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  // Genera l'anteprima PDF quando cambiano le settimane o quando viene attivata l'anteprima
  useEffect(() => {
    if (showPreview && weeks.length > 0) {
      generatePdfPreview();
    } else {
      // Pulisci l'URL quando l'anteprima è disattivata
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
        setPdfPreviewUrl(null);
      }
    }
  }, [showPreview, weeks]);

  const generatePdfPreview = async () => {
    if (!showPreview || weeks.length === 0) return;
    
    setIsGeneratingPreview(true);
    try {
      // Crea un workout temporaneo per la preview
      const tempWorkout: Workout = {
        id: 'preview',
        clientName: 'Anteprima Cliente',
        coachId: user?.id || '',
        workoutType: 'Scheda Personalizzata',
        description: 'Anteprima in tempo reale',
        weeks: weeks,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Genera il PDF
      const pdfBlob = await pdfGenerator.generateWorkoutPDF(tempWorkout);
      
      // Revoca l'URL precedente se esiste
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
      
      // Crea un nuovo URL per il blob
      const newUrl = URL.createObjectURL(pdfBlob);
      setPdfPreviewUrl(newUrl);
    } catch (error) {
      console.error('Errore nella generazione dell\'anteprima PDF:', error);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  // Funzione per generare un ID univoco
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Funzione helper per mostrare il dialog di login
  const requireAuth = () => {
    setShowLoginDialog(true);
  };

  // Funzioni per la gestione delle settimane
  const addWeek = () => {
    if (!user) {
      requireAuth();
      return;
    }
    const newWeek: Week = {
      number: weeks.length + 1,
      id: generateId(),
      name: `Settimana ${weeks.length + 1}`,
      days: [],
      notes: '',
    };
    onWeeksChange([...weeks, newWeek]);
  };

  const updateWeek = (weekId: string, field: keyof Week, value: any) => {
    if (!user) {
      requireAuth();
      return;
    }
    const updatedWeeks = weeks.map((week) =>
      week.id === weekId ? { ...week, [field]: value } : week
    );
    onWeeksChange(updatedWeeks);
  };

  const removeWeek = (weekId: string) => {
    if (!user) {
      requireAuth();
      return;
    }
    const updatedWeeks = weeks.filter((week) => week.id !== weekId);
    onWeeksChange(updatedWeeks);
  };

  // Funzioni per la gestione dei giorni
  const addDay = (weekId: string) => {
    if (!user) {
      requireAuth();
      return;
    }
    const newDay: Day = {
      id: generateId(),
      name: 'Nuovo Giorno',
      exercises: [],
      notes: '',
    };

    const updatedWeeks = weeks.map((week) =>
      week.id === weekId
        ? { ...week, days: [...(week.days || []), newDay] }
        : week
    );
    onWeeksChange(updatedWeeks);
  };

  const updateDay = (weekId: string, dayId: string, field: keyof Day, value: any) => {
    if (!user) {
      requireAuth();
      return;
    }
    const updatedWeeks = weeks.map((week) =>
      week.id === weekId
        ? {
            ...week,
            days: (week.days || []).map((day) =>
              day.id === dayId ? { ...day, [field]: value } : day
            ),
          }
        : week
    );
    onWeeksChange(updatedWeeks);
  };

  const removeDay = (weekId: string, dayId: string) => {
    if (!user) {
      requireAuth();
      return;
    }
    const updatedWeeks = weeks.map((week) =>
      week.id === weekId
        ? {
            ...week,
            days: (week.days || []).filter((day) => day.id !== dayId),
          }
        : week
    );
    onWeeksChange(updatedWeeks);
  };

  // Funzioni per la gestione degli esercizi
  const addExercise = (weekId: string, dayId: string) => {
    if (!user) {
      requireAuth();
      return;
    }
    const newExercise: Exercise = {
      id: generateId(),
      name: '',
      sets: '3',
      reps: '10',
      order: 0, // Add required order property
      rest: '60',
      notes: '',
    };

    const updatedWeeks = weeks.map((week) =>
      week.id === weekId
        ? {
            ...week,
            days: (week.days || []).map((day) =>
              day.id === dayId
                ? {
                    ...day,
                    exercises: [...(day.exercises || []), newExercise],
                  }
                : day
            ),
          }
        : week
    );
    onWeeksChange(updatedWeeks);
  };
  
  const openGlossarySelector = (dayId: string, weekId: string) => {
    if (!user) {
      requireAuth();
      return;
    }
    setCurrentDayId(dayId);
    setCurrentWeekId(weekId);
    setGlossarySelectorOpen(true);
  };

  const handleSelectGlossaryExercise = (glossaryExercise: ExerciseGlossary) => {
    if (!currentDayId || !currentWeekId) return;

    const newExercise: Exercise = {
      id: generateId(),
      name: glossaryExercise.name,
      sets: '3',
      reps: '10',
      order: 0,
      rest: '60',
      notes: '',
      glossaryId: glossaryExercise.id
    };  

    const updatedWeeks = weeks.map((week) =>
      week.id === currentWeekId
        ? {
            ...week,
            days: (week.days || []).map((day) =>
              day.id === currentDayId
                ? {
                    ...day,
                    exercises: [...(day.exercises || []), newExercise],
                  }
                : day
            ),
          }
        : week
    );
    onWeeksChange(updatedWeeks);
  };

  const updateExercise = (
    weekId: string,
    dayId: string,
    exerciseId: string,
    field: keyof Exercise,
    value: any
  ) => {
    if (!user) {
      requireAuth();
      return;
    }
    const updatedWeeks = weeks.map((week) =>
      week.id === weekId
        ? {
            ...week,
            days: (week.days || []).map((day) =>
              day.id === dayId
                ? {
                    ...day,
                    exercises: (day.exercises || []).map((exercise) =>
                      exercise.id === exerciseId
                        ? { ...exercise, [field]: value }
                        : exercise
                    ),
                  }
                : day
            ),
          }
        : week
    );
    onWeeksChange(updatedWeeks);
  };

  const removeExercise = (weekId: string, dayId: string, exerciseId: string) => {
    if (!user) {
      requireAuth();
      return;
    }
    const updatedWeeks = weeks.map((week) =>
      week.id === weekId
        ? {
            ...week,
            days: (week.days || []).map((day) =>
              day.id === dayId
                ? {
                    ...day,
                    exercises: (day.exercises || []).filter(
                      (exercise) => exercise.id !== exerciseId
                    ),
                  }
                : day
            ),
          }
        : week
    );
    onWeeksChange(updatedWeeks);
  };

  // Gestione del drag and drop
  const handleDragEnd = (result: any) => {
    if (!user) {
      requireAuth();
      return;
    }
    
    const { source, destination, type } = result;

    // Dropped outside the list
    if (!destination) {
      return;
    }

    // Se la posizione di origine e destinazione sono le stesse
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Gestione del drag and drop per le settimane
    if (type === 'week') {
      const reorderedWeeks = Array.from(weeks);
      const [removed] = reorderedWeeks.splice(source.index, 1);
      reorderedWeeks.splice(destination.index, 0, removed);
      onWeeksChange(reorderedWeeks);
      return;
    }

    // Gestione del drag and drop per i giorni all'interno di una settimana
    if (type === 'day') {
      const weekSourceId = source.droppableId.split('::')[1];
      const weekDestId = destination.droppableId.split('::')[1];

      // Se il drag and drop avviene all'interno della stessa settimana
      if (weekSourceId === weekDestId) {
        const weekIndex = weeks.findIndex((week) => week.id === weekSourceId);
        if (weekIndex === -1) return;
        const week = weeks[weekIndex];
        const days = Array.from(week.days || []);
        const [removed] = days.splice(source.index, 1);
        days.splice(destination.index, 0, removed);

        const updatedWeeks = [...weeks];
        updatedWeeks[weekIndex] = { ...week, days };
        onWeeksChange(updatedWeeks);
      } else {
        // Se il drag and drop avviene tra settimane diverse
        const sourceWeekIndex = weeks.findIndex((week) => week.id === weekSourceId);
        const destWeekIndex = weeks.findIndex((week) => week.id === weekDestId);

        if (sourceWeekIndex === -1 || destWeekIndex === -1) return;

        const sourceWeek = weeks[sourceWeekIndex];
        const destWeek = weeks[destWeekIndex];

        const sourceDays = Array.from(sourceWeek.days || []);
        const destDays = Array.from(destWeek.days || []);

        const [removed] = sourceDays.splice(source.index, 1);
        destDays.splice(destination.index, 0, removed);

        const updatedWeeks = [...weeks];
        updatedWeeks[sourceWeekIndex] = { ...sourceWeek, days: sourceDays };
        updatedWeeks[destWeekIndex] = { ...destWeek, days: destDays };
        onWeeksChange(updatedWeeks);
      }
      return;
    }

    // Gestione del drag and drop per gli esercizi all'interno di un giorno
    if (type === 'exercise') {
      const [, weekId, dayId] = source.droppableId.split('::');
      const [, destWeekId, destDayId] = destination.droppableId.split('::');

      // Se il drag and drop avviene all'interno dello stesso giorno
      if (weekId === destWeekId && dayId === destDayId) {
          const weekIndex = weeks.findIndex((week) => week.id === weekId);
          if (weekIndex === -1) return;
          const dayIndex = weeks[weekIndex].days?.findIndex((day) => day.id === dayId) || 0;
          const day = weeks[weekIndex].days?.[dayIndex];

        if (day) {
          const exercises = Array.from(day.exercises || []);
          const [removed] = exercises.splice(source.index, 1);
          exercises.splice(destination.index, 0, removed);

          const updatedWeeks = [...weeks];
          const updatedDays = [...(updatedWeeks[weekIndex].days || [])];
          updatedDays[dayIndex] = { ...day, exercises };
          updatedWeeks[weekIndex] = { ...updatedWeeks[weekIndex], days: updatedDays };
          onWeeksChange(updatedWeeks);
        }
      } else {
        // Se il drag and drop avviene tra giorni diversi
        const sourceWeekIndex = weeks.findIndex((week) => week.id === weekId);
        const sourceDayIndex = weeks[sourceWeekIndex].days?.findIndex((day) => day.id === dayId) || 0;
        const sourceDay = weeks[sourceWeekIndex].days?.[sourceDayIndex];

        const destWeekIndex = weeks.findIndex((week) => week.id === destWeekId);
        const destDayIndex = weeks[destWeekIndex].days?.findIndex((day) => day.id === destDayId) || 0;
        const destDay = weeks[destWeekIndex].days?.[destDayIndex];

        if (sourceDay && destDay) {
          const sourceExercises = Array.from(sourceDay.exercises || []);
          const destExercises = Array.from(destDay.exercises || []);

          const [removed] = sourceExercises.splice(source.index, 1);
          destExercises.splice(destination.index, 0, removed);

          const updatedWeeks = [...weeks];
          
          // Aggiorna il giorno di origine
          const updatedSourceDays = [...(updatedWeeks[sourceWeekIndex].days || [])];
          updatedSourceDays[sourceDayIndex] = { ...sourceDay, exercises: sourceExercises };
          updatedWeeks[sourceWeekIndex] = { ...updatedWeeks[sourceWeekIndex], days: updatedSourceDays };
          
          // Aggiorna il giorno di destinazione
          const updatedDestDays = [...(updatedWeeks[destWeekIndex].days || [])];
          updatedDestDays[destDayIndex] = { ...destDay, exercises: destExercises };
          updatedWeeks[destWeekIndex] = { ...updatedWeeks[destWeekIndex], days: updatedDestDays };
          
          onWeeksChange(updatedWeeks);
        }
      }
    }
  };

  // Se l'utente non è loggato, mostra solo il messaggio di autenticazione
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
        <div className="text-center p-8">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
              <Dumbbell className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Accesso Richiesto
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Per utilizzare l'editor Drag & Drop devi essere registrato e aver effettuato l'accesso.
            </p>
          </div>
          
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`${showPreview ? 'flex gap-4 h-screen w-screen fixed top-0 left-0 z-40 bg-white dark:bg-gray-900' : 'w-full'}`}>
        {/* PDF Preview Panel - Ora a sinistra */}
        {showPreview && (
          <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 pr-4 h-full overflow-hidden">
            <div className="h-full flex flex-col p-4">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Anteprima PDF
                </h3>
                <div className="flex items-center gap-2">
                  {isGeneratingPreview && (
                    <div className="flex items-center text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Generando...
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    title="Chiudi anteprima"
                  >
                    <EyeOff size={16} />
                  </Button>
                </div>
              </div>
              
              {pdfPreviewUrl ? (
                <iframe
                  src={pdfPreviewUrl}
                  className="w-full flex-1 border border-gray-300 dark:border-gray-600 rounded-lg"
                  title="Anteprima PDF Workout"
                />
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                      <Eye className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                      {weeks.length === 0 
                        ? 'Aggiungi delle settimane per vedere l\'anteprima' 
                        : 'Generazione anteprima in corso...'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Editor Panel - Ora a destra */}
        <div className={`${showPreview ? 'w-1/2 h-full overflow-y-auto p-4' : 'w-full'} space-y-6 overflow-x-hidden`}>
          <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="weeks" type="week" isDropDisabled={isMobile}>
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-6"
              >
                {weeks.map((week, weekIndex) => (
                  <Draggable
                    key={week.id}
                    draggableId={week.id}
                    index={weekIndex}
                    isDragDisabled={isMobile}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="glass-effect rounded-2xl p-3 sm:p-4 mb-6 shadow-sm border border-gray-100 dark:border-gray-800 animate-fade-in"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center mb-4">
                          <div
                            {...provided.dragHandleProps}
                            className="hidden sm:block mr-2 ml-0 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-grab active:cursor-grabbing"
                          >
                            <GripVertical size={20} />
                          </div>
                          <Input
                            value={week.name}
                            onChange={(e) =>
                              updateWeek(week.id, 'name', e.target.value)
                            }
                            className="flex-1 text-base sm:text-lg font-semibold glass-effect bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm"
                            placeholder="Nome Settimana"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setCollapsedWeeks(prev => {
                              const next = { ...prev, [week.id]: !prev[week.id] };
                              try { localStorage.setItem('dde_collapsedWeeks', JSON.stringify(next)); } catch {}
                              return next;
                            })}
                            className="ml-0 sm:ml-2"
                          >
                            {collapsedWeeks[week.id] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeWeek(week.id)}
                            className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                          >
                            <Minus size={16} />
                          </Button>
                        </div>

                        {!collapsedWeeks[week.id] && (
                          <Textarea
                            value={week.notes || ''}
                            onChange={(e) =>
                              updateWeek(week.id, 'notes', e.target.value)
                            }
                            placeholder="Note per questa settimana..."
                            className="mb-4 glass-effect bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm resize-none"
                            rows={2}
                          />
                        )}

                        {!collapsedWeeks[week.id] && (
                          <Droppable
                            droppableId={`days::${week.id}`}
                            type="day"
                            isDropDisabled={isMobile}
                          >
                          {(provided) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className="space-y-4"
                            >
                            {(week.days || []).map((day, dayIndex) => (
                              <Draggable
                                key={day.id}
                                draggableId={day.id}
                                index={dayIndex}
                                isDragDisabled={isMobile}
                              >
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className="border border-gray-100 dark:border-gray-800 rounded-lg p-3 sm:p-4 bg-white/30 dark:bg-gray-900/30 shadow-sm"
                                  >
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center mb-3">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="hidden sm:block mr-2 ml-0 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-grab active:cursor-grabbing"
                                      >
                                        <GripVertical size={16} />
                                      </div>
                                      <Calendar size={16} className="mr-2 text-indigo-500" />
                                      <Input
                                        value={day.name}
                                        onChange={(e) =>
                                          updateDay(
                                            week.id,
                                            day.id,
                                            'name',
                                            e.target.value
                                          )
                                        }
                                        className="flex-1 glass-effect bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                                        placeholder="Nome Giorno"
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setCollapsedDays(prev => {
                                          const next = { ...prev, [day.id]: !prev[day.id] };
                                          try { localStorage.setItem('dde_collapsedDays', JSON.stringify(next)); } catch {}
                                          return next;
                                        })}
                                        className="ml-0 sm:ml-2"
                                      >
                                        {collapsedDays[day.id] ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeDay(week.id, day.id)}
                                        className="ml-0 sm:ml-2 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                                      >
                                        <Minus size={16} />
                                      </Button>
                                    </div>

                                    {!collapsedDays[day.id] && (
                                      <Textarea
                                        value={day.notes || ''}
                                        onChange={(e) =>
                                          updateDay(
                                            week.id,
                                            day.id,
                                            'notes',
                                            e.target.value
                                          )
                                        }
                                        placeholder="Note per questo giorno..."
                                        className="mb-3 glass-effect bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm resize-none"
                                        rows={2}
                                      />
                                    )}

                                    {!collapsedDays[day.id] && (
                                      <Droppable
                                        droppableId={`exercises::${week.id}::${day.id}`}
                                        type="exercise"
                                        isDropDisabled={isMobile}
                                      >
                                        {(provided) => (
                                          <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className="space-y-3"
                                          >
                                          {(day.exercises || []).map(
                                            (exercise, exerciseIndex) => (
                                              <Draggable
                                                key={exercise.id}
                                                draggableId={exercise.id}
                                                index={exerciseIndex}
                                                isDragDisabled={isMobile}
                                              >
                                                {(provided) => (
                                                  <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2.5 sm:p-3 border border-gray-100 dark:border-gray-800"
                                                  >
                                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 mb-2">
                                                      <div
                                                        {...provided.dragHandleProps}
                                                        className="mr-2 -ml-1 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-grab active:cursor-grabbing"
                                                      >
                                                        <GripVertical size={16} />
                                                      </div>
                                                      <Dumbbell size={16} className="mr-2 text-emerald-500" />
                                                      <Input
                                                        value={exercise.name}
                                                        onChange={(e) =>
                                                          updateExercise(
                                                            week.id,
                                                            day.id,
                                                            exercise.id,
                                                            'name',
                                                            e.target.value
                                                          )
                                                        }
                                                        className="w-full sm:flex-1 text-sm sm:text-base text-gray-900 dark:text-gray-100 glass-effect bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm"
                                                        placeholder="Nome Esercizio"
                                                      />
                                                      <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                          openGlossarySelector(day.id, week.id)
                                                        }
                                                        className="ml-0 sm:ml-2 text-xs px-2 py-0 h-8"
                                                      >
                                                        <BookOpen size={12} className="mr-1" />
                                                        Glossario
                                                      </Button>
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                          removeExercise(
                                                            week.id,
                                                            day.id,
                                                            exercise.id
                                                          )
                                                        }
                                                        className="ml-0 sm:ml-1 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                                                      >
                                                        <Minus size={16} />
                                                      </Button>
                                                    </div>

                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                      <div>
                                                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                                                          Serie
                                                        </label>
                                                        <Input
                                                          type="number"
                                                          min="1"
                                                          value={exercise.sets}
                                                          onChange={(e) =>
                                                            updateExercise(
                                                              week.id,
                                                              day.id,
                                                              exercise.id,
                                                              'sets',
                                                              parseInt(e.target.value)
                                                            )
                                                          }
                                                          className="glass-effect bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm"
                                                        />
                                                      </div>
                                                      <div>
                                                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                                                          Reps
                                                        </label>
                                                        <Input
                                                          value={exercise.reps}
                                                          onChange={(e) =>
                                                            updateExercise(
                                                              week.id,
                                                              day.id,
                                                              exercise.id,
                                                              'reps',
                                                              e.target.value
                                                            )
                                                          }
                                                          className="glass-effect bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm"
                                                          placeholder="10-12"
                                                        />
                                                      </div>
                                                      <div>
                                                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                                                          Recupero (sec)
                                                        </label>
                                                        <Input
                                                          value={exercise.rest}
                                                          onChange={(e) =>
                                                            updateExercise(
                                                              week.id,
                                                              day.id,
                                                              exercise.id,
                                                              'rest',
                                                              e.target.value
                                                            )
                                                          }
                                                          className="glass-effect bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm"
                                                          placeholder="60"
                                                        />
                                                      </div>
                                                    </div>

                                                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                                                      <Textarea
                                                        value={exercise.notes || ''}
                                                        onChange={(e) =>
                                                          updateExercise(
                                                            week.id,
                                                            day.id,
                                                            exercise.id,
                                                            'notes',
                                                            e.target.value
                                                          )
                                                        }
                                                        placeholder="Note per questo esercizio..."
                                                        className="glass-effect bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm resize-none"
                                                        rows={2}
                                                      />
                                                    </div>
                                                  </div>
                                                )}
                                              </Draggable>
                                            )
                                          )}
                                          {provided.placeholder}
                                        </div>
                                      )}
                                    </Droppable>
                                    )}

                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => addExercise(week.id, day.id)}
                                      className="mt-3 w-full text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-900/20"
                                    >
                                      <Plus size={16} className="mr-1" /> Aggiungi Esercizio
                                    </Button>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addDay(week.id)}
                        className="mt-4 w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-900/20"
                      >
                        <Plus size={16} className="mr-1" /> Aggiungi Giorno
                      </Button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
            <Button
              type="button"
              variant="outline"
              onClick={addWeek}
              className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/20"
            >
              <Plus size={16} className="mr-1" /> Aggiungi Settimana
            </Button>
          </DragDropContext>
        </div>
      </div>

      {/* Floating Toggle Button */}
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={() => {
          const newShowPreview = !showPreview;
          setShowPreview(newShowPreview);
          localStorage.setItem('dde_showPreview', JSON.stringify(newShowPreview));
        }}
        className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 shadow-lg border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
        <span className="ml-2">{showPreview ? 'Nascondi' : 'Anteprima'}</span>
      </Button>
      
      <ExerciseGlossarySelector
        open={glossarySelectorOpen}
        onOpenChange={setGlossarySelectorOpen}
        onSelectExercise={handleSelectGlossaryExercise}
      />
      
      <LoginDialogControlled
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
      />
    </>
  );
};

export default DragDropExerciseEditor;