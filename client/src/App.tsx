import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Event1 from "@/pages/event1";
import Event2 from "@/pages/event2";
import Event3 from "@/pages/event3";
import Event4 from "@/pages/event4";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/event1" component={Event1} />
      <Route path="/event1/:flowType" component={Event1} />
      <Route path="/event2/:processId" component={Event2} />
      <Route path="/event3/:processId" component={Event3} />
      <Route path="/event4/:processId" component={Event4} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
