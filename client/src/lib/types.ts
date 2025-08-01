export type FlowType = "entrada" | "salida";
export type VehicleType = "camion" | "van" | "furgon" | "trailer" | "moto";
export type ProcessStatus = "draft" | "in_progress" | "paused" | "completed";

export interface ProductFormData {
  name: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  weight: number;
  regulations: {
    fragile: boolean;
    lithium: boolean;
    hazardous: boolean;
    refrigerated: boolean;
    valuable: boolean;
    oversized: boolean;
  };
  flowType: FlowType;
}

export interface TransportFormData {
  driverName: string;
  licenseNumber: string;
  vehicleType: VehicleType;
  vehiclePlate: string;
  driverPhoto?: string;
  notes?: string;
}

export interface DeliveryFormData {
  originPlace: string;
  destinationPlace: string;
  departureTime: string;
  deliveryNotes?: string;
}

export interface DashboardStats {
  totalProducts: number;
  inTransit: number;
  delivered: number;
  activeProcesses: number;
}
