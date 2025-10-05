import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertWorkoutSchema, 
  insertClientSchema, 
  insertCoachProfileSchema 
} from "@shared/schema";
import { createCheckoutSession, createCustomer } from './stripe';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover'
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Payment routes
  app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { email, priceId, successUrl, cancelUrl, customerName } = req.body;

    if (!email || !priceId || !successUrl || !cancelUrl) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const session = await createCheckoutSession({
      email,
      priceId,
      successUrl,
      cancelUrl,
      customerName,
    });

    res.json({ sessionId: session.id }); // ✅ session.id, non session.url
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ message: "Failed to create checkout session" });
  }
});


  app.post("/api/subscription-success", async (req, res) => {
    try {
      const { session_id } = req.query;
      const session = await stripe.checkout.sessions.retrieve(session_id as string);
      const customerResponse = await stripe.customers.retrieve(session.customer as string);
      
      if ('deleted' in customerResponse) {
        return res.status(400).json({ message: "Customer was deleted" });
      }

      const customer = customerResponse as Stripe.Customer;
      
      if (customer.email) {
        // Create the user account in Supabase
        const { data: userData, error: userError } = await supabase.auth.admin.createUser({
          email: customer.email,
          email_confirm: true,
          user_metadata: {
            stripe_customer_id: customer.id,
            is_paid: true
          }
        });

        if (userError) {
          console.error("Error creating user:", userError);
          return res.status(500).json({ message: "Failed to create user account" });
        }

        // Redirect to the success page
        res.redirect(process.env.VITE_STRIPE_SUCCESS_URL || '/');
      } else {
        res.status(400).json({ message: "No email found in customer data" });
      }
    } catch (error) {
      console.error("Error handling subscription success:", error);
      res.status(500).json({ message: "Failed to process subscription" });
    }
  });
  // Workout routes
  app.get("/api/workouts", async (req, res) => {
    try {
      const workouts = await storage.getAllWorkouts();
      res.json(workouts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workouts" });
    }
  });

  app.get("/api/workouts/:id", async (req, res) => {
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

  app.post("/api/workouts", async (req, res) => {
    try {
      const validatedData = insertWorkoutSchema.parse(req.body);
      const workout = await storage.createWorkout(validatedData);
      res.status(201).json(workout);
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", details: error });
      }
      res.status(500).json({ message: "Failed to create workout" });
    }
  });

  app.put("/api/workouts/:id", async (req, res) => {
    try {
      const validatedData = insertWorkoutSchema.partial().parse(req.body);
      const workout = await storage.updateWorkout(req.params.id, validatedData);
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      res.json(workout);
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", details: error });
      }
      res.status(500).json({ message: "Failed to update workout" });
    }
  });

  app.delete("/api/workouts/:id", async (req, res) => {
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

  // Client routes
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
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

  app.post("/api/clients", async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", details: error });
      }
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const validatedData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(req.params.id, validatedData);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", details: error });
      }
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
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

  // Coach profile routes
  app.get("/api/coach-profile", async (req, res) => {
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

  app.get("/api/coach-profile/:id", async (req, res) => {
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

  app.post("/api/coach-profile", async (req, res) => {
    try {
      const validatedData = insertCoachProfileSchema.parse(req.body);
      const profile = await storage.createCoachProfile(validatedData);
      res.status(201).json(profile);
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", details: error });
      }
      res.status(500).json({ message: "Failed to create coach profile" });
    }
  });

  app.put("/api/coach-profile/:id", async (req, res) => {
    try {
      const validatedData = insertCoachProfileSchema.partial().parse(req.body);
      const profile = await storage.updateCoachProfile(req.params.id, validatedData);
      if (!profile) {
        return res.status(404).json({ message: "Coach profile not found" });
      }
      res.json(profile);
    } catch (error) {
      if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", details: error });
      }
      res.status(500).json({ message: "Failed to update coach profile" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
