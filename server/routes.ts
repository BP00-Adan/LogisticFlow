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
      
      // Manual validation and transformation for delivery data
      const { originPlace, destinationPlace, departureTime, deliveryNotes } = req.body;
      
      if (!originPlace || !destinationPlace || !departureTime) {
        return res.status(400).json({ 
          error: "Missing required fields", 
          details: "originPlace, destinationPlace, and departureTime are required" 
        });
      }

      const deliveryData = {
        originPlace,
        destinationPlace,
        departureTime: new Date(departureTime),
        deliveryNotes: deliveryNotes || null,
      };
      
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
      console.error("Delivery error:", error);
      res.status(500).json({ error: "Failed to update process with delivery info", details: (error as Error).message });
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

  // Generate reports endpoints - Return PDF data for frontend to generate
  app.get("/api/processes/:id/reports/warehouse", async (req, res) => {
    try {
      const processId = parseInt(req.params.id);
      const process = await storage.getProcessWithDetails(processId);
      
      if (!process) {
        return res.status(404).json({ error: "Process not found" });
      }

      // Generate PDF content data
      const pdfContent = {
        title: "Reporte de Bodega",
        processId: process.id,
        processType: process.processType.toUpperCase(),
        date: new Date().toLocaleDateString("es-ES"),
        product: {
          name: process.product.name,
          weight: `${process.product.weight / 1000} kg`,
          dimensions: `${process.product.dimensions.length}x${process.product.dimensions.width}x${process.product.dimensions.height} cm`,
          regulations: Object.entries(process.product.regulations)
            .filter(([_, value]) => value)
            .map(([key]) => {
              const labels = {
                fragile: "Frágil",
                lithium: "Batería Litio",
                hazardous: "Peligroso", 
                refrigerated: "Refrigerado",
                valuable: "Valioso",
                oversized: "Sobre-dimensionado"
              };
              return labels[key as keyof typeof labels];
            })
        },
        transport: process.transport ? {
          driver: process.transport.driverName,
          license: process.transport.licenseNumber,
          vehicle: `${process.transport.vehicleType} - ${process.transport.vehiclePlate}`,
          notes: process.transport.notes || "Sin observaciones"
        } : null,
        delivery: process.delivery ? {
          origin: process.delivery.originPlace,
          destination: process.delivery.destinationPlace,
          departureTime: new Date(process.delivery.departureTime).toLocaleString("es-ES"),
          notes: process.delivery.deliveryNotes || "Sin observaciones"
        } : null,
        status: process.status,
        events: process.currentEvent,
        createdAt: new Date(process.createdAt).toLocaleString("es-ES")
      };

      res.json(pdfContent);
      
      // Auto-save PDF record to history
      try {
        await storage.createGeneratedPdf({
          processId,
          pdfType: "salida_producto",
          fileName: `warehouse-proceso-${processId}.pdf`,
          filePath: null
        });
      } catch (error) {
        console.log('Error saving PDF record:', error);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to generate warehouse report" });
    }
  });

  // Generate entry report (for entrada processes)
  app.get("/api/processes/:id/reports/entry", async (req, res) => {
    try {
      const processId = parseInt(req.params.id);
      const process = await storage.getProcessWithDetails(processId);
      
      if (!process) {
        return res.status(404).json({ error: "Process not found" });
      }

      if (process.processType !== "entrada") {
        return res.status(400).json({ error: "This report is only for entry processes" });
      }

      const pdfContent = {
        title: "Reporte de Entrada a Bodega",
        processId: process.id,
        processType: "ENTRADA",
        date: new Date().toLocaleDateString("es-ES"),
        product: {
          name: process.product.name,
          weight: `${process.product.weight / 1000} kg`,
          dimensions: `${process.product.dimensions.length}x${process.product.dimensions.width}x${process.product.dimensions.height} cm`,
          regulations: Object.entries(process.product.regulations)
            .filter(([_, value]) => value)
            .map(([key]) => {
              const labels = {
                fragile: "Frágil",
                lithium: "Batería Litio",
                hazardous: "Peligroso", 
                refrigerated: "Refrigerado",
                valuable: "Valioso",
                oversized: "Sobre-dimensionado"
              };
              return labels[key as keyof typeof labels];
            })
        },
        transport: process.transport ? {
          driver: process.transport.driverName,
          license: process.transport.licenseNumber,
          vehicle: `${process.transport.vehicleType} - ${process.transport.vehiclePlate}`,
          notes: process.transport.notes || "Sin observaciones"
        } : null,
        status: process.status,
        event3Status: process.event3Status,
        complaintNotes: process.complaintNotes,
        confirmedAt: process.confirmedAt ? new Date(process.confirmedAt).toLocaleString("es-ES") : null,
        createdAt: new Date(process.createdAt).toLocaleString("es-ES")
      };

      res.json(pdfContent);
      
      // Auto-save PDF record to history
      try {
        await storage.createGeneratedPdf({
          processId,
          pdfType: "entrada_confirmacion",
          fileName: `entrada-proceso-${processId}.pdf`,
          filePath: null
        });
      } catch (error) {
        console.log('Error saving PDF record:', error);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to generate entry report" });
    }
  });

  // Generate transport invoice (for external company billing us)
  app.get("/api/processes/:id/reports/transport-invoice", async (req, res) => {
    try {
      const processId = parseInt(req.params.id);
      const process = await storage.getProcessWithDetails(processId);
      
      if (!process || !process.transport) {
        return res.status(404).json({ error: "Process or transport not found" });
      }

      // Calculate invoice amount based on weight and distance (mock calculation)
      const baseRate = 50000; // Base rate in CLP
      const weightRate = process.product.weight / 1000 * 5000; // 5000 CLP per kg
      const invoiceAmount = baseRate + weightRate;

      const pdfContent = {
        title: "Factura de Transporte",
        invoiceNumber: `FAC-${process.id.toString().padStart(6, '0')}`,
        date: new Date().toLocaleDateString("es-ES"),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("es-ES"), // 30 days from now
        
        // External transport company (billing us)
        billingCompany: {
          name: "Transportes Rápidos Express S.A.",
          rut: "76.543.210-K",
          address: "Av. Logística 1234, Santiago",
          phone: "+56 2 2345 6789",
          email: "facturacion@transportesrapidos.cl"
        },
        
        // Our company (being billed)
        clientCompany: {
          name: "Cargo Fast",
          rut: "12.345.678-9",
          address: "Av. Industrial 5678, Santiago",
          phone: "+56 2 9876 5432",
          email: "admin@cargofast.cl"
        },
        
        serviceDetails: {
          description: "Servicio de transporte de mercancías",
          processId: process.id,
          product: process.product.name,
          weight: `${process.product.weight / 1000} kg`,
          driver: process.transport.driverName,
          vehicle: `${process.transport.vehicleType} - ${process.transport.vehiclePlate}`,
          serviceDate: new Date(process.createdAt).toLocaleDateString("es-ES")
        },
        
        billing: {
          subtotal: invoiceAmount,
          tax: invoiceAmount * 0.19, // 19% IVA
          total: invoiceAmount * 1.19
        },
        
        notes: process.transport.notes || "Servicio de transporte completado satisfactoriamente"
      };

      res.json(pdfContent);
      
      // Auto-save PDF record to history
      try {
        await storage.createGeneratedPdf({
          processId,
          pdfType: "factura",
          fileName: `factura-transporte-${processId}.pdf`,
          filePath: null
        });
      } catch (error) {
        console.log('Error saving PDF record:', error);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to generate transport invoice" });
    }
  });

  app.get("/api/processes/:id/reports/transport", async (req, res) => {
    try {
      const processId = parseInt(req.params.id);
      const process = await storage.getProcessWithDetails(processId);
      
      if (!process) {
        return res.status(404).json({ error: "Process not found" });
      }

      const pdfContent = {
        title: "Reporte de Transporte",
        processId: process.id,
        processType: process.processType.toUpperCase(),
        date: new Date().toLocaleDateString("es-ES"),
        product: {
          name: process.product.name,
          weight: `${process.product.weight / 1000} kg`,
          dimensions: `${process.product.dimensions.length}x${process.product.dimensions.width}x${process.product.dimensions.height} cm`
        },
        transport: process.transport ? {
          driver: process.transport.driverName,
          license: process.transport.licenseNumber,
          vehicle: `${process.transport.vehicleType.toUpperCase()} - ${process.transport.vehiclePlate}`,
          notes: process.transport.notes || "Sin observaciones especiales"
        } : { error: "Información de transporte no disponible" },
        route: process.delivery ? {
          origin: process.delivery.originPlace,
          destination: process.delivery.destinationPlace,
          departureTime: new Date(process.delivery.departureTime).toLocaleString("es-ES")
        } : { error: "Información de ruta no disponible" },
        status: process.status,
        createdAt: new Date(process.createdAt).toLocaleString("es-ES")
      };

      res.json(pdfContent);
      
      // Auto-save PDF record to history
      try {
        await storage.createGeneratedPdf({
          processId,
          pdfType: "factura",
          fileName: `transport-proceso-${processId}.pdf`,
          filePath: null
        });
      } catch (error) {
        console.log('Error saving PDF record:', error);
      }
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

      const pdfContent = {
        title: "Factura de Servicios Logísticos",
        processId: process.id,
        processType: process.processType.toUpperCase(),
        date: new Date().toLocaleDateString("es-ES"),
        invoiceNumber: `INV-${process.id.toString().padStart(6, '0')}`,
        product: {
          name: process.product.name,
          weight: `${process.product.weight / 1000} kg`,
          dimensions: `${process.product.dimensions.length}x${process.product.dimensions.width}x${process.product.dimensions.height} cm`,
          regulations: Object.entries(process.product.regulations)
            .filter(([_, value]) => value)
            .map(([key]) => {
              const labels = {
                fragile: "Manejo especial frágil",
                lithium: "Transporte batería litio",
                hazardous: "Material peligroso",
                refrigerated: "Cadena de frío",
                valuable: "Seguro adicional",
                oversized: "Carga sobre-dimensionada"
              };
              return labels[key as keyof typeof labels];
            })
        },
        services: [
          { 
            description: process.processType === "entrada" ? "Recepción en bodega" : "Preparación para envío",
            quantity: 1,
            unitPrice: 25000,
            total: 25000
          },
          ...(process.transport ? [{
            description: "Servicio de transporte",
            quantity: 1, 
            unitPrice: 35000,
            total: 35000
          }] : []),
          ...(process.delivery ? [{
            description: "Entrega a destino",
            quantity: 1,
            unitPrice: 15000,
            total: 15000
          }] : [])
        ],
        transport: process.transport,
        delivery: process.delivery,
        status: process.status,
        createdAt: new Date(process.createdAt).toLocaleString("es-ES")
      };

      // Calculate totals
      const subtotal = pdfContent.services.reduce((sum, service) => sum + service.total, 0);
      const iva = Math.round(subtotal * 0.19);
      const total = subtotal + iva;

      (pdfContent as any).totals = {
        subtotal,
        iva,
        total
      };

      res.json(pdfContent);
      
      // Auto-save PDF record to history
      try {
        await storage.createGeneratedPdf({
          processId,
          pdfType: "factura",
          fileName: `invoice-proceso-${processId}.pdf`,
          filePath: null
        });
      } catch (error) {
        console.log('Error saving PDF record:', error);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to generate invoice report" });
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

  // PDF History endpoints
  app.post("/api/pdfs", async (req, res) => {
    try {
      const pdfData = req.body;
      const pdf = await storage.createGeneratedPdf(pdfData);
      res.json(pdf);
    } catch (error) {
      res.status(500).json({ error: "Failed to save PDF record" });
    }
  });

  app.get("/api/pdfs/history", async (req, res) => {
    try {
      const processes = await storage.getAllProcessesWithDetails();
      const processesWithPdfs = processes.filter(p => p.pdfs && p.pdfs.length > 0);
      res.json(processesWithPdfs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch PDF history" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
