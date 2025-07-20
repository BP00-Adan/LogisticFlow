import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { ProcessHeader } from "@/components/process-header";
import { ProgressBar } from "@/components/progress-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ProductFormData, FlowType } from "@/lib/types";

const productSchema = z.object({
  name: z.string().min(1, "El nombre del producto es requerido"),
  dimensions: z.object({
    length: z.number().min(1, "El largo debe ser mayor a 0"),
    width: z.number().min(1, "El ancho debe ser mayor a 0"),
    height: z.number().min(1, "El alto debe ser mayor a 0"),
  }),
  weight: z.number().min(1, "El peso debe ser mayor a 0"),
  regulations: z.object({
    fragile: z.boolean(),
    lithium: z.boolean(),
    hazardous: z.boolean(),
    refrigerated: z.boolean(),
    valuable: z.boolean(),
    oversized: z.boolean(),
  }),
  flowType: z.enum(["entrada", "salida"]),
});

export default function Event1() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [flowType, setFlowType] = useState<FlowType>("salida");

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      dimensions: {
        length: 0,
        width: 0,
        height: 0,
      },
      weight: 0,
      regulations: {
        fragile: false,
        lithium: false,
        hazardous: false,
        refrigerated: false,
        valuable: false,
        oversized: false,
      },
      flowType: "salida",
    },
  });

  const createProcessMutation = useMutation({
    mutationFn: (data: ProductFormData) => 
      apiRequest("POST", "/api/processes", data),
    onSuccess: async (response) => {
      const process = await response.json();
      toast({
        title: "Producto registrado",
        description: "El producto ha sido registrado exitosamente.",
      });
      setLocation(`/event2/${process.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo registrar el producto. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    createProcessMutation.mutate(data);
  };

  const handleFlowTypeChange = (value: FlowType) => {
    setFlowType(value);
    form.setValue("flowType", value);
  };

  const watchedValues = form.watch();

  const getSummaryDimensions = () => {
    const { length, width, height } = watchedValues.dimensions;
    if (length && width && height) {
      return `${length} x ${width} x ${height} cm`;
    }
    return "- x - x - cm";
  };

  const getSelectedRegulations = () => {
    const regulations = watchedValues.regulations;
    const selected = Object.entries(regulations)
      .filter(([_, value]) => value)
      .map(([key, _]) => {
        const labels = {
          fragile: "Frágil",
          lithium: "Contiene Litio",
          hazardous: "Material Peligroso",
          refrigerated: "Refrigerado",
          valuable: "Alto Valor",
          oversized: "Sobredimensionado",
        };
        return labels[key as keyof typeof labels];
      });

    return selected.length > 0 ? selected : ["Ninguna seleccionada"];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <ProcessHeader 
          title="Evento 1: Registro de Productos"
          onClose={() => setLocation("/")}
        />

        <Card className="card-shadow">
          <CardContent className="p-6">
            <ProgressBar 
              currentStep={1} 
              totalSteps={4} 
              flowType={flowType}
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle>Información del Producto</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre del Producto</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Ej: Electrónicos Samsung Galaxy" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="flowType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Flujo</FormLabel>
                            <Select 
                              onValueChange={(value: FlowType) => {
                                field.onChange(value);
                                handleFlowTypeChange(value);
                              }} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="entrada">Entrada a Bodega</SelectItem>
                                <SelectItem value="salida">Salida de Bodega</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="dimensions.length"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Largo (cm)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="50" 
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dimensions.width"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ancho (cm)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="30" 
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dimensions.height"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Alto (cm)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="20" 
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
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Peso (kg)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.1" 
                              placeholder="5.5" 
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <FormLabel className="text-base font-medium mb-4">Regulaciones Especiales</FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                        {[
                          { key: "fragile", label: "Frágil" },
                          { key: "lithium", label: "Contiene Litio" },
                          { key: "hazardous", label: "Material Peligroso" },
                          { key: "refrigerated", label: "Refrigerado" },
                          { key: "valuable", label: "Alto Valor" },
                          { key: "oversized", label: "Sobredimensionado" },
                        ].map(({ key, label }) => (
                          <FormField
                            key={key}
                            control={form.control}
                            name={`regulations.${key}` as any}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="text-sm font-normal cursor-pointer">
                                    {label}
                                  </FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-6">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setLocation("/")}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver al Dashboard
                      </Button>
                      <Button 
                        type="submit" 
                        className="btn-logistics-primary"
                        disabled={createProcessMutation.isPending}
                      >
                        {createProcessMutation.isPending ? "Procesando..." : "Continuar a Evento 2"}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Product Summary */}
          <div>
            <Card className="card-shadow sticky top-24">
              <CardHeader>
                <CardTitle className="text-base">Resumen del Producto</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nombre:</span>
                    <span className="font-medium">{watchedValues.name || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Dimensiones:</span>
                    <span className="font-medium">{getSummaryDimensions()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Peso:</span>
                    <span className="font-medium">{watchedValues.weight || "-"} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Flujo:</span>
                    <span className="font-medium">
                      {watchedValues.flowType === "entrada" ? "Entrada" : "Salida"}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <span className="text-gray-500">Regulaciones:</span>
                    <div className="mt-2 space-y-1">
                      {getSelectedRegulations().map((reg, index) => (
                        <div key={index} className="text-xs text-gray-600">{reg}</div>
                      ))}
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
