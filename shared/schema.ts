import { z } from "zod";

// Exercise Glossary schema
export const exerciseGlossarySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nome esercizio richiesto"),
  description: z.string().optional(),
  images: z.array(z.string()).default([]),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Glossary content schema (for embedding in exercises)
export const glossaryContentSchema = z.object({
  description: z.string().optional(),
  images: z.array(z.string()).default([])
});

// Exercise schema
export const exerciseSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nome esercizio richiesto"),
  sets: z.string().min(1, "Serie richieste"),
  reps: z.string().min(1, "Ripetizioni richieste"),
  load: z.string().optional(),
  rest: z.string().optional(), // Tempo di recupero
  notes: z.string().optional(),
  order: z.number().default(0),
  // Riferimento al glossario
  glossaryId: z.string().optional(),
  glossaryContent: glossaryContentSchema.optional()
});

// Day schema for organizing exercises by training day
export const daySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nome giorno richiesto"), // es. "Giorno 1 - Petto e Tricipiti"
  exercises: z.array(exerciseSchema),
  notes: z.string().optional()
});

// Week schema with multiple days
export const weekSchema = z.object({
  id: z.string(),
  number: z.number().min(1),
  name: z.string().optional(), // Nome customizzabile della settimana
  days: z.array(daySchema), // Changed from exercises to days
  notes: z.string().optional()
});

// Workout schema
export const workoutSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nome scheda richiesto"), // Nome identificativo della scheda
  coachName: z.string().optional(), // Coach preso dalle impostazioni, non più richiesto
  clientName: z.string().min(1, "Nome cliente richiesto"),
  clientId: z.string().optional(), // ID del cliente selezionato dalla lista
  workoutType: z.string().min(1, "Tipo scheda richiesto"),
  level: z.enum(["Neofita", "Principiante", "Intermedio", "Avanzato"]).optional(), // Nuovo campo livello
  duration: z.number().min(1, "Durata richiesta"),
  description: z.string().optional(),
  dietaryAdvice: z.string().optional(),
  weeks: z.array(weekSchema),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Client schema
export const clientSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nome cliente richiesto"),
  email: z.string().email().or(z.literal("")).optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.date()
});

// Coach profile schema
export const coachProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nome coach richiesto"),
  email: z.string().email().or(z.literal("")).optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  logo: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  website: z.string().optional(),
  exportPath: z.string().optional(), // Default export path for PDFs
  // Impostazioni PDF personalizzabili
  pdfLineColor: z.string().optional().default("#000000"), // Colore delle linee nei PDF
  pdfTextColor: z.string().optional().default("#4F46E5"), // Colore dei titoli delle sezioni nei PDF
  showWatermark: z.boolean().optional().default(true), // Se mostrare la filigrana
  useWorkoutNameAsTitle: z.boolean().optional().default(false) // Se usare il nome scheda al posto di "SCHEDA DI ALLENAMENTO"
});

// Insert schemas
export const insertExerciseGlossarySchema = exerciseGlossarySchema.omit({ id: true, createdAt: true, updatedAt: true });
export const insertExerciseSchema = exerciseSchema.omit({ id: true });
export const insertDaySchema = daySchema.omit({ id: true });
export const insertWeekSchema = weekSchema.omit({ id: true });
export const insertWorkoutSchema = workoutSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const insertClientSchema = clientSchema.omit({ id: true, createdAt: true });
export const insertCoachProfileSchema = coachProfileSchema.omit({ id: true });

// Types
export type ExerciseGlossary = z.infer<typeof exerciseGlossarySchema>;
export type Exercise = z.infer<typeof exerciseSchema>;
export type Day = z.infer<typeof daySchema>;
export type Week = z.infer<typeof weekSchema>;
export type Workout = z.infer<typeof workoutSchema>;
export type Client = z.infer<typeof clientSchema>;
export type CoachProfile = z.infer<typeof coachProfileSchema>;

export type InsertExerciseGlossary = z.infer<typeof insertExerciseGlossarySchema>;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type InsertDay = z.infer<typeof insertDaySchema>;
export type InsertWeek = z.infer<typeof insertWeekSchema>;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertCoachProfile = z.infer<typeof insertCoachProfileSchema>;

// Workout types
export const workoutTypes = [
  "Forza e Massa",
  "Definizione", 
  "Resistenza",
  "Riabilitazione",
  "Funzionale"
] as const;

export type WorkoutType = typeof workoutTypes[number];

// Levels types
export const levels = [
  "Neofita",
  "Principiante", 
  "Intermedio",
  "Avanzato"
] as const;

export type Level = typeof levels[number];

// PDF Settings schema per le impostazioni di esportazione
export const pdfSettingsSchema = z.object({
  lineColor: z.string().default("#000000"),
  showWatermark: z.boolean().default(true),
  headerStyle: z.enum(["minimal", "standard", "detailed"]).default("standard"),
  fontSize: z.enum(["small", "medium", "large"]).default("medium")
});

export type PDFSettings = z.infer<typeof pdfSettingsSchema>;
