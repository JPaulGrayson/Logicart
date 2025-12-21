import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdapterProvider } from "@/contexts/AdapterContext";
import NotFound from "@/pages/not-found";
import Workbench from "@/pages/Workbench";
import TestMiniMap from "@/pages/TestMiniMap";
import EmbedDemo from "@/pages/EmbedDemo";
import RemoteMode from "@/pages/RemoteMode";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Workbench} />
      <Route path="/test" component={TestMiniMap} />
      <Route path="/embed-demo" component={EmbedDemo} />
      <Route path="/remote" component={RemoteMode} />
      <Route path="/remote/:sessionId" component={RemoteMode} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AdapterProvider>
          <Toaster />
          <Router />
        </AdapterProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
