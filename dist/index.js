// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { randomUUID } from "crypto";
var MemStorage = class {
  workouts;
  clients;
  coachProfiles;
  constructor() {
    this.workouts = /* @__PURE__ */ new Map();
    this.clients = /* @__PURE__ */ new Map();
    this.coachProfiles = /* @__PURE__ */ new Map();
  }
  // Workout operations
  async getWorkout(id) {
    return this.workouts.get(id);
  }
  async getAllWorkouts() {
    return Array.from(this.workouts.values());
  }
  async createWorkout(insertWorkout) {
    const id = randomUUID();
    const now = /* @__PURE__ */ new Date();
    const workout = {
      ...insertWorkout,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.workouts.set(id, workout);
    return workout;
  }
  async updateWorkout(id, updateData) {
    const existing = this.workouts.get(id);
    if (!existing) return void 0;
    const updated = {
      ...existing,
      ...updateData,
      id,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.workouts.set(id, updated);
    return updated;
  }
  async deleteWorkout(id) {
    return this.workouts.delete(id);
  }
  // Client operations
  async getClient(id) {
    return this.clients.get(id);
  }
  async getAllClients() {
    return Array.from(this.clients.values());
  }
  async createClient(insertClient) {
    const id = randomUUID();
    const client = {
      ...insertClient,
      id,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.clients.set(id, client);
    return client;
  }
  async updateClient(id, updateData) {
    const existing = this.clients.get(id);
    if (!existing) return void 0;
    const updated = {
      ...existing,
      ...updateData,
      id
    };
    this.clients.set(id, updated);
    return updated;
  }
  async deleteClient(id) {
    return this.clients.delete(id);
  }
  // Coach profile operations
  async getCoachProfile(id) {
    return this.coachProfiles.get(id);
  }
  async getDefaultCoachProfile() {
    const profiles = Array.from(this.coachProfiles.values());
    return profiles.length > 0 ? profiles[0] : void 0;
  }
  async createCoachProfile(insertProfile) {
    const id = randomUUID();
    const profile = { ...insertProfile, id };
    this.coachProfiles.set(id, profile);
    return profile;
  }
  async updateCoachProfile(id, updateData) {
    const existing = this.coachProfiles.get(id);
    if (!existing) return void 0;
    const updated = {
      ...existing,
      ...updateData,
      id
    };
    this.coachProfiles.set(id, updated);
    return updated;
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { z } from "zod";
var exerciseSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nome esercizio richiesto"),
  sets: z.string().min(1, "Serie richieste"),
  reps: z.string().min(1, "Ripetizioni richieste"),
  load: z.string().optional(),
  rest: z.string().optional(),
  // Tempo di recupero
  notes: z.string().optional(),
  imageUrl: z.string().optional(),
  order: z.number().default(0)
});
var daySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nome giorno richiesto"),
  // es. "Giorno 1 - Petto e Tricipiti"
  exercises: z.array(exerciseSchema),
  notes: z.string().optional()
});
var weekSchema = z.object({
  id: z.string(),
  number: z.number().min(1),
  name: z.string().optional(),
  // Nome customizzabile della settimana
  days: z.array(daySchema),
  // Changed from exercises to days
  notes: z.string().optional()
});
var workoutSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nome scheda richiesto"),
  // Nome identificativo della scheda
  coachName: z.string().optional(),
  // Coach preso dalle impostazioni, non più richiesto
  clientName: z.string().min(1, "Nome cliente richiesto"),
  clientId: z.string().optional(),
  // ID del cliente selezionato dalla lista
  workoutType: z.string().min(1, "Tipo scheda richiesto"),
  level: z.enum(["Neofita", "Principiante", "Intermedio", "Avanzato"]).optional(),
  // Nuovo campo livello
  duration: z.number().min(1, "Durata richiesta"),
  description: z.string().optional(),
  dietaryAdvice: z.string().optional(),
  weeks: z.array(weekSchema),
  createdAt: z.date(),
  updatedAt: z.date()
});
var clientSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nome cliente richiesto"),
  email: z.string().email().or(z.literal("")).optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.date()
});
var coachProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nome coach richiesto"),
  email: z.string().email().or(z.literal("")).optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  logo: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  website: z.string().optional(),
  exportPath: z.string().optional(),
  // Default export path for PDFs
  // Impostazioni PDF personalizzabili
  pdfLineColor: z.string().optional().default("#000000"),
  // Colore delle linee nei PDF
  pdfTextColor: z.string().optional().default("#4F46E5"),
  // Colore dei titoli delle sezioni nei PDF
  showWatermark: z.boolean().optional().default(true),
  // Se mostrare la filigrana
  useWorkoutNameAsTitle: z.boolean().optional().default(false)
  // Se usare il nome scheda al posto di "SCHEDA DI ALLENAMENTO"
});
var insertExerciseSchema = exerciseSchema.omit({ id: true });
var insertDaySchema = daySchema.omit({ id: true });
var insertWeekSchema = weekSchema.omit({ id: true });
var insertWorkoutSchema = workoutSchema.omit({ id: true, createdAt: true, updatedAt: true });
var insertClientSchema = clientSchema.omit({ id: true, createdAt: true });
var insertCoachProfileSchema = coachProfileSchema.omit({ id: true });
var pdfSettingsSchema = z.object({
  lineColor: z.string().default("#000000"),
  showWatermark: z.boolean().default(true),
  headerStyle: z.enum(["minimal", "standard", "detailed"]).default("standard"),
  fontSize: z.enum(["small", "medium", "large"]).default("medium")
});

