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
        setLocation(`/event3-entrada/${process.id}`);
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
      {/* Header - Mobile Optimized */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Upload className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">LogiFlow</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Sistema de Gestión Logística</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button size="sm" className="hidden sm:flex bg-blue-600 hover:bg-blue-700">
                <FileText className="h-4 w-4" />
                <span className="hidden md:inline ml-2">Reportes</span>
              </Button>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                <Settings className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-6">
        {/* Quick Stats - Mobile Optimized */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Productos</p>
                  <p className="text-xl font-bold text-gray-900">
                    {statsLoading ? "..." : stats?.totalProducts || 0}
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">En Tránsito</p>
                  <p className="text-xl font-bold text-yellow-600">
                    {statsLoading ? "..." : stats?.inTransit || 0}
                  </p>
                </div>
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Truck className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Completados</p>
                  <p className="text-xl font-bold text-green-600">
                    {statsLoading ? "..." : stats?.delivered || 0}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Activos</p>
                  <p className="text-xl font-bold text-blue-600">
                    {statsLoading ? "..." : stats?.activeProcesses || 0}
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Settings className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Process Flow Navigator - Mobile Optimized */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Iniciar Nuevo Proceso</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-500 hover:bg-green-50 transition-all cursor-pointer active:scale-95"
                onClick={() => handleStartFlow("entrada")}
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ArrowDown className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Entrada</h3>
                <p className="text-sm text-gray-500 mb-2">Productos que ingresan</p>
                <p className="text-xs text-gray-400">3 eventos</p>
              </div>

              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-yellow-500 hover:bg-yellow-50 transition-all cursor-pointer active:scale-95"
                onClick={() => handleStartFlow("salida")}
              >
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ArrowUp className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Salida</h3>
                <p className="text-sm text-gray-500 mb-2">Envío y entrega</p>
                <p className="text-xs text-gray-400">4 eventos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Processes - Mobile Optimized */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Procesos Activos</CardTitle>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 text-sm">
                Ver todos
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {processesLoading ? (
              <div className="text-center py-8">Cargando procesos activos...</div>
            ) : !activeProcesses?.length ? (
              <div className="text-center py-8 text-gray-500">
                No hay procesos activos en este momento
              </div>
            ) : (
              <div className="space-y-3">
                {activeProcesses.map((process) => (
                  <div key={process.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">{process.product.name}</p>
                          <p className="text-xs text-gray-500">#{process.id}</p>
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleResumeProcess(process)}
                        disabled={resumeProcessMutation.isPending}
                        className="flex-shrink-0"
                      >
                        {process.status === "paused" ? (
                          <Play className="h-3 w-3" />
                        ) : (
                          "Ver"
                        )}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <Badge className={process.processType === "entrada" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                          {process.processType === "entrada" ? "Entrada" : "Salida"}
                        </Badge>
                        <span className="text-gray-500">
                          {getEventName(process.currentEvent, process.processType)}
                        </span>
                      </div>
                      <Badge className={getStatusColor(process.status)}>
                        {process.status === "completed" ? "OK" : 
                         process.status === "complaint" ? "Queja" :
                         process.status === "in_progress" ? "Activo" :
                         process.status === "paused" ? "Pausado" : "Draft"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Records - Mobile Optimized */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Historial</CardTitle>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 text-sm">
                Ver más
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {allProcessesLoading ? (
              <div className="text-center py-8 text-gray-500">Cargando...</div>
            ) : !allProcesses?.length ? (
              <div className="text-center py-8 text-gray-500">
                No hay registros disponibles
              </div>
            ) : (
              <div className="space-y-3">
                {allProcesses.slice(0, 3).map((process) => (
                  <div key={process.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 truncate flex-1 mr-2">
                        {process.product.name}
                      </h4>
                      <Button variant="ghost" size="sm" className="flex-shrink-0 p-1 h-auto">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <Badge className={process.processType === "entrada" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                          {process.processType === "entrada" ? "Entrada" : "Salida"}
                        </Badge>
                        <span className="text-gray-500">#{process.id}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(process.status)}>
                          {process.status === "completed" ? "OK" : 
                           process.status === "complaint" ? "Queja" :
                           process.status === "in_progress" ? "Activo" :
                           process.status === "paused" ? "Pausado" : "Draft"}
                        </Badge>
                        <span className="text-gray-400">
                          {new Date(process.createdAt).toLocaleDateString("es-ES", { 
                            day: "2-digit", 
                            month: "2-digit" 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
