import { 
  products, transports, deliveries, processes, generatedPdfs,
  type Product, type Transport, type Delivery, type Process, type GeneratedPdf,
  type InsertProduct, type InsertTransport, type InsertDelivery, type InsertProcess, type InsertGeneratedPdf,
  type ProcessWithDetails
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Products
  createProduct(product: InsertProduct): Promise<Product>;
  getProduct(id: number): Promise<Product | undefined>;
  getAllProducts(): Promise<Product[]>;

  // Transports
  createTransport(transport: InsertTransport): Promise<Transport>;
  getTransport(id: number): Promise<Transport | undefined>;
  updateTransport(id: number, transport: Partial<InsertTransport>): Promise<Transport | undefined>;

  // Deliveries
  createDelivery(delivery: InsertDelivery): Promise<Delivery>;
  getDelivery(id: number): Promise<Delivery | undefined>;
  updateDelivery(id: number, delivery: Partial<InsertDelivery>): Promise<Delivery | undefined>;

  // Processes
  createProcess(process: InsertProcess): Promise<Process>;
  getProcess(id: number): Promise<Process | undefined>;
  updateProcess(id: number, process: Partial<InsertProcess>): Promise<Process | undefined>;
  getAllProcesses(): Promise<Process[]>;
  getActiveProcesses(): Promise<Process[]>;
  getProcessWithDetails(id: number): Promise<ProcessWithDetails | undefined>;
  getAllProcessesWithDetails(): Promise<ProcessWithDetails[]>;

  // PDFs
  createGeneratedPdf(pdf: InsertGeneratedPdf): Promise<GeneratedPdf>;
  getProcessPdfs(processId: number): Promise<GeneratedPdf[]>;

  // Stats
  getStats(): Promise<{
    totalProducts: number;
    inTransit: number;
    delivered: number;
    activeProcesses: number;
  }>;
}



export class DatabaseStorage implements IStorage {
  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async createTransport(insertTransport: InsertTransport): Promise<Transport> {
    const [transport] = await db.insert(transports).values(insertTransport).returning();
    return transport;
  }

  async getTransport(id: number): Promise<Transport | undefined> {
    const [transport] = await db.select().from(transports).where(eq(transports.id, id));
    return transport || undefined;
  }

  async updateTransport(id: number, transport: Partial<InsertTransport>): Promise<Transport | undefined> {
    const [updated] = await db.update(transports)
      .set(transport)
      .where(eq(transports.id, id))
      .returning();
    return updated || undefined;
  }

  async createDelivery(insertDelivery: InsertDelivery): Promise<Delivery> {
    const [delivery] = await db.insert(deliveries).values(insertDelivery).returning();
    return delivery;
  }

  async getDelivery(id: number): Promise<Delivery | undefined> {
    const [delivery] = await db.select().from(deliveries).where(eq(deliveries.id, id));
    return delivery || undefined;
  }

  async updateDelivery(id: number, delivery: Partial<InsertDelivery>): Promise<Delivery | undefined> {
    const [updated] = await db.update(deliveries)
      .set(delivery)
      .where(eq(deliveries.id, id))
      .returning();
    return updated || undefined;
  }

  async createProcess(insertProcess: InsertProcess): Promise<Process> {
    const [process] = await db.insert(processes).values(insertProcess).returning();
    return process;
  }

  async getProcess(id: number): Promise<Process | undefined> {
    const [process] = await db.select().from(processes).where(eq(processes.id, id));
    return process || undefined;
  }

  async updateProcess(id: number, process: Partial<InsertProcess>): Promise<Process | undefined> {
    const [updated] = await db.update(processes)
      .set({ ...process, updatedAt: new Date() })
      .where(eq(processes.id, id))
      .returning();
    return updated || undefined;
  }

  async getAllProcesses(): Promise<Process[]> {
    return await db.select().from(processes);
  }

  async getActiveProcesses(): Promise<Process[]> {
    return await db.select().from(processes).where(
      eq(processes.status, 'in_progress')
    );
  }

