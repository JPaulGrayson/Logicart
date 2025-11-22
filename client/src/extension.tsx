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
import { StandaloneAdapter } from "@/lib/adapters/StandaloneAdapter";
import type { IDEAdapter } from "@/lib/adapters/types";
import Workbench from "@/pages/Workbench";
import "./index.css";

// Detect environment and create appropriate adapter
function createAdapter(): IDEAdapter | undefined {
  // Check if Replit Extension API is available
  if (typeof window !== 'undefined' && (window as any).replit) {
    console.log('Replit Extension API detected - using ReplitAdapter');
    return new ReplitAdapter();
  }
  
  // Fall back to standalone mode with sample code
  console.log('No Extension API - using StandaloneAdapter');
  return undefined; // Let AdapterProvider use its default StandaloneAdapter
}

const adapter = createAdapter();

function ExtensionApp() {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AdapterProvider adapter={adapter}>
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
