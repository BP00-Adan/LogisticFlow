import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Settings, 
  Upload,
  FileText,
  ArrowDown,
  ArrowUp,
  Eye,
  Play
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import type { DashboardStats } from "@/lib/types";
import type { ProcessWithDetails } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
  });

  const { data: activeProcesses, isLoading: processesLoading } = useQuery<ProcessWithDetails[]>({
    queryKey: ["/api/processes/active"],
  });

  const { data: allProcesses, isLoading: allProcessesLoading } = useQuery<ProcessWithDetails[]>({
    queryKey: ["/api/processes"],
  });

  const resumeProcessMutation = useMutation({
    mutationFn: (processId: number) => 
      apiRequest("POST", `/api/processes/${processId}/resume`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/processes"] });
    },
  });

  const handleStartFlow = (flowType: "entrada" | "salida") => {
    setLocation(`/event1/${flowType}`);
  };

  const handleResumeProcess = (process: ProcessWithDetails) => {
    if (process.status === "paused") {
      resumeProcessMutation.mutate(process.id);
    }
    
    const nextEvent = process.currentEvent;
    if (nextEvent === 1) {
      setLocation(`/event1`);
    } else if (nextEvent === 2) {
      setLocation(`/event2/${process.id}`);
    } else if (nextEvent === 3) {
      // Direct to appropriate event 3 based on flow type
      if (process.processType === "entrada") {
        setLocation(`/event3-entrada?processId=${process.id}`);
      } else {
        setLocation(`/event3/${process.id}`);
      }
    } else if (nextEvent === 4) {
      setLocation(`/event4/${process.id}`);
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-600";
      case "complaint":
        return "bg-red-100 text-red-600";
      case "in_progress":
        return "bg-yellow-100 text-yellow-600";
      case "paused":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getEventName = (event: number, processType?: string) => {
    if (processType === "entrada") {
      const events = {
        1: "Registro",
        2: "Transporte", 
        3: "Confirmación"
      };
      return events[event as keyof typeof events] || "Desconocido";
    } else {
      const events = {
        1: "Registro",
        2: "Transporte", 
        3: "Entrega",
        4: "Reportes"
      };
      return events[event as keyof typeof events] || "Desconocido";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white card-shadow sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-200 transition-all">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">LogiFlow</h1>
                <p className="text-sm text-gray-500">Sistema de Gestión Logística</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button className="btn-logistics-primary">
                <FileText className="h-4 w-4" />
                Reportes
              </Button>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                <Settings className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="card-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Productos Registrados</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? "..." : stats?.totalProducts || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">En Transporte</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {statsLoading ? "..." : stats?.inTransit || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Truck className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Entregados</p>
                  <p className="text-2xl font-bold text-green-600">
                    {statsLoading ? "..." : stats?.delivered || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Procesos Activos</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {statsLoading ? "..." : stats?.activeProcesses || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Settings className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Process Flow Navigator */}
        <Card className="card-shadow mb-8">
          <CardHeader>
            <CardTitle>Iniciar Nuevo Proceso</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
                onClick={() => handleStartFlow("entrada")}
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowDown className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Entrada a Bodega</h3>
                <p className="text-gray-500">Registrar productos que ingresan al almacén</p>
                <p className="text-sm text-gray-400 mt-2">Eventos: 1 → 2 → 3</p>
              </div>

              <div 
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
                onClick={() => handleStartFlow("salida")}
              >
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowUp className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Salida de Bodega</h3>
                <p className="text-gray-500">Gestionar envío y entrega de productos</p>
                <p className="text-sm text-gray-400 mt-2">Eventos: 1 → 2 → 3 → 4</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Processes */}
        <Card className="card-shadow mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Procesos Activos</CardTitle>
              <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
                Ver todos
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {processesLoading ? (
              <div className="text-center py-8">Cargando procesos activos...</div>
            ) : !activeProcesses?.length ? (
              <div className="text-center py-8 text-gray-500">
                No hay procesos activos en este momento
              </div>
            ) : (
              <div className="space-y-4">
                {activeProcesses.map((process) => (
                  <div key={process.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-[--logistics-warning-light] rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-[--logistics-warning]" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{process.product.name}</p>
                          <p className="text-sm text-gray-500">Proceso #{process.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Evento Actual</p>
                          <p className="text-sm font-medium text-yellow-600">
                            {getEventName(process.currentEvent, process.processType)}
                          </p>
                        </div>
                        <Button 
                          className="btn-logistics-outline"
                          onClick={() => handleResumeProcess(process)}
                          disabled={resumeProcessMutation.isPending}
                        >
                          {process.status === "paused" ? (
                            <>
                              <Play className="h-4 w-4" />
                              Reanudar
                            </>
                          ) : (
                            "Continuar"
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Badge className={getStatusColor(process.status)}>
                          {process.processType === "entrada" ? "Entrada" : "Salida"}
                        </Badge>
                        <span>•</span>
                        <span>Iniciado: {formatDate(process.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Records */}
        <Card className="card-shadow">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Registros Recientes</CardTitle>
              <Button variant="ghost" className="text-[--logistics-primary] hover:text-[--logistics-primary]/80">
                Ver todos
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {allProcessesLoading ? (
              <div className="text-center py-8">Cargando registros...</div>
            ) : !allProcesses?.length ? (
              <div className="text-center py-8 text-gray-500">
                No hay registros disponibles
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Producto</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Tipo</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Estado</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Fecha</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-sm">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allProcesses.slice(0, 5).map((process) => (
                      <tr key={process.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">{process.product.name}</td>
                        <td className="py-3 px-4">
                          <Badge className={process.processType === "entrada" 
                            ? "bg-[--logistics-secondary-light] text-[--logistics-secondary]"
                            : "bg-[--logistics-warning-light] text-[--logistics-warning]"
                          }>
                            {process.processType === "entrada" ? "Entrada" : "Salida"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(process.status)}>
                            {process.status === "completed" ? "Completado" : 
                             process.status === "complaint" ? "Con Queja" :
                             process.status === "in_progress" ? "En Progreso" :
                             process.status === "paused" ? "Pausado" : "Borrador"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-sm">
                          {formatDate(process.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-[--logistics-primary] hover:text-[--logistics-primary]/80"
                          >
                            <Eye className="h-4 w-4" />
                            Ver
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
