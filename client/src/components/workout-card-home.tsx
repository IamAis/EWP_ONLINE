import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { Eye, FileText, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { WorkoutBuilder } from '@/components/workout-builder';
import { useToast } from '@/hooks/use-toast';
import { useCoachProfile } from '@/hooks/use-clients';
import { pdfGenerator } from '@/lib/pdf-generator';
import { Link } from 'wouter';
import type { Workout } from '@shared/schema';
import { useState } from 'react';

interface WorkoutCardHomeProps {
  workout: Workout;
}

export function WorkoutCardHome({ workout }: WorkoutCardHomeProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();
  const { data: coachProfile } = useCoachProfile();

  const handleExportPDF = async () => {
    try {
      const blob = await pdfGenerator.generateWorkoutPDF(workout, coachProfile);
      const filename = `scheda-${workout.clientName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      
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

          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => e.stopPropagation()}
                className="p-1 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
              >
                <Edit size={12} />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Modifica Scheda - {workout.clientName}</DialogTitle>
              </DialogHeader>
              <WorkoutBuilder 
                existingWorkout={workout}
                onSuccess={() => setShowEditDialog(false)}
              />
            </DialogContent>
          </Dialog>
          
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