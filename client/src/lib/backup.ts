import { dbOps } from './database';
import type { Workout, Client, CoachProfile } from '@shared/schema';

export class BackupManager {
  static async exportToJSON(): Promise<void> {
    try {
      const data = await dbOps.exportData();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fittracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('Errore durante l\'esportazione dei dati');
    }
  }

  static async importFromJSON(file: File): Promise<void> {
    try {
      console.log('🔄 Inizio importazione file:', file.name, 'Dimensione:', file.size, 'bytes');
      
      const text = await file.text();
      console.log('📄 File letto, lunghezza testo:', text.length);
      
      let data;
      try {
        data = JSON.parse(text);
        console.log('✅ JSON parsing riuscito', data);
      } catch (parseError) {
        console.error('❌ Errore parsing JSON:', parseError);
        throw new Error('File JSON non valido');
      }
      
      // Validate the structure
      console.log('🔍 Validazione struttura dati...');
      if (!this.isValidBackupData(data)) {
        console.error('❌ Struttura dati non valida:', data);
        throw new Error('Formato del file di backup non valido');
      }
      console.log('✅ Struttura dati valida');

      // Convert date strings back to Date objects
      console.log('🔄 Conversione date...');
      const processedData = this.processImportData(data);
      console.log('✅ Dati processati:', processedData);
      
      console.log('💾 Importazione nel database...');
      await dbOps.importData(processedData);
      console.log('✅ Importazione completata con successo!');
      
    } catch (error) {
      console.error('❌ Errore completo durante importazione:', error);
      if (error instanceof Error) {
        throw new Error(`Errore durante l'importazione: ${error.message}`);
      } else {
        throw new Error('Errore sconosciuto durante l\'importazione dei dati');
      }
    }
  }

  private static isValidBackupData(data: any): boolean {
    console.log('🔍 Controllo validità:', {
      isObject: typeof data === 'object',
      notNull: data !== null,
      workouts: data?.workouts,
      clients: data?.clients,
      coachProfile: data?.coachProfile,
      workoutsValid: Array.isArray(data?.workouts) || data?.workouts === undefined,
      clientsValid: Array.isArray(data?.clients) || data?.clients === undefined,
      coachProfileValid: typeof data?.coachProfile === 'object' || data?.coachProfile === undefined
    });
    
    const isValid = (
      typeof data === 'object' &&
      data !== null &&
      (Array.isArray(data.workouts) || data.workouts === undefined) &&
      (Array.isArray(data.clients) || data.clients === undefined) &&
      (typeof data.coachProfile === 'object' || data.coachProfile === undefined)
    );
    
    console.log('🎯 Risultato validazione:', isValid);
    return isValid;
  }

  private static processImportData(data: any): {
    workouts?: Workout[];
    clients?: Client[];
    coachProfile?: CoachProfile;
  } {
    const processedData: any = {};

    if (data.workouts) {
      processedData.workouts = data.workouts.map((workout: any) => ({
        ...workout,
        createdAt: new Date(workout.createdAt),
        updatedAt: new Date(workout.updatedAt)
      }));
    }

    if (data.clients) {
      processedData.clients = data.clients.map((client: any) => ({
        ...client,
        createdAt: new Date(client.createdAt)
      }));
    }

    if (data.coachProfile) {
      processedData.coachProfile = data.coachProfile;
    }

    return processedData;
  }

  static async getBackupStats(): Promise<{
    workoutsCount: number;
    clientsCount: number;
    lastBackup?: Date;
  }> {
    const data = await dbOps.exportData();
    
    // Get last backup date from localStorage
    const lastBackupStr = localStorage.getItem('lastBackupDate');
    const lastBackup = lastBackupStr ? new Date(lastBackupStr) : undefined;

    return {
      workoutsCount: data.workouts.length,
      clientsCount: data.clients.length,
      lastBackup
    };
  }

  static setLastBackupDate(): void {
    localStorage.setItem('lastBackupDate', new Date().toISOString());
  }
}
