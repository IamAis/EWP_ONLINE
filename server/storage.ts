import { 
  type Workout, 
  type InsertWorkout,
  type Client,
  type InsertClient,
  type CoachProfile,
  type InsertCoachProfile
} from "@shared/schema";
import { randomUUID } from "crypto";

// Storage interface for fitness coach application
export interface IStorage {
  // Workout operations
  getWorkout(id: string): Promise<Workout | undefined>;
  getAllWorkouts(): Promise<Workout[]>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  updateWorkout(id: string, workout: Partial<InsertWorkout>): Promise<Workout | undefined>;
  deleteWorkout(id: string): Promise<boolean>;
  
  // Client operations
  getClient(id: string): Promise<Client | undefined>;
  getAllClients(): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;
  
  // Coach profile operations
  getCoachProfile(id: string): Promise<CoachProfile | undefined>;
  getDefaultCoachProfile(): Promise<CoachProfile | undefined>;
  createCoachProfile(profile: InsertCoachProfile): Promise<CoachProfile>;
  updateCoachProfile(id: string, profile: Partial<InsertCoachProfile>): Promise<CoachProfile | undefined>;
}

export class MemStorage implements IStorage {
  private workouts: Map<string, Workout>;
  private clients: Map<string, Client>;
  private coachProfiles: Map<string, CoachProfile>;

  constructor() {
    this.workouts = new Map();
    this.clients = new Map();
    this.coachProfiles = new Map();
  }

  // Workout operations
  async getWorkout(id: string): Promise<Workout | undefined> {
    return this.workouts.get(id);
  }

  async getAllWorkouts(): Promise<Workout[]> {
    return Array.from(this.workouts.values());
  }

  async createWorkout(insertWorkout: InsertWorkout): Promise<Workout> {
    const id = randomUUID();
    const now = new Date();
    const workout: Workout = { 
      ...insertWorkout, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.workouts.set(id, workout);
    return workout;
  }

  async updateWorkout(id: string, updateData: Partial<InsertWorkout>): Promise<Workout | undefined> {
    const existing = this.workouts.get(id);
    if (!existing) return undefined;
    
    const updated: Workout = {
      ...existing,
      ...updateData,
      id,
      updatedAt: new Date()
    };
    this.workouts.set(id, updated);
    return updated;
  }

  async deleteWorkout(id: string): Promise<boolean> {
    return this.workouts.delete(id);
  }

  // Client operations
  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getAllClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = randomUUID();
    const client: Client = { 
      ...insertClient, 
      id, 
      createdAt: new Date()
    };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: string, updateData: Partial<InsertClient>): Promise<Client | undefined> {
    const existing = this.clients.get(id);
    if (!existing) return undefined;
    
    const updated: Client = {
      ...existing,
      ...updateData,
      id
    };
    this.clients.set(id, updated);
    return updated;
  }

  async deleteClient(id: string): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Coach profile operations
  async getCoachProfile(id: string): Promise<CoachProfile | undefined> {
    return this.coachProfiles.get(id);
  }

  async getDefaultCoachProfile(): Promise<CoachProfile | undefined> {
    // Restituisce il primo profilo coach disponibile o undefined
    const profiles = Array.from(this.coachProfiles.values());
    return profiles.length > 0 ? profiles[0] : undefined;
  }

  async createCoachProfile(insertProfile: InsertCoachProfile): Promise<CoachProfile> {
    const id = randomUUID();
    const profile: CoachProfile = { ...insertProfile, id };
    this.coachProfiles.set(id, profile);
    return profile;
  }

  async updateCoachProfile(id: string, updateData: Partial<InsertCoachProfile>): Promise<CoachProfile | undefined> {
    const existing = this.coachProfiles.get(id);
    if (!existing) return undefined;
    
    const updated: CoachProfile = {
      ...existing,
      ...updateData,
      id
    };
    this.coachProfiles.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
