import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { z } from "zod";
import { ArrowLeft, Check } from "lucide-react";
import { ProcessHeader } from "@/components/process-header";
import { ProgressBar } from "@/components/progress-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DeliveryFormData } from "@/lib/types";
import type { ProcessWithDetails } from "@shared/schema";

const deliverySchema = z.object({
  originPlace: z.string().min(1, "El lugar de salida es requerido"),
  destinationPlace: z.string().min(1, "El lugar de destino es requerido"),
  departureTime: z.string().min(1, "La fecha y hora de salida es requerida"),
  travelTime: z.coerce.number().min(1, "El tiempo de traslado debe ser mayor a 0"),
  deliveryNotes: z.string().optional(),
});

export default function Event3() {
  const [, setLocation] = useLocation();
  const { processId } = useParams<{ processId: string }>();
  const { toast } = useToast();

  const { data: process, isLoading } = useQuery<ProcessWithDetails>({
    queryKey: ["/api/processes", processId],
  });

  const form = useForm<DeliveryFormData>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      originPlace: "",
      destinationPlace: "",
      departureTime: "",
      travelTime: 0,
      deliveryNotes: "",
    },
  });

  const updateProcessMutation = useMutation({
    mutationFn: (data: DeliveryFormData) => {
      const processedData = {
        ...data,
        departureTime: new Date(data.departureTime).toISOString(),
      };
      return apiRequest("POST", `/api/processes/${processId}/delivery`, processedData);
    },
    onSuccess: () => {
      toast({
        title: "Entrega registrada",
        description: "La información de entrega ha sido registrada exitosamente.",
      });
      setLocation(`/event4/${processId}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo registrar la información de entrega. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DeliveryFormData) => {
    updateProcessMutation.mutate(data);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
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
          title="Evento 3: Entrega del Producto"
          onClose={() => setLocation("/")}
        />

        <Card className="card-shadow">
          <CardContent className="p-6">
            <ProgressBar 
              currentStep={3} 
              totalSteps={4} 
              flowType={process.processType}
            />
          </CardContent>
        </Card>

        {/* Delivery Status */}
        <Card className="card-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Estado del Envío</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-[--logistics-warning] rounded-full animate-pulse"></div>
                <Badge className="bg-[--logistics-warning-light] text-[--logistics-warning]">
                  En Transporte
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {/* Product and Transport Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Información del Producto</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Producto:</span>
                    <span>{process.product.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Peso:</span>
                    <span>{process.product.weight / 1000} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Dimensiones:</span>
                    <span>
                      {process.product.dimensions.length}x{process.product.dimensions.width}x{process.product.dimensions.height} cm
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Información del Transporte</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Conductor:</span>
                    <span>{process.transport?.driverName || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Vehículo:</span>
                    <span>
                      {process.transport?.vehicleType || "N/A"} - {process.transport?.vehiclePlate || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Inicio de Transporte:</span>
                    <span>{formatDate(process.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Action */}
            <div className="border-t border-gray-200 pt-8">
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-4">Registro de Entrega</h4>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="originPlace"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lugar de Salida</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Bodega Central" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="destinationPlace"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lugar de Destino</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Cliente Final" 
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
                        name="departureTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha y Hora de Salida</FormLabel>
                            <FormControl>
                              <Input 
                                type="datetime-local" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="travelTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tiempo de Traslado (minutos)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="45" 
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="deliveryNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notas de Entrega</FormLabel>
                          <FormControl>
                            <Textarea 
                              rows={3}
                              placeholder="Detalles adicionales sobre la entrega..." 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-4">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setLocation(`/event2/${processId}`)}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Anterior
                      </Button>
                      <Button 
                        type="submit" 
                        className="btn-logistics-secondary"
                        disabled={updateProcessMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        {updateProcessMutation.isPending ? "Procesando..." : "Marcar como Entregado"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
