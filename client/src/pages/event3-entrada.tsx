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
  Truck,
  FileText,
  Download
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

      {/* PDF Generation Section */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>Documentos Disponibles</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => generatePDF('entry')}
              variant="outline"
              className="flex items-center space-x-2 h-12"
            >
              <Download className="h-4 w-4" />
              <span>Reporte de Entrada a Bodega</span>
            </Button>
            
            {process.transport && (
              <Button
                onClick={() => generatePDF('transport-invoice')}
                variant="outline"
                className="flex items-center space-x-2 h-12"
              >
                <Download className="h-4 w-4" />
                <span>Factura de Transporte</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // PDF Generation function
  const generatePDF = async (type: 'entry' | 'transport-invoice') => {
    try {
      const response = await fetch(`/api/processes/${processId}/reports/${type}`);
      const data = await response.json();
      
      // Import jsPDF and generate PDF
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF();
      const logo = '/assets/logo.png';
      
      // Header with logo
      doc.addImage(logo, 'PNG', 15, 15, 30, 15);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Cargo Fast', 50, 25);
      
      // Title
      doc.setFontSize(16);
      doc.text(data.title, 15, 45);
      
      // Content based on type
      let yPos = 60;
      
      if (type === 'entry') {
        // Entry report content
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        
        doc.text(`Proceso #${data.processId}`, 15, yPos);
        yPos += 10;
        doc.text(`Fecha: ${data.date}`, 15, yPos);
        yPos += 15;
        
        doc.setFont('helvetica', 'bold');
        doc.text('Información del Producto:', 15, yPos);
        yPos += 10;
        doc.setFont('helvetica', 'normal');
        doc.text(`Nombre: ${data.product.name}`, 20, yPos);
        yPos += 7;
        doc.text(`Peso: ${data.product.weight}`, 20, yPos);
        yPos += 7;
        doc.text(`Dimensiones: ${data.product.dimensions}`, 20, yPos);
        yPos += 15;
        
        if (data.transport) {
          doc.setFont('helvetica', 'bold');
          doc.text('Información de Transporte:', 15, yPos);
          yPos += 10;
          doc.setFont('helvetica', 'normal');
          doc.text(`Conductor: ${data.transport.driver}`, 20, yPos);
          yPos += 7;
          doc.text(`Vehículo: ${data.transport.vehicle}`, 20, yPos);
          yPos += 15;
        }
        
        if (data.event3Status) {
          doc.setFont('helvetica', 'bold');
          doc.text(`Estado: ${data.event3Status === 'confirmed' ? 'Confirmado' : 'Con Queja'}`, 15, yPos);
          if (data.complaintNotes) {
            yPos += 10;
            doc.text('Notas de Queja:', 15, yPos);
            yPos += 7;
            doc.setFont('helvetica', 'normal');
            const notes = doc.splitTextToSize(data.complaintNotes, 170);
            doc.text(notes, 20, yPos);
          }
        }
        
      } else if (type === 'transport-invoice') {
        // Transport invoice content
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        
        doc.text(`Factura #${data.invoiceNumber}`, 15, yPos);
        yPos += 7;
        doc.text(`Fecha: ${data.date}`, 15, yPos);
        yPos += 7;
        doc.text(`Vencimiento: ${data.dueDate}`, 15, yPos);
        yPos += 15;
        
        // Billing company
        doc.setFont('helvetica', 'bold');
        doc.text('Empresa de Transporte:', 15, yPos);
        yPos += 7;
        doc.setFont('helvetica', 'normal');
        doc.text(data.billingCompany.name, 20, yPos);
        yPos += 5;
        doc.text(`RUT: ${data.billingCompany.rut}`, 20, yPos);
        yPos += 5;
        doc.text(data.billingCompany.address, 20, yPos);
        yPos += 15;
        
        // Service details
        doc.setFont('helvetica', 'bold');
        doc.text('Detalles del Servicio:', 15, yPos);
        yPos += 7;
        doc.setFont('helvetica', 'normal');
        doc.text(`Producto: ${data.serviceDetails.product}`, 20, yPos);
        yPos += 5;
        doc.text(`Peso: ${data.serviceDetails.weight}`, 20, yPos);
        yPos += 5;
        doc.text(`Conductor: ${data.serviceDetails.driver}`, 20, yPos);
        yPos += 5;
        doc.text(`Vehículo: ${data.serviceDetails.vehicle}`, 20, yPos);
        yPos += 15;
        
        // Billing
        doc.setFont('helvetica', 'bold');
        doc.text('Facturación:', 15, yPos);
        yPos += 7;
        doc.setFont('helvetica', 'normal');
        doc.text(`Subtotal: $${data.billing.subtotal.toLocaleString()}`, 20, yPos);
        yPos += 5;
        doc.text(`IVA (19%): $${data.billing.tax.toLocaleString()}`, 20, yPos);
        yPos += 5;
        doc.setFont('helvetica', 'bold');
        doc.text(`Total: $${data.billing.total.toLocaleString()}`, 20, yPos);
      }
      
      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('LogisticsFlow - Sistema de Gestión Logística', 15, 280);
      doc.text(`Generado el ${new Date().toLocaleString('es-ES')}`, 15, 285);
      
      // Save PDF
      const fileName = type === 'entry' ? `entrada-${processId}.pdf` : `factura-transporte-${processId}.pdf`;
      doc.save(fileName);
      
      toast({
        title: "PDF Generado",
        description: `El documento ${fileName} se ha descargado correctamente.`,
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el PDF. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };
}