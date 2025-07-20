import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProcessHeaderProps {
  title: string;
  onClose: () => void;
}

export function ProcessHeader({ title, onClose }: ProcessHeaderProps) {
  return (
    <div className="bg-white rounded-xl card-shadow p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
