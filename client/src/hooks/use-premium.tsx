import { useAuth } from './use-auth';

type PremiumFeature = 'workouts' | 'clients' | 'coach-settings';

export function usePremium() {
  const { user } = useAuth();
  const isLoggedIn = !!user;

  // Limiti per utenti non premium
  const LIMITS = {
    workouts: 3, // Massimo 3 schede
    clients: 2,  // Massimo 2 clienti
  };

  /**
   * Verifica se l'utente può accedere a una funzionalità premium
   * @param feature La funzionalità da verificare
   * @param currentCount Il numero attuale di elementi (per workouts e clients)
   * @returns true se l'utente può accedere alla funzionalità, false altrimenti
   */
  const canAccess = (feature: PremiumFeature, currentCount?: number): boolean => {
    // Se l'utente è loggato, ha accesso a tutte le funzionalità
    if (isLoggedIn) return true;
    
    // Altrimenti, verifica i limiti
    switch (feature) {
      case 'workouts':
        return currentCount !== undefined && currentCount < LIMITS.workouts;
      case 'clients':
        return currentCount !== undefined && currentCount < LIMITS.clients;
      case 'coach-settings':
        return false; // Utenti non loggati non possono modificare le impostazioni coach
      default:
        return false;
    }
  };

  return {
    isLoggedIn,
    canAccess,
    LIMITS
  };
}