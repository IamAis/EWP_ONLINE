import { dbOps, db } from './database';
import type { Workout, Client, CoachProfile } from '@shared/schema';
import { supabase } from '@/lib/supabase';

export class BackupManager {
  private static autoBackupTimer: number | undefined;
  private static autoBackupDelayMs = 2000;
  static pauseAutoBackup = false;
  static autoBackupEnabled = false;
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

  // ===== Cloud backup via Supabase Storage =====
  static async exportToSupabaseStorage(): Promise<{ path: string }>{
    const BUCKET = 'backups';
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    const userId = userRes.user?.id;
    if (!userId) throw new Error('Utente non autenticato');

    const exportData = await dbOps.exportData();
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Usa un solo file per utente
    const latestPath = `${userId}/data.json`;

    // Carica/aggiorna data.json (upsert)
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(latestPath, blob, { contentType: 'application/json', upsert: true });
    if (upErr) throw upErr;

    this.setLastBackupDate();
    return { path: latestPath };
  }

  static async importFromSupabaseStorage(): Promise<void> {
    const BUCKET = 'backups';
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    const userId = userRes.user?.id;
    if (!userId) throw new Error('Utente non autenticato');

    const latestPath = `${userId}/data.json`;
    const { data, error } = await supabase.storage.from(BUCKET).download(latestPath);
    if (error) throw error;
    if (!data) throw new Error('Nessun backup cloud trovato');

    // Evita trigger di auto-backup durante l'import
    this.pauseAutoBackup = true;
    try {
      const file = new File([data], 'data.json', { type: 'application/json' });
      await this.importFromJSON(file);
    } finally {
      this.pauseAutoBackup = false;
    }
  }

  static scheduleAutoBackup(): void {
    if (!this.autoBackupEnabled || this.pauseAutoBackup) return;
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      if (!data?.user) return;
      if (this.autoBackupTimer) clearTimeout(this.autoBackupTimer);
      this.autoBackupTimer = window.setTimeout(() => {
        // Auto disabilitato: non fare nulla
        return;
      }, this.autoBackupDelayMs);
    });
  }

  // Carica dal cloud: scarica e fa un vero merge con i dati locali
  static async mergeFromSupabaseStorage(): Promise<void> {
    const BUCKET = 'backups';
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    const userId = userRes.user?.id;
    if (!userId) throw new Error('Utente non autenticato');

    const latestPath = `${userId}/data.json`;
    const { data, error } = await supabase.storage.from(BUCKET).download(latestPath);
    if (error) throw error;
    if (!data) throw new Error('Nessun backup cloud trovato');

    const text = await data.text();
    const json = JSON.parse(text);

    // Valida e processa come import standard, ma con merge vero
    type WorkoutRaw = { id: string; createdAt: string | Date; updatedAt: string | Date } & Record<string, any>;
    type ClientRaw = { id: string; createdAt: string | Date } & Record<string, any>;
    const toArraySafe = <T extends Record<string, any>>(v: unknown): T[] => Array.isArray(v) ? (v as T[]) : [];
    const workouts = toArraySafe<WorkoutRaw>(json.workouts);
    const clients = toArraySafe<ClientRaw>(json.clients);
    const coachProfile = (json.coachProfile ?? null) as any;

    // Merge intelligente: aggiunge solo se non esiste già
    this.pauseAutoBackup = true;
    try {
      if (workouts.length) {
        for (const w of workouts) {
          const existing = await db.workouts.get(w.id);
          if (!existing) {
            const payload: any = { ...w, createdAt: new Date(w.createdAt), updatedAt: new Date(w.updatedAt) };
            try { await db.workouts.add(payload); } catch {}
          }
        }
      }
      if (clients.length) {
        for (const c of clients) {
          const existing = await db.clients.get(c.id);
          if (!existing) {
            const payload: any = { ...c, createdAt: new Date(c.createdAt) };
            try { await db.clients.add(payload); } catch {}
          }
        }
      }
      if (coachProfile) {
        const existing = await db.coachProfile.toArray();
        if (existing.length === 0) {
          try { await db.coachProfile.add(coachProfile); } catch {}
          localStorage.setItem('coach-profile', JSON.stringify(coachProfile));
        }
      }
    } finally {
      this.pauseAutoBackup = false;
    }
  }

  // Sync iniziale: importa dal cloud solo se il DB locale è vuoto
  static async ensureInitialSync(): Promise<void> {
    try {
      const local = await dbOps.exportData();
      const isEmpty = (local.workouts?.length ?? 0) === 0 && (local.clients?.length ?? 0) === 0 && !local.coachProfile;
      if (!isEmpty) return;
      await this.importFromSupabaseStorage();
    } catch {
      // ignora se non esiste ancora un backup remoto o altri errori non critici
    }
  }
}

// Registra auto-backup su modifiche Dexie (solo in ambiente browser)
try {
  db.workouts.hook('creating', () => BackupManager.scheduleAutoBackup());
  db.workouts.hook('updating', () => BackupManager.scheduleAutoBackup());
  db.workouts.hook('deleting', () => BackupManager.scheduleAutoBackup());

  db.clients.hook('creating', () => BackupManager.scheduleAutoBackup());
  db.clients.hook('updating', () => BackupManager.scheduleAutoBackup());
  db.clients.hook('deleting', () => BackupManager.scheduleAutoBackup());

  db.coachProfile.hook('creating', () => BackupManager.scheduleAutoBackup());
  db.coachProfile.hook('updating', () => BackupManager.scheduleAutoBackup());
  db.coachProfile.hook('deleting', () => BackupManager.scheduleAutoBackup());
} catch {}

