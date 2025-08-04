import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { z } from "zod";
import { ArrowRight, ArrowLeft, Camera, Pause } from "lucide-react";
import { ProcessHeader } from "@/components/process-header";
import { ProgressBar } from "@/components/progress-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TransportFormData, VehicleType } from "@/lib/types";
import type { ProcessWithDetails } from "@shared/schema";

const transportSchema = z.object({
  driverName: z.string().min(1, "El nombre del conductor es requerido"),
  licenseNumber: z.string().min(1, "El número de licencia es requerido"),
  vehicleType: z.enum(["camion", "van", "furgon", "trailer", "moto"]),
  vehiclePlate: z.string().min(1, "La placa del vehículo es requerida"),
  driverPhoto: z.string().optional(),
  notes: z.string().optional(),
});

export default function Event2() {
  const [, setLocation] = useLocation();
  const { processId } = useParams<{ processId: string }>();
  const { toast } = useToast();

  const { data: process, isLoading } = useQuery<ProcessWithDetails>({
    queryKey: ["/api/processes", processId],
  });

  const form = useForm<TransportFormData>({
    resolver: zodResolver(transportSchema),
    defaultValues: {
      driverName: "",
      licenseNumber: "",
      vehicleType: "camion",
      vehiclePlate: "",
      driverPhoto: "",
      notes: "",
    },
  });

  const updateProcessMutation = useMutation({
    mutationFn: (data: TransportFormData) => 
      apiRequest("POST", `/api/processes/${processId}/transport`, data),
    onSuccess: async (response) => {
      const updatedProcess = await response.json();
      toast({
        title: "Transporte registrado",
        description: "La información del transporte ha sido registrada exitosamente.",
      });
      
      // Navigate to appropriate event 3 based on flow type
      if (updatedProcess.processType === "entrada") {
        setLocation(`/event3-entrada/${processId}`);
      } else {
        setLocation(`/event3/${processId}`);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo registrar la información del transporte. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const pauseProcessMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/processes/${processId}/pause`),
    onSuccess: () => {
      toast({
        title: "Proceso pausado",
        description: "El proceso ha sido pausado. Puedes continuarlo desde el dashboard.",
      });
      setLocation("/");
    },
  });

  const onSubmit = (data: TransportFormData) => {
    updateProcessMutation.mutate(data);
  };

  const handlePause = () => {
    pauseProcessMutation.mutate();
  };

  const watchedValues = form.watch();

  const getVehicleTypeLabel = (type: VehicleType) => {
    const labels = {
      camion: "Camión",
      van: "Van",
      furgon: "Furgón",
      trailer: "Tráiler",
      moto: "Motocicleta",
    };
    return labels[type];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">Cargando proceso...</div>
        </div>
      </div>
    );
  }

  if (!process) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-red-600">Proceso no encontrado</div>
          <Button className="mt-4" onClick={() => setLocation("/")}>
            Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <ProcessHeader 
          title="Evento 2: Información de Transporte"
          onClose={() => setLocation("/")}
        />

        <Card className="card-shadow">
          <CardContent className="p-6">
            <ProgressBar 
              currentStep={2} 
              totalSteps={4} 
              flowType={process.processType}
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle>Datos del Transporte</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="driverName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre del Transportista</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Juan Carlos Rodríguez" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="licenseNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número de Licencia</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="12345678" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="vehicleType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Vehículo</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="camion">Camión</SelectItem>
                                <SelectItem value="van">Van</SelectItem>
                                <SelectItem value="furgon">Furgón</SelectItem>
                                <SelectItem value="trailer">Tráiler</SelectItem>
                                <SelectItem value="moto">Motocicleta</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="vehiclePlate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Placa del Vehículo</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="ABC-123" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="driverPhoto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Foto del Conductor</FormLabel>
                          <FormControl>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[--logistics-primary] transition-all">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Camera className="h-8 w-8 text-gray-400" />
                              </div>
                              <p className="text-sm text-gray-500 mb-2">Subir foto del conductor</p>
                              <Button type="button" variant="outline">
                                Seleccionar Archivo
                              </Button>
                              <Input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => {
                                  // Handle file upload here
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    // Convert to base64 or handle upload
                                    field.onChange(file.name);
                                  }
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notas Opcionales</FormLabel>
                          <FormControl>
                            <Textarea 
                              rows={4}
                              placeholder="Información adicional sobre el transporte..." 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-4 pt-6">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={handlePause}
                        disabled={pauseProcessMutation.isPending}
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Pausar Proceso
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setLocation("/event1")}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Anterior
                      </Button>
                      <Button 
                        type="submit" 
                        className="btn-logistics-primary"
                        disabled={updateProcessMutation.isPending}
                      >
                        {updateProcessMutation.isPending ? "Procesando..." : 
                         process.processType === "entrada" ? "Completar Proceso" : "Continuar a Evento 3"}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Transport Summary */}
          <div>
            <Card className="card-shadow sticky top-24">
              <CardHeader>
                <CardTitle className="text-base">Resumen del Transporte</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Conductor:</span>
                    <span className="font-medium">{watchedValues.driverName || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Licencia:</span>
                    <span className="font-medium">{watchedValues.licenseNumber || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Vehículo:</span>
                    <span className="font-medium">
                      {watchedValues.vehicleType ? getVehicleTypeLabel(watchedValues.vehicleType) : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Placa:</span>
                    <span className="font-medium">{watchedValues.vehiclePlate || "-"}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <span className="text-gray-500">Estado:</span>
                    <div className="mt-2">
                      <span className="px-2 py-1 bg-[--logistics-warning-light] text-[--logistics-warning] rounded-full text-xs">
                        Pendiente
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