  async getProcessWithDetails(id: number): Promise<ProcessWithDetails | undefined> {
    const result = await db.select({
      process: processes,
      product: products,
      transport: transports,
      delivery: deliveries,
    })
    .from(processes)
    .leftJoin(products, eq(processes.productId, products.id))
    .leftJoin(transports, eq(processes.transportId, transports.id))
    .leftJoin(deliveries, eq(processes.deliveryId, deliveries.id))
    .where(eq(processes.id, id));

    if (!result[0] || !result[0].product) return undefined;

    const pdfs = await this.getProcessPdfs(id);

    return {
      ...result[0].process,
      product: result[0].product,
      transport: result[0].transport || undefined,
      delivery: result[0].delivery || undefined,
      pdfs,
    };
  }

  async getAllProcessesWithDetails(): Promise<ProcessWithDetails[]> {
    const result = await db.select({
      process: processes,
      product: products,
      transport: transports,
      delivery: deliveries,
    })
    .from(processes)
    .leftJoin(products, eq(processes.productId, products.id))
    .leftJoin(transports, eq(processes.transportId, transports.id))
    .leftJoin(deliveries, eq(processes.deliveryId, deliveries.id));

    const processesWithDetails: ProcessWithDetails[] = [];
    
    for (const row of result) {
      if (row.product) {
        const pdfs = await this.getProcessPdfs(row.process.id);
        processesWithDetails.push({
          ...row.process,
          product: row.product,
          transport: row.transport || undefined,
          delivery: row.delivery || undefined,
          pdfs,
        });
      }
    }
    
    return processesWithDetails;
  }

  async createGeneratedPdf(insertPdf: InsertGeneratedPdf): Promise<GeneratedPdf> {
    const [pdf] = await db.insert(generatedPdfs).values(insertPdf).returning();
    return pdf;
  }

  async getProcessPdfs(processId: number): Promise<GeneratedPdf[]> {
    return await db.select().from(generatedPdfs).where(eq(generatedPdfs.processId, processId));
  }

  async getStats() {
    const allProcesses = await db.select().from(processes);
    const totalProducts = await db.select().from(products);
    
    return {
      totalProducts: totalProducts.length,
      inTransit: allProcesses.filter(p => p.currentEvent === 3 && p.status === 'in_progress').length,
      delivered: allProcesses.filter(p => p.status === 'completed').length,
      activeProcesses: allProcesses.filter(p => p.status === 'in_progress' || p.status === 'paused').length,
    };
  }
}

export class MemStorage implements IStorage {
  private products: Map<number, Product>;
  private transports: Map<number, Transport>;
  private deliveries: Map<number, Delivery>;
  private processes: Map<number, Process>;
  private pdfs: Map<number, GeneratedPdf>;
  private currentProductId: number;
  private currentTransportId: number;
  private currentDeliveryId: number;
  private currentProcessId: number;
  private currentPdfId: number;

  constructor() {
    this.products = new Map();
    this.transports = new Map();
    this.deliveries = new Map();
    this.processes = new Map();
    this.pdfs = new Map();
    this.currentProductId = 1;
    this.currentTransportId = 1;
    this.currentDeliveryId = 1;
    this.currentProcessId = 1;
    this.currentPdfId = 1;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const product: Product = {
      ...insertProduct,
      id,
      createdAt: new Date(),
    };
    this.products.set(id, product);
    return product;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async createTransport(insertTransport: InsertTransport): Promise<Transport> {
    const id = this.currentTransportId++;
    const transport: Transport = {
      ...insertTransport,
      id,
      createdAt: new Date(),
      driverPhoto: insertTransport.driverPhoto || null,
      notes: insertTransport.notes || null,
    };
    this.transports.set(id, transport);
    return transport;
  }

  async getTransport(id: number): Promise<Transport | undefined> {
    return this.transports.get(id);
  }

  async updateTransport(id: number, transport: Partial<InsertTransport>): Promise<Transport | undefined> {
    const existing = this.transports.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...transport };
    this.transports.set(id, updated);
    return updated;
  }

