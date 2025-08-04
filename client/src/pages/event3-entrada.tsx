import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { ProcessWithDetails } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  ArrowLeft,
  User,
  Truck
} from "lucide-react";

export default function Event3Entrada() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [complaintNotes, setComplaintNotes] = useState("");
  const [selectedAction, setSelectedAction] = useState<"confirmed" | "complaint" | null>(null);

  // Get process ID from URL params
  const { processId } = useParams<{ processId: string }>();

  const { data: process, isLoading } = useQuery<ProcessWithDetails>({
    queryKey: ["/api/processes", processId],
    enabled: !!processId,
  });

  const completeProcessMutation = useMutation({
    mutationFn: async (data: { action: "confirmed" | "complaint"; notes?: string }) => {
      return apiRequest("POST", `/api/processes/${processId}/complete-event3-entrada`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/processes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      if (selectedAction === "confirmed") {
        toast({
          title: "Proceso Completado",
          description: "El producto fue confirmado como recibido correctamente.",
        });
        setLocation("/");
      } else {
        toast({
          title: "Queja Registrada",
          description: "La queja fue registrada. El proceso queda abierto para seguimiento.",
          variant: "destructive",
        });
        setLocation("/");
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo completar la acción. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleConfirmReceived = () => {
    setSelectedAction("confirmed");
    completeProcessMutation.mutate({ action: "confirmed" });
  };

  const handleRegisterComplaint = () => {
    if (!complaintNotes.trim()) {
      toast({
        title: "Notas Requeridas",
        description: "Por favor describe el problema en las notas.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedAction("complaint");
    completeProcessMutation.mutate({ 
      action: "complaint", 
      notes: complaintNotes 
    });
  };

  if (!processId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No se encontró el ID del proceso</p>
            <Button 
              onClick={() => setLocation("/")} 
              className="mt-4"
            >
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">Cargando información del proceso...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!process) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No se encontró el proceso</p>
            <Button 
              onClick={() => setLocation("/")} 
              className="mt-4"
            >
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/")}
            className="text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Evento 3: Confirmación de Recepción
            </h1>
            <p className="text-gray-500 mt-2">
              Proceso #{process.id} - Entrada a Bodega
            </p>
          </div>
        </div>
      </div>

      {/* Process Summary */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-blue-600" />
            <span>Resumen del Proceso</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Product Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-gray-700">Producto</span>
              </div>
              <div className="pl-6">
                <p className="font-semibold text-gray-900">{process.product.name}</p>
                <p className="text-sm text-gray-500">
                  {process.product.dimensions.length}×{process.product.dimensions.width}×{process.product.dimensions.height} cm
                </p>
                <p className="text-sm text-gray-500">{process.product.weight}g</p>
              </div>
            </div>

            {/* Transport Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Truck className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-gray-700">Transporte</span>
              </div>
              <div className="pl-6">
                <p className="font-semibold text-gray-900">{process.transport?.driverName}</p>
                <p className="text-sm text-gray-500">{process.transport?.vehicleType}</p>
                <p className="text-sm text-gray-500">{process.transport?.vehiclePlate}</p>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-gray-700">Estado</span>
              </div>
              <div className="pl-6">
                <p className="font-semibold text-gray-900">Esperando Confirmación</p>
                <p className="text-sm text-gray-500">Evento 3 de 3</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Selection */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>Confirmación de Recepción</CardTitle>
          <p className="text-gray-500">
            ¿Se recibió la carga según lo esperado?
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Confirmation Option */}
            <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-green-500 hover:bg-green-50 transition-all">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Confirmar Recepción
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    El producto fue recibido correctamente según las especificaciones
                  </p>
                  <Button 
                    onClick={handleConfirmReceived}
                    disabled={completeProcessMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {completeProcessMutation.isPending && selectedAction === "confirmed" ? (
                      "Confirmando..."
                    ) : (
                      "Confirmar y Cerrar Proceso"
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Complaint Option */}
            <div className="border-2 border-gray-200 rounded-lg p-6 hover:border-red-500 hover:bg-red-50 transition-all">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Registrar Queja
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Hubo problemas con el producto recibido
                  </p>
                  
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Describe el problema encontrado..."
                      value={complaintNotes}
                      onChange={(e) => setComplaintNotes(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <Button 
                      onClick={handleRegisterComplaint}
                      disabled={completeProcessMutation.isPending || !complaintNotes.trim()}
                      variant="destructive"
                      className="w-full"
                    >
                      {completeProcessMutation.isPending && selectedAction === "complaint" ? (
                        "Registrando Queja..."
                      ) : (
                        "Registrar Queja"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}