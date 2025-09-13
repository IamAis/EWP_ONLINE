import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from './ui/dialog';
import { Button } from './ui/button';
import { LoginDialog } from './login-dialog';

type PremiumDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: 'workouts' | 'clients' | 'coach-settings';
};

export function PremiumDialog({ open, onOpenChange, feature }: PremiumDialogProps) {
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const featureText = {
    'workouts': 'più di 3 schede di allenamento',
    'clients': 'più di 2 clienti',
    'coach-settings': 'le impostazioni Coach'
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              Funzionalità Premium
            </DialogTitle>
            <DialogDescription className="pt-4 text-base">
              Per {feature ? `utilizzare ${featureText[feature]}` : 'accedere a questa funzionalità premium'}, 
              è necessario creare un account <b>Premium</b>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col space-y-4 py-4">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Vantaggi dell'account</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="mr-2 text-indigo-600 dark:text-indigo-400">✓</span>
                  <span>Schede di allenamento illimitate</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-indigo-600 dark:text-indigo-400">✓</span>
                  <span>Clienti illimitati</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-indigo-600 dark:text-indigo-400">✓</span>
                  <span>Personalizzazione completa delle impostazioni Coach</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-indigo-600 dark:text-indigo-400">✓</span>
                  <span>Backup in <b>Cloud</b> dei <b>tuoi Dati</b></span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-indigo-600 dark:text-indigo-400">✓</span>
                  <span>Inclusione degli esercizi dal <b>Glossario</b> direttamente nelle tue Schede</span>
                </li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="sm:w-auto w-full">
              Continua senza account
            </Button>
            
            <LoginDialog trigger={<Button 
              className="bg-gradient-primary hover:opacity-90 transition-opacity sm:w-auto w-full">
              Crea account gratuito
            </Button>} />

          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}