  async createDelivery(insertDelivery: any): Promise<Delivery> {
    const id = this.currentDeliveryId++;
    const delivery: Delivery = {
      ...insertDelivery,
      id,
      deliveryNotes: insertDelivery.deliveryNotes || null,
      completedAt: new Date(),
    };
    this.deliveries.set(id, delivery);
    return delivery;
  }

  async getDelivery(id: number): Promise<Delivery | undefined> {
    return this.deliveries.get(id);
  }

  async updateDelivery(id: number, delivery: Partial<InsertDelivery>): Promise<Delivery | undefined> {
    const existing = this.deliveries.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...delivery };
    this.deliveries.set(id, updated);
    return updated;
  }

  async createProcess(insertProcess: InsertProcess): Promise<Process> {
    const id = this.currentProcessId++;
    const process: Process = {
      id,
      productId: insertProcess.productId,
      transportId: insertProcess.transportId || null,
      deliveryId: insertProcess.deliveryId || null,
      currentEvent: insertProcess.currentEvent || 1,
      status: insertProcess.status || "draft",
      processType: insertProcess.processType,
      event3Status: insertProcess.event3Status || null,
      complaintNotes: insertProcess.complaintNotes || null,
      confirmedAt: insertProcess.confirmedAt || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.processes.set(id, process);
    return process;
  }

  async getProcess(id: number): Promise<Process | undefined> {
    return this.processes.get(id);
  }

  async updateProcess(id: number, process: Partial<InsertProcess>): Promise<Process | undefined> {
    const existing = this.processes.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...process, updatedAt: new Date() };
    this.processes.set(id, updated);
    return updated;
  }

  async getAllProcesses(): Promise<Process[]> {
    return Array.from(this.processes.values());
  }

  async getActiveProcesses(): Promise<Process[]> {
    return Array.from(this.processes.values()).filter(
      p => p.status === 'in_progress' || p.status === 'paused'
    );
  }

  async getProcessWithDetails(id: number): Promise<ProcessWithDetails | undefined> {
    const process = this.processes.get(id);
    if (!process) return undefined;

    const product = this.products.get(process.productId);
    if (!product) return undefined;

    const transport = process.transportId ? this.transports.get(process.transportId) : undefined;
    const delivery = process.deliveryId ? this.deliveries.get(process.deliveryId) : undefined;
    const pdfs = await this.getProcessPdfs(id);

    return {
      ...process,
      product,
      transport,
      delivery,
      pdfs,
    };
  }

  async getAllProcessesWithDetails(): Promise<ProcessWithDetails[]> {
    const processesWithDetails: ProcessWithDetails[] = [];
    
    for (const process of Array.from(this.processes.values())) {
      const withDetails = await this.getProcessWithDetails(process.id);
      if (withDetails) {
        processesWithDetails.push(withDetails);
      }
    }
    
    return processesWithDetails;
  }

  async createGeneratedPdf(insertPdf: InsertGeneratedPdf): Promise<GeneratedPdf> {
    const id = this.currentPdfId++;
    const pdf: GeneratedPdf = {
      ...insertPdf,
      id,
      filePath: insertPdf.filePath || null,
      generatedAt: new Date(),
    };
    this.pdfs.set(id, pdf);
    return pdf;
  }

  async getProcessPdfs(processId: number): Promise<GeneratedPdf[]> {
    return Array.from(this.pdfs.values()).filter(pdf => pdf.processId === processId);
  }

  async getStats() {
    const allProcesses = Array.from(this.processes.values());
    
    return {
      totalProducts: this.products.size,
      inTransit: allProcesses.filter(p => p.currentEvent === 3 && p.status === 'in_progress').length,
      delivered: allProcesses.filter(p => p.status === 'completed').length,
      activeProcesses: allProcesses.filter(p => p.status === 'in_progress' || p.status === 'paused').length,
    };
  }
}

export const storage = new DatabaseStorage();
