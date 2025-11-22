/**
 * Extension entry point for Replit
 * This file is used when Cartographer runs as a Replit Extension
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { AdapterProvider } from "@/contexts/AdapterContext";
import { ReplitAdapter } from "@/lib/adapters/ReplitAdapter";
import Workbench from "@/pages/Workbench";
import "./index.css";

// Create Replit adapter
const replitAdapter = new ReplitAdapter();

function ExtensionApp() {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AdapterProvider adapter={replitAdapter}>
            <Toaster />
            <Switch>
              <Route path="/" component={Workbench} />
            </Switch>
          </AdapterProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<ExtensionApp />);
}
