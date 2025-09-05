import Dexie, { Table } from 'dexie';
import type { Workout, Client, CoachProfile, Exercise, Week, Day, ExerciseGlossary } from '@shared/schema';

export class FitTrackerDatabase extends Dexie {
  workouts!: Table<Workout>;
  clients!: Table<Client>;
  coachProfile!: Table<CoachProfile>;
  exerciseGlossary!: Table<ExerciseGlossary>;

  constructor() {
    super('FitTrackerDatabase');
    this.version(1).stores({
      workouts: 'id, clientName, coachName, workoutType, createdAt, updatedAt',
      clients: 'id, name, createdAt',
      coachProfile: 'id, name'
    });
    
    this.version(2).stores({
      workouts: 'id, clientName, coachName, workoutType, createdAt, updatedAt',
      clients: 'id, name, createdAt',
      coachProfile: 'id, name',
      exerciseGlossary: 'id, name, createdAt, updatedAt'
    });
    
    // Upgrade hook to migrate existing data
    this.version(1).upgrade(async (tx) => {
      await this.migrateWorkouts(tx);
    });
  }

  private async migrateWorkouts(tx: any) {
    const workouts = await tx.table('workouts').toArray();
    
    for (const workout of workouts) {
      let needsUpdate = false;
      
      if (workout.weeks) {
        for (const week of workout.weeks) {
          // Check if week has old structure (exercises directly)
          if (week.exercises && !week.days) {
            // Migrate to new structure
            week.days = [
              {
                id: crypto.randomUUID(),
                name: "Giorno 1",
                exercises: week.exercises || [],
                notes: ''
              }
            ];
            delete week.exercises;
            week.notes = week.notes || '';
            needsUpdate = true;
          }
          
          // Ensure all exercises have rest field
          if (week.days) {
            for (const day of week.days) {
              if (day.exercises) {
                for (const exercise of day.exercises) {
                  if (!exercise.rest) {
                    exercise.rest = '';
                    needsUpdate = true;
                  }
                }
              }
              if (!day.notes) {
                day.notes = '';
                needsUpdate = true;
              }
            }
          }
        }
      }
      
      if (needsUpdate) {
        await tx.table('workouts').put(workout);
      }
    }
  }
}

export const db = new FitTrackerDatabase();

