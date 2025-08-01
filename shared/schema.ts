import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  dimensions: jsonb("dimensions").$type<{
    length: number;
    width: number;
    height: number;
  }>().notNull(),
  weight: integer("weight").notNull(), // in grams
  regulations: jsonb("regulations").$type<{
    fragile: boolean;
    lithium: boolean;
    hazardous: boolean;
    refrigerated: boolean;
    valuable: boolean;
    oversized: boolean;
  }>().notNull(),
  flowType: text("flow_type", { enum: ["entrada", "salida"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transports = pgTable("transports", {
  id: serial("id").primaryKey(),
  driverName: text("driver_name").notNull(),
  licenseNumber: text("license_number").notNull(),
  vehicleType: text("vehicle_type", { 
    enum: ["camion", "van", "furgon", "trailer", "moto"] 
  }).notNull(),
  vehiclePlate: text("vehicle_plate").notNull(),
  driverPhoto: text("driver_photo"), // base64 or file path
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deliveries = pgTable("deliveries", {
  id: serial("id").primaryKey(),
  originPlace: text("origin_place").notNull(),
  destinationPlace: text("destination_place").notNull(),
  departureTime: timestamp("departure_time").notNull(),
  deliveryNotes: text("delivery_notes"),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const processes = pgTable("processes", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  transportId: integer("transport_id").references(() => transports.id),
  deliveryId: integer("delivery_id").references(() => deliveries.id),
  currentEvent: integer("current_event").notNull().default(1), // 1-4 (salida) or 1-3 (entrada)
  status: text("status", { 
    enum: ["draft", "in_progress", "paused", "completed", "complaint"] 
  }).notNull().default("draft"),
  processType: text("process_type", { enum: ["entrada", "salida"] }).notNull(),
  // Campos específicos para evento 3 de entrada
  event3Status: text("event3_status", { enum: ["confirmed", "complaint"] }),
  complaintNotes: text("complaint_notes"),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertTransportSchema = createInsertSchema(transports).omit({
  id: true,
  createdAt: true,
});

export const insertDeliverySchema = createInsertSchema(deliveries).omit({
  id: true,
  completedAt: true,
});

export const insertProcessSchema = createInsertSchema(processes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertTransport = z.infer<typeof insertTransportSchema>;
export type Transport = typeof transports.$inferSelect;

export type InsertDelivery = z.infer<typeof insertDeliverySchema>;
export type Delivery = typeof deliveries.$inferSelect;

export type InsertProcess = z.infer<typeof insertProcessSchema>;
export type Process = typeof processes.$inferSelect;

// Extended types for API responses
export type ProcessWithDetails = Process & {
  product: Product;
  transport?: Transport;
  delivery?: Delivery;
};
