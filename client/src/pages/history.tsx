import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, FileText, Download, Calendar, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProcessWithDetails } from "@shared/schema";

export default function History() {
  const { data: processHistory, isLoading } = useQuery<ProcessWithDetails[]>({
    queryKey: ["/api/pdfs/history"],
  });

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: "Completado", variant: "default" as const, className: "bg-green-100 text-green-800" },
      in_progress: { label: "En Progreso", variant: "secondary" as const, className: "bg-blue-100 text-blue-800" },
      paused: { label: "Pausado", variant: "outline" as const, className: "bg-yellow-100 text-yellow-800" },
      complaint: { label: "Queja", variant: "destructive" as const, className: "bg-red-100 text-red-800" },
      draft: { label: "Borrador", variant: "secondary" as const, className: "bg-gray-100 text-gray-800" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const regeneratePdf = async (processId: number, pdfType: string) => {
    const reportType = pdfType === 'salida_producto' ? 'warehouse' : 
                      pdfType === 'factura' ? 'invoice' : 'transport';
    
    try {
      const response = await fetch(`/api/processes/${processId}/reports/${reportType}`);
      if (!response.ok) throw new Error('Failed to generate report');
      const reportData = await response.json();
      
      // Dynamically import jsPDF
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Add logo
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
      const fileName = pdfType === 'salida_producto' ? 'warehouse' : 
                      pdfType === 'factura' ? 'invoice' : 'transport';
      doc.save(`${fileName}-proceso-${processId}.pdf`);
      
    } catch (error) {
      console.error('Error regenerating PDF:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">Cargando historial...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" data-testid="button-back">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Historial de Procesos</h1>
                <p className="text-sm text-gray-600">Procesos completados con PDFs generados</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {!processHistory || processHistory.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay procesos en el historial</h3>
              <p className="text-gray-600 mb-4">
                Los procesos con PDFs generados aparecerán aquí una vez completados.
              </p>
              <Link href="/">
                <Button data-testid="button-create-process">
                  Crear Primer Proceso
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="text-sm text-gray-600">
              {processHistory.length} proceso{processHistory.length !== 1 ? 's' : ''} en el historial
            </div>
            
            {processHistory.map((process) => (
              <Card key={process.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        Proceso #{process.id} - {process.product.name}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(process.createdAt)}
                        </span>
                        <span className="uppercase font-medium text-blue-600">
                          {process.processType}
                        </span>
                        {getStatusBadge(process.status)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Process Details */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Información del Producto</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Peso: {process.product.weight / 1000} kg</div>
                          <div>
                            Dimensiones: {process.product.dimensions.length}×{process.product.dimensions.width}×{process.product.dimensions.height} cm
                          </div>
                          {Object.entries(process.product.regulations).some(([_, value]) => value) && (
                            <div>
                              Regulaciones: {Object.entries(process.product.regulations)
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
                                }).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {process.transport && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Transporte</h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Conductor: {process.transport.driverName}</div>
                            <div>Vehículo: {process.transport.vehicleType} - {process.transport.vehiclePlate}</div>
                          </div>
                        </div>
                      )}
                      
                      {process.delivery && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Entrega</h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Origen: {process.delivery.originPlace}</div>
                            <div>Destino: {process.delivery.destinationPlace}</div>
                            <div>Fecha: {formatDate(process.delivery.departureTime)}</div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* PDFs Generated */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">PDFs Generados</h4>
                      {process.pdfs && process.pdfs.length > 0 ? (
                        <div className="space-y-2">
                          {process.pdfs.map((pdf) => (
                            <div key={pdf.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-red-500" />
                                <div>
                                  <div className="font-medium text-sm">{pdf.fileName}</div>
                                  <div className="text-xs text-gray-500">
                                    {formatDate(pdf.generatedAt)}
                                  </div>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => regeneratePdf(process.id, pdf.pdfType)}
                                data-testid={`button-download-${pdf.id}`}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Descargar
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic">
                          No hay PDFs generados para este proceso
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}