// Database operations
export const dbOps = {
  // Workout operations
  async getAllWorkouts(): Promise<Workout[]> {
    return await db.workouts.orderBy('updatedAt').reverse().toArray();
  },

  async getWorkout(id: string): Promise<Workout | undefined> {
    return await db.workouts.get(id);
  },

  async createWorkout(workout: Omit<Workout, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workout> { 
    const now = new Date();
    const newWorkout: Workout = {
      ...workout,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    };
    await db.workouts.add(newWorkout);
    return newWorkout;
  },
  
  // Exercise Glossary operations
  async getAllExerciseGlossary(): Promise<ExerciseGlossary[]> {
    return await db.exerciseGlossary.orderBy('name').toArray();
  },

  async getExerciseGlossary(id: string): Promise<ExerciseGlossary | undefined> {
    return await db.exerciseGlossary.get(id);
  },

  async createExerciseGlossary(exercise: Omit<ExerciseGlossary, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExerciseGlossary> {
    const now = new Date();
    const newExercise: ExerciseGlossary = {
      ...exercise,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    };
    await db.exerciseGlossary.add(newExercise);
    return newExercise;
  },

  async updateExerciseGlossary(id: string, updates: Partial<ExerciseGlossary>): Promise<ExerciseGlossary | undefined> {
    const existing = await db.exerciseGlossary.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    await db.exerciseGlossary.put(updated);
    return updated;
  },

  async deleteExerciseGlossary(id: string): Promise<boolean> {
    const existing = await db.exerciseGlossary.get(id);
    if (!existing) return false;
    await db.exerciseGlossary.delete(id);
    return true;
  },

  async updateWorkout(id: string, updates: Partial<Workout>): Promise<Workout | undefined> {
    const existing = await db.workouts.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    await db.workouts.put(updated);
    return updated;
  },

  async deleteWorkout(id: string): Promise<boolean> {
    const existing = await db.workouts.get(id);
    if (!existing) return false;
    await db.workouts.delete(id);
    return true;
  },

  async getWorkoutsByClient(clientName: string): Promise<Workout[]> {
    return await db.workouts.where('clientName').equals(clientName).toArray();
  },

  // Client operations
  async getAllClients(): Promise<Client[]> {
    return await db.clients.orderBy('createdAt').reverse().toArray();
  },

  async getClient(id: string): Promise<Client | undefined> {
    return await db.clients.get(id);
  },

  async createClient(client: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
    const newClient: Client = {
      ...client,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    await db.clients.add(newClient);
    return newClient;
  },

  async updateClient(id: string, updates: Partial<Client>): Promise<Client | undefined> {
    const existing = await db.clients.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    await db.clients.put(updated);
    return updated;
  },

  async deleteClient(id: string): Promise<boolean> {
    const existing = await db.clients.get(id);
    if (!existing) return false;
    await db.clients.delete(id);
    return true;
  },

  async getClientByName(name: string): Promise<Client | undefined> {
    return await db.clients.where('name').equals(name).first();
  },

  // Coach profile operations
  async getCoachProfile(): Promise<CoachProfile | undefined> {
    try {
      // Prima controlla nel database Dexie
      const profiles = await db.coachProfile.toArray();
      if (profiles.length > 0) {
        return profiles[0];
      }

      // Se non c'è niente in Dexie, prova localStorage come fallback
      const stored = localStorage.getItem('coach-profile');
      if (stored) {
        const profile = JSON.parse(stored) as CoachProfile;
        // Migra da localStorage a Dexie
        await db.coachProfile.add(profile);
        localStorage.removeItem('coach-profile'); // Pulisci localStorage
        return profile;
      }

      return undefined;
    } catch (error) {
      console.error('Error getting coach profile:', error);
      return undefined;
    }
  },

  async createCoachProfile(profile: Omit<CoachProfile, 'id'>): Promise<CoachProfile> {
    try {
      // Clear any existing profiles first
      await db.coachProfile.clear();
      
      const newProfile: CoachProfile = {
        ...profile,
        id: crypto.randomUUID(),
        pdfLineColor: profile.pdfLineColor || '#000000',
        pdfTextColor: profile.pdfTextColor || '#4F46E5',
        showWatermark: profile.showWatermark ?? true
      };
      
      await db.coachProfile.add(newProfile);
      
      // Backup anche in localStorage per sicurezza
      localStorage.setItem('coach-profile', JSON.stringify(newProfile));
      
      return newProfile;
    } catch (error) {
      console.error('Error creating coach profile:', error);
      throw error;
    }
  },

  async updateCoachProfile(id: string, updates: Partial<CoachProfile>): Promise<CoachProfile | undefined> {
    try {
      const existing = await db.coachProfile.get(id);
      if (!existing) {
        // Se non esiste un profilo, creane uno nuovo con i dati forniti
        if (updates.name) {
          return await this.createCoachProfile(updates as Omit<CoachProfile, 'id'>);
        }
        return undefined;
      }
      
      const updated = { 
        ...existing, 
        ...updates,
        pdfLineColor: updates.pdfLineColor ?? existing.pdfLineColor,
        pdfTextColor: updates.pdfTextColor ?? existing.pdfTextColor,
        showWatermark: updates.showWatermark ?? existing.showWatermark
      };
      
      await db.coachProfile.put(updated);
      
      // Backup anche in localStorage per sicurezza
      localStorage.setItem('coach-profile', JSON.stringify(updated));
      
      return updated;
    } catch (error) {
      console.error('Error updating coach profile:', error);
      throw error;
    }
  },

  // Data management
  async clearAllData(): Promise<void> {
    await Promise.all([
      db.workouts.clear(),
      db.clients.clear(),
      db.coachProfile.clear(),
      db.exerciseGlossary.clear()
    ]);
    // Rimuovi anche il backup del profilo in localStorage per evitare la re-importazione automatica
    try { localStorage.removeItem('coach-profile'); } catch {}
  },

  async exportData(): Promise<{ workouts: Workout[], clients: Client[], coachProfile: CoachProfile | null, exerciseGlossary: ExerciseGlossary[] }> {
    const [workouts, clients, coachProfile, exerciseGlossary] = await Promise.all([
      db.workouts.toArray(),
      db.clients.toArray(),
      this.getCoachProfile(),
      db.exerciseGlossary.toArray()
    ]);
    
    return {
      workouts,
      clients, 
      coachProfile: coachProfile || null,
      exerciseGlossary
    };
  },

  async importData(data: { workouts?: Workout[], clients?: Client[], coachProfile?: CoachProfile, exerciseGlossary?: ExerciseGlossary[] }): Promise<void> {
    console.log('💾 Importazione dati nel database:', data);
    
    try {
      await this.clearAllData();
      console.log('🗑️ Database pulito');
      
      if (data.workouts && data.workouts.length > 0) {
        console.log('📝 Importo', data.workouts.length, 'workouts');
        await db.workouts.bulkAdd(data.workouts);
        console.log('✅ Workouts importati');
      }
      
      if (data.clients && data.clients.length > 0) {
        console.log('👥 Importo', data.clients.length, 'clienti');
        await db.clients.bulkAdd(data.clients);
        console.log('✅ Clienti importati');
      }
      
      if (data.coachProfile) {
        console.log('👨‍💼 Importo profilo coach:', data.coachProfile);
        await db.coachProfile.add(data.coachProfile);
        console.log('✅ Profilo coach importato');
      }
      
      if (data.exerciseGlossary && data.exerciseGlossary.length > 0) {
        console.log('💪 Importo', data.exerciseGlossary.length, 'esercizi nel glossario');
        await db.exerciseGlossary.bulkAdd(data.exerciseGlossary);
        console.log('✅ Glossario esercizi importato');
      }
      
      console.log('🎉 Importazione completata con successo!');
    } catch (error) {
      console.error('❌ Errore durante importazione database:', error);
      throw error;
    }
  }
};