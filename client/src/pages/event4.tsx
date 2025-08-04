import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { FileText, Download, Check, Truck, Receipt } from "lucide-react";
import { ProcessHeader } from "@/components/process-header";
import { ProgressBar } from "@/components/progress-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ProcessWithDetails } from "@shared/schema";

export default function Event4() {
  const [, setLocation] = useLocation();
  const { processId } = useParams<{ processId: string }>();
  const { toast } = useToast();

  const { data: process, isLoading } = useQuery<ProcessWithDetails>({
    queryKey: ["/api/processes", processId],
  });

  const completeProcessMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/processes/${processId}/complete`),
    onSuccess: () => {
      toast({
        title: "Proceso completado",
        description: "El proceso ha sido completado exitosamente.",
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo completar el proceso. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: async (reportType: string) => {
      const response = await fetch(`/api/processes/${processId}/reports/${reportType}`);
      if (!response.ok) throw new Error('Failed to generate report');
      return response.json();
    },
    onSuccess: async (reportData, reportType) => {
      // Dynamically import jsPDF to avoid SSR issues
      const { jsPDF } = await import('jspdf');
      
      // Create new PDF document
      const doc = new jsPDF();
      
      // Convertir logo a base64 para incluirlo en el PDF
      let logoDataUrl = '';
      try {
        const logoResponse = await fetch('/assets/logo.png');
        if (logoResponse.ok) {
          const logoBlob = await logoResponse.blob();
          logoDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(logoBlob);
          });
        }
      } catch (error) {
        console.log('No se pudo cargar el logo:', error);
      }
      
      // Add logo if available
      if (logoDataUrl) {
        try {
          // Usar dimensiones mejoradas para el logo
          doc.addImage(logoDataUrl, 'PNG', 15, 10, 40, 20);
        } catch (error) {
          console.log('Error adding logo to PDF:', error);
        }
      }
      
      // Add header
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(reportData.title, logoDataUrl ? 65 : 20, 25);
      
      // Add basic info
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Proceso #${reportData.processId}`, 20, 45);
      doc.text(`Tipo: ${reportData.processType}`, 20, 55);
      doc.text(`Fecha: ${reportData.date}`, 20, 65);
      
      let yPos = 85;
      
      // Add product information
      doc.setFont("helvetica", "bold");
      doc.text("PRODUCTO:", 20, yPos);
      yPos += 10;
      doc.setFont("helvetica", "normal");
      doc.text(`Nombre: ${reportData.product.name || 'N/A'}`, 25, yPos);
      yPos += 8;
      doc.text(`Peso: ${reportData.product.weight || 'N/A'}`, 25, yPos);
      yPos += 8;
      doc.text(`Dimensiones: ${reportData.product.dimensions || 'N/A'}`, 25, yPos);
      yPos += 8;
      
      // Add special regulations
      if (reportData.product.regulations && reportData.product.regulations.length > 0) {
        doc.text(`Regulaciones especiales: ${reportData.product.regulations.join(', ')}`, 25, yPos);
        yPos += 8;
      }
      yPos += 7;
      
      // Add transport info 
      doc.setFont("helvetica", "bold");
      doc.text("TRANSPORTE:", 20, yPos);
      yPos += 10;
      doc.setFont("helvetica", "normal");
      if (reportData.transport && !reportData.transport.error) {
        doc.text(`Conductor: ${reportData.transport.driver || 'N/A'}`, 25, yPos);
        yPos += 8;
        doc.text(`Licencia: ${reportData.transport.license || 'N/A'}`, 25, yPos);
        yPos += 8;
        doc.text(`Vehículo: ${reportData.transport.vehicle || 'N/A'}`, 25, yPos);
        yPos += 8;
        if (reportData.transport.notes) {
          doc.text(`Notas: ${reportData.transport.notes}`, 25, yPos);
          yPos += 8;
        }
      } else {
        doc.text('Información de transporte no disponible', 25, yPos);
        yPos += 8;
      }
      yPos += 7;
      
      // Add delivery info 
      doc.setFont("helvetica", "bold");
      doc.text("ENTREGA:", 20, yPos);
      yPos += 10;
      doc.setFont("helvetica", "normal");
      if (reportData.delivery && !reportData.delivery.error) {
        doc.text(`Origen: ${reportData.delivery.origin || 'N/A'}`, 25, yPos);
        yPos += 8;
        doc.text(`Destino: ${reportData.delivery.destination || 'N/A'}`, 25, yPos);
        yPos += 8;
        doc.text(`Salida: ${reportData.delivery.departureTime || 'N/A'}`, 25, yPos);
        yPos += 8;
        if (reportData.delivery.notes) {
          doc.text(`Notas: ${reportData.delivery.notes}`, 25, yPos);
          yPos += 8;
        }
      } else {
        doc.text('Información de entrega no disponible', 25, yPos);
        yPos += 8;
      }
      yPos += 7;
      
      // Add invoice details if it's an invoice report
      if (reportData.services) {
        doc.setFont("helvetica", "bold");
        doc.text("SERVICIOS:", 20, yPos);
        yPos += 10;
        doc.setFont("helvetica", "normal");
        
        reportData.services.forEach((service: any) => {
          doc.text(`${service.description}: $${service.total.toLocaleString()}`, 25, yPos);
          yPos += 8;
        });
        
        yPos += 10;
        doc.setFont("helvetica", "bold");
        doc.text(`SUBTOTAL: $${reportData.totals.subtotal.toLocaleString()}`, 25, yPos);
        yPos += 8;
        doc.text(`IVA (19%): $${reportData.totals.iva.toLocaleString()}`, 25, yPos);
        yPos += 8;
        doc.text(`TOTAL: $${reportData.totals.total.toLocaleString()}`, 25, yPos);
      }
      
      // Add footer
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text(`Generado el ${new Date().toLocaleString("es-ES")}`, 20, 280);
      
      // Save the PDF
      doc.save(`${reportType}-proceso-${processId}.pdf`);
      
      // Save PDF to history
      try {
        await apiRequest("POST", "/api/pdfs", {
          processId: parseInt(processId!),
          pdfType: reportType === 'warehouse' ? 'salida_producto' : 'factura',
          fileName: `${reportType}-proceso-${processId}.pdf`
        });
      } catch (error) {
        console.log('Error saving PDF to history:', error);
      }
      
      toast({
        title: "Reporte descargado",
        description: `El reporte de ${reportType} se ha descargado exitosamente.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo generar el reporte. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const handleCompleteProcess = () => {
    completeProcessMutation.mutate();
  };

  const handleGenerateReport = (reportType: string) => {
    generateReportMutation.mutate(reportType);
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
          title="Evento 4: Reportes y Cierre"
          onClose={() => setLocation("/")}
        />

        <Card className="card-shadow">
          <CardContent className="p-6">
            <ProgressBar 
              currentStep={4} 
              totalSteps={4} 
              flowType={process.processType}
            />
          </CardContent>
        </Card>

        {/* Process Summary */}
        <Card className="card-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Resumen del Proceso</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-[--logistics-secondary] rounded-full"></div>
                <Badge className="bg-[--logistics-secondary-light] text-[--logistics-secondary]">
                  Proceso Completado
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Producto</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="text-gray-500">Nombre:</span> <span>{process.product.name}</span></div>
                  <div><span className="text-gray-500">Peso:</span> <span>{process.product.weight / 1000} kg</span></div>
                  <div>
                    <span className="text-gray-500">Dimensiones:</span> 
                    <span> {process.product.dimensions.length}x{process.product.dimensions.width}x{process.product.dimensions.height} cm</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Tipo:</span> 
                    <span> {process.processType === "entrada" ? "Entrada de Bodega" : "Salida de Bodega"}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Transporte</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="text-gray-500">Conductor:</span> <span>{process.transport?.driverName || "N/A"}</span></div>
                  <div>
                    <span className="text-gray-500">Vehículo:</span> 
                    <span> {process.transport?.vehicleType || "N/A"} - {process.transport?.vehiclePlate || "N/A"}</span>
                  </div>
                  <div><span className="text-gray-500">Licencia:</span> <span>{process.transport?.licenseNumber || "N/A"}</span></div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Entrega</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="text-gray-500">Origen:</span> <span>{process.delivery?.originPlace || "N/A"}</span></div>
                  <div><span className="text-gray-500">Destino:</span> <span>{process.delivery?.destinationPlace || "N/A"}</span></div>
                  <div><span className="text-gray-500">Salida:</span> <span>{process.delivery?.departureTime ? formatDate(process.delivery.departureTime) : "N/A"}</span></div>
                  <div><span className="text-gray-500">Completado:</span> <span>{formatDate(new Date())}</span></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Generation */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Generar Reportes</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="border border-gray-200 rounded-lg p-6 text-center hover:bg-gray-50 transition-all">
                <div className="w-16 h-16 bg-[--logistics-primary-light] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-[--logistics-primary]" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Reporte de Bodega</h4>
                <p className="text-sm text-gray-500 mb-4">Documento de entrada/salida de productos</p>
                <Button 
                  className="btn-logistics-outline w-full"
                  onClick={() => handleGenerateReport("warehouse")}
                  disabled={generateReportMutation.isPending}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar PDF
                </Button>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-6 text-center hover:bg-gray-50 transition-all">
                <div className="w-16 h-16 bg-[--logistics-warning-light] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-8 w-8 text-[--logistics-warning]" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Reporte de Transporte</h4>
                <p className="text-sm text-gray-500 mb-4">Información detallada del envío</p>
                <Button 
                  className="btn-logistics-outline w-full"
                  onClick={() => handleGenerateReport("transport")}
                  disabled={generateReportMutation.isPending}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar PDF
                </Button>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-6 text-center hover:bg-gray-50 transition-all">
                <div className="w-16 h-16 bg-[--logistics-secondary-light] rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Receipt className="h-8 w-8 text-[--logistics-secondary]" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Factura</h4>
                <p className="text-sm text-gray-500 mb-4">Documento para el cliente receptor</p>
                <Button 
                  className="btn-logistics-outline w-full"
                  onClick={() => handleGenerateReport("invoice")}
                  disabled={generateReportMutation.isPending}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar PDF
                </Button>
              </div>
            </div>

            {/* Process Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button variant="outline">
                Guardar en Registros
              </Button>
              <Button 
                className="btn-logistics-primary"
                onClick={handleCompleteProcess}
                disabled={completeProcessMutation.isPending}
              >
                {completeProcessMutation.isPending ? "Finalizando..." : "Finalizar Proceso"}
                <Check className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
