import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  flowType: "entrada" | "salida";
}

export function ProgressBar({ currentStep, totalSteps, flowType }: ProgressBarProps) {
  const maxSteps = flowType === "entrada" ? 2 : 4;
  const steps = Array.from({ length: maxSteps }, (_, i) => i + 1);

  const getStepStatus = (step: number) => {
    if (step < currentStep) return "completed";
    if (step === currentStep) return "active";
    return "pending";
  };

  const stepLabels = {
    1: { title: "Registro de Productos", description: "Información básica del producto" },
    2: { title: "Información de Transporte", description: "Datos del conductor y vehículo" },
    3: { title: "Entrega del Producto", description: "Registro de entrega" },
    4: { title: "Reportes y Cierre", description: "Generación de documentos" },
  };

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const status = getStepStatus(step);
        const isLast = index === steps.length - 1;

        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium",
                  status === "completed" && "step-completed",
                  status === "active" && "step-active",
                  status === "pending" && "step-pending"
                )}
              >
                {status === "completed" ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step
                )}
              </div>
              <div className="ml-4 hidden md:block">
                <p className="text-sm font-medium text-gray-900">
                  {stepLabels[step as keyof typeof stepLabels]?.title}
                </p>
                <p className="text-xs text-gray-500">
                  {stepLabels[step as keyof typeof stepLabels]?.description}
                </p>
              </div>
            </div>
            {!isLast && (
              <div className={cn(
                "w-16 h-px ml-4",
                status === "completed" ? "bg-[--logistics-secondary]" : "bg-gray-300"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
