import { 
  products, transports, deliveries, processes,
  type Product, type Transport, type Delivery, type Process,
  type InsertProduct, type InsertTransport, type InsertDelivery, type InsertProcess,
  type ProcessWithDetails
} from "@shared/schema";

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

  // Stats
  getStats(): Promise<{
    totalProducts: number;
    inTransit: number;
    delivered: number;
    activeProcesses: number;
  }>;
}

export class MemStorage implements IStorage {
  private products: Map<number, Product>;
  private transports: Map<number, Transport>;
  private deliveries: Map<number, Delivery>;
  private processes: Map<number, Process>;
  private currentProductId: number;
  private currentTransportId: number;
  private currentDeliveryId: number;
  private currentProcessId: number;

  constructor() {
    this.products = new Map();
    this.transports = new Map();
    this.deliveries = new Map();
    this.processes = new Map();
    this.currentProductId = 1;
    this.currentTransportId = 1;
    this.currentDeliveryId = 1;
    this.currentProcessId = 1;
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

    return {
      ...process,
      product,
      transport,
      delivery,
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

export const storage = new MemStorage();
