import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdapterProvider } from "@/contexts/AdapterContext";
import NotFound from "@/pages/not-found";
import Workbench from "@/pages/Workbench";
import TestMiniMap from "@/pages/TestMiniMap";
import EmbedDemo from "@/pages/EmbedDemo";
import RemoteMode from "@/pages/RemoteMode";
import ZeroClickDemo from "@/pages/ZeroClickDemo";
import ModelArena from "@/pages/ModelArena";
import { useLicense } from "@/hooks/useLicense";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Workbench} />
      <Route path="/arena" component={ModelArena} />
      <Route path="/test" component={TestMiniMap} />
      <Route path="/embed-demo" component={EmbedDemo} />
      <Route path="/remote" component={RemoteMode} />
      <Route path="/remote/:sessionId" component={RemoteMode} />
      <Route path="/zero-click-demo" component={ZeroClickDemo} />
      <Route component={NotFound} />
    </Switch>
  );
}

function TokenHandler() {
  const { setToken } = useLicense();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setToken(token);
      // Always clean the token from URL (valid or invalid)
      params.delete('token');
      const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      window.history.replaceState({}, '', newUrl);
    }
  }, [setToken]);

  return null;
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AdapterProvider>
            <TokenHandler />
            <Toaster />
            <Router />
          </AdapterProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
