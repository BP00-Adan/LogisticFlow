import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertTransportSchema, insertDeliverySchema, insertProcessSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get dashboard stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Get all processes with details
  app.get("/api/processes", async (req, res) => {
    try {
      const processes = await storage.getAllProcessesWithDetails();
      res.json(processes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch processes" });
    }
  });

  // Get active processes
  app.get("/api/processes/active", async (req, res) => {
    try {
      const processes = await storage.getActiveProcesses();
      const processesWithDetails = await Promise.all(
        processes.map(p => storage.getProcessWithDetails(p.id))
      );
      res.json(processesWithDetails.filter(Boolean));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active processes" });
    }
  });

  // Get single process with details
  app.get("/api/processes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const process = await storage.getProcessWithDetails(id);
      if (!process) {
        return res.status(404).json({ error: "Process not found" });
      }
      res.json(process);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch process" });
    }
  });

  // Create new process (Event 1 - Product Registration)
  app.post("/api/processes", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      
      // Create product
      const product = await storage.createProduct(productData);
      
      // Create process
      const process = await storage.createProcess({
        productId: product.id,
        currentEvent: 1,
        status: "in_progress",
        processType: productData.flowType,
      });

      const processWithDetails = await storage.getProcessWithDetails(process.id);
      res.json(processWithDetails);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid product data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create process" });
    }
  });

  // Update process to Event 2 (Transport Information)
  app.post("/api/processes/:id/transport", async (req, res) => {
    try {
      const processId = parseInt(req.params.id);
      const transportData = insertTransportSchema.parse(req.body);
      
      // Create transport
      const transport = await storage.createTransport(transportData);
      
      // Update process to next event
      const nextEvent = 3; // Both entrada and salida go to event 3
      const updatedProcess = await storage.updateProcess(processId, {
        transportId: transport.id,
        currentEvent: nextEvent,
      });

      if (!updatedProcess) {
        return res.status(404).json({ error: "Process not found" });
      }

      const processWithDetails = await storage.getProcessWithDetails(processId);
      res.json(processWithDetails);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid transport data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update process with transport info" });
    }
  });

  // Update process to Event 3 (Delivery)
  app.post("/api/processes/:id/delivery", async (req, res) => {
    try {
      const processId = parseInt(req.params.id);
      const deliveryData = insertDeliverySchema.parse(req.body);
      
      // Create delivery
      const delivery = await storage.createDelivery(deliveryData);
      
      // Update process
      const updatedProcess = await storage.updateProcess(processId, {
        deliveryId: delivery.id,
        currentEvent: 4,
      });

      if (!updatedProcess) {
        return res.status(404).json({ error: "Process not found" });
      }

      const processWithDetails = await storage.getProcessWithDetails(processId);
      res.json(processWithDetails);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid delivery data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update process with delivery info" });
    }
  });

  // Complete process (Event 4)
  app.post("/api/processes/:id/complete", async (req, res) => {
    try {
      const processId = parseInt(req.params.id);
      
      const updatedProcess = await storage.updateProcess(processId, {
        currentEvent: 4,
        status: "completed",
      });

      if (!updatedProcess) {
        return res.status(404).json({ error: "Process not found" });
      }

      const processWithDetails = await storage.getProcessWithDetails(processId);
      res.json(processWithDetails);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete process" });
    }
  });

  // Pause process
  app.post("/api/processes/:id/pause", async (req, res) => {
    try {
      const processId = parseInt(req.params.id);
      
      const updatedProcess = await storage.updateProcess(processId, {
        status: "paused",
      });

      if (!updatedProcess) {
        return res.status(404).json({ error: "Process not found" });
      }

      const processWithDetails = await storage.getProcessWithDetails(processId);
      res.json(processWithDetails);
    } catch (error) {
      res.status(500).json({ error: "Failed to pause process" });
    }
  });

  // Resume process
  app.post("/api/processes/:id/resume", async (req, res) => {
    try {
      const processId = parseInt(req.params.id);
      
      const updatedProcess = await storage.updateProcess(processId, {
        status: "in_progress",
      });

      if (!updatedProcess) {
        return res.status(404).json({ error: "Process not found" });
      }

      const processWithDetails = await storage.getProcessWithDetails(processId);
      res.json(processWithDetails);
    } catch (error) {
      res.status(500).json({ error: "Failed to resume process" });
    }
  });

  // Generate reports (placeholder endpoints)
  app.get("/api/processes/:id/reports/warehouse", async (req, res) => {
    try {
      const processId = parseInt(req.params.id);
      const process = await storage.getProcessWithDetails(processId);
      
      if (!process) {
        return res.status(404).json({ error: "Process not found" });
      }

      // For now, return JSON data that could be used to generate PDF
      res.json({
        type: "warehouse_report",
        process,
        generatedAt: new Date(),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate warehouse report" });
    }
  });

  app.get("/api/processes/:id/reports/transport", async (req, res) => {
    try {
      const processId = parseInt(req.params.id);
      const process = await storage.getProcessWithDetails(processId);
      
      if (!process) {
        return res.status(404).json({ error: "Process not found" });
      }

      res.json({
        type: "transport_report",
        process,
        generatedAt: new Date(),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate transport report" });
    }
  });

  app.get("/api/processes/:id/reports/invoice", async (req, res) => {
    try {
      const processId = parseInt(req.params.id);
      const process = await storage.getProcessWithDetails(processId);
      
      if (!process) {
        return res.status(404).json({ error: "Process not found" });
      }

      res.json({
        type: "invoice",
        process,
        generatedAt: new Date(),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate invoice" });
    }
  });

  // Complete Event 3 for entrada process (confirmation or complaint)
  app.post("/api/processes/:id/complete-event3-entrada", async (req, res) => {
    try {
      const processId = parseInt(req.params.id);
      const { action, notes } = req.body;
      
      if (!["confirmed", "complaint"].includes(action)) {
        return res.status(400).json({ error: "Invalid action. Must be 'confirmed' or 'complaint'" });
      }

      const updateData: any = {
        event3Status: action,
        updatedAt: new Date(),
      };

      if (action === "confirmed") {
        updateData.status = "completed";
        updateData.confirmedAt = new Date();
      } else if (action === "complaint") {
        updateData.status = "complaint";
        updateData.complaintNotes = notes || "";
      }

      const updatedProcess = await storage.updateProcess(processId, updateData);

      if (!updatedProcess) {
        return res.status(404).json({ error: "Process not found" });
      }

      const processWithDetails = await storage.getProcessWithDetails(processId);
      res.json(processWithDetails);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete event 3" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
