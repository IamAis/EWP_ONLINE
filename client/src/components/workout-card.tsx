import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { Edit, Copy, FileText, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useDeleteWorkout } from '@/hooks/use-workouts';
import { useCoachProfile } from '@/hooks/use-clients';
import { pdfGenerator } from '@/lib/pdf-generator';
import { Link } from 'wouter';
import type { Workout } from '@shared/schema';

interface WorkoutCardProps {
  workout: Workout;
  onEdit?: (workout: Workout) => void;
  onDuplicate?: (workout: Workout) => void;
}

export function WorkoutCard({ workout, onEdit, onDuplicate }: WorkoutCardProps) {
  const { toast } = useToast();
  const { data: coachProfile } = useCoachProfile();
  const deleteWorkout = useDeleteWorkout();

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

  const handleDelete = async () => {
    try {
      await deleteWorkout.mutateAsync(workout.id);
      toast({
        title: "Scheda eliminata",
        description: "La scheda è stata rimossa con successo"
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile eliminare la scheda",
        variant: "destructive"
      });
    }
  };

  const timeAgo = formatDistanceToNow(workout.updatedAt, {
    addSuffix: true,
    locale: it
  });

  return (
    <div className="p-4 bg-white/30 dark:bg-gray-800/30 rounded-xl hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-200 cursor-pointer animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate pr-2">
          {workout.name || `Scheda ${workout.clientName}`}
        </h4>
        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
          {timeAgo}
        </span>
      </div>
      
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
        Cliente: {workout.clientName}
      </p>
      
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
        {workout.workoutType} • {workout.duration} settimane
      </p>
      
      <div className="flex items-center justify-between">
        <div className="flex space-x-1">
          <Link href={`/workout/${workout.id}`}>
            <Button
              size="sm"
              variant="ghost"
              className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <Eye size={12} />
            </Button>
          </Link>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(workout);
            }}
            className="p-1 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
          >
            <Edit size={12} />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate?.(workout);
            }}
            className="p-1 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
          >
            <Copy size={12} />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleExportPDF();
            }}
            className="p-1 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20"
          >
            <FileText size={12} />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => e.stopPropagation()}
                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 size={12} />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminare la scheda?</AlertDialogTitle>
                <AlertDialogDescription>
                  Questa azione non può essere annullata. La scheda di "{workout.clientName}" sarà eliminata definitivamente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annulla</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  Elimina
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full ${
            Date.now() - workout.updatedAt.getTime() < 7 * 24 * 60 * 60 * 1000 
              ? 'bg-emerald-400 animate-pulse-soft' 
              : 'bg-gray-300 dark:bg-gray-600'
          }`} />
        </div>
      </div>
    </div>
  );
}