// server/routes.ts
async function registerRoutes(app2) {
  app2.get("/api/workouts", async (req, res) => {
    try {
      const workouts = await storage.getAllWorkouts();
      res.json(workouts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workouts" });
    }
  });
  app2.get("/api/workouts/:id", async (req, res) => {
    try {
      const workout = await storage.getWorkout(req.params.id);
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      res.json(workout);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workout" });
    }
  });
  app2.post("/api/workouts", async (req, res) => {
    try {
      const validatedData = insertWorkoutSchema.parse(req.body);
      const workout = await storage.createWorkout(validatedData);
      res.status(201).json(workout);
    } catch (error) {
      if (error && typeof error === "object" && "name" in error && error.name === "ZodError") {
        return res.status(400).json({ message: "Validation error", details: error });
      }
      res.status(500).json({ message: "Failed to create workout" });
    }
  });
  app2.put("/api/workouts/:id", async (req, res) => {
    try {
      const validatedData = insertWorkoutSchema.partial().parse(req.body);
      const workout = await storage.updateWorkout(req.params.id, validatedData);
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      res.json(workout);
    } catch (error) {
      if (error && typeof error === "object" && "name" in error && error.name === "ZodError") {
        return res.status(400).json({ message: "Validation error", details: error });
      }
      res.status(500).json({ message: "Failed to update workout" });
    }
  });
  app2.delete("/api/workouts/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteWorkout(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Workout not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete workout" });
    }
  });
  app2.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });
  app2.get("/api/clients/:id", async (req, res) => {
    try {
      const client = await storage.getClient(req.params.id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });
  app2.post("/api/clients", async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      if (error && typeof error === "object" && "name" in error && error.name === "ZodError") {
        return res.status(400).json({ message: "Validation error", details: error });
      }
      res.status(500).json({ message: "Failed to create client" });
    }
  });
  app2.put("/api/clients/:id", async (req, res) => {
    try {
      const validatedData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(req.params.id, validatedData);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      if (error && typeof error === "object" && "name" in error && error.name === "ZodError") {
        return res.status(400).json({ message: "Validation error", details: error });
      }
      res.status(500).json({ message: "Failed to update client" });
    }
  });
  app2.delete("/api/clients/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteClient(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });
  app2.get("/api/coach-profile", async (req, res) => {
    try {
      const profile = await storage.getDefaultCoachProfile();
      if (!profile) {
        return res.status(404).json({ message: "Coach profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch coach profile" });
    }
  });
  app2.get("/api/coach-profile/:id", async (req, res) => {
    try {
      const profile = await storage.getCoachProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ message: "Coach profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch coach profile" });
    }
  });
  app2.post("/api/coach-profile", async (req, res) => {
    try {
      const validatedData = insertCoachProfileSchema.parse(req.body);
      const profile = await storage.createCoachProfile(validatedData);
      res.status(201).json(profile);
    } catch (error) {
      if (error && typeof error === "object" && "name" in error && error.name === "ZodError") {
        return res.status(400).json({ message: "Validation error", details: error });
      }
      res.status(500).json({ message: "Failed to create coach profile" });
    }
  });
  app2.put("/api/coach-profile/:id", async (req, res) => {
    try {
      const validatedData = insertCoachProfileSchema.partial().parse(req.body);
      const profile = await storage.updateCoachProfile(req.params.id, validatedData);
      if (!profile) {
        return res.status(404).json({ message: "Coach profile not found" });
      }
      res.json(profile);
    } catch (error) {
      if (error && typeof error === "object" && "name" in error && error.name === "ZodError") {
        return res.status(400).json({ message: "Validation error", details: error });
      }
      res.status(500).json({ message: "Failed to update coach profile" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "3000", 10);
  server.listen({
    port,
    host: "0.0.0.0"
    // Use 0.0.0.0 for Replit compatibility
  }, () => {
    log(`Server running on port ${port}`);
    log(`Environment PORT: ${process.env.PORT || "not set"}`);
  });
})();
