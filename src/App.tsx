import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { SystemProvider } from "@/contexts/SystemContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

// Lazy loading de páginas pesadas
const Monitoring = lazy(() => import("./pages/Monitoring"));
const Processes = lazy(() => import("./pages/Processes"));
const Startup = lazy(() => import("./pages/Startup"));
const Admin = lazy(() => import("./pages/Admin"));
const Users = lazy(() => import("./pages/Users"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Optimization = lazy(() => import("./pages/Optimization"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <SystemProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <HashRouter>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Index />}>
                  <Route index element={<Dashboard />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="monitoring" element={<Monitoring />} />
                  <Route path="processes" element={<Processes />} />
                  <Route path="startup" element={<Startup />} />
                  <Route path="optimization" element={<Optimization />} />
                  <Route path="settings" element={<Settings />} />
                  <Route 
                    path="admin" 
                    element={
                      <ProtectedRoute requireFounder>
                        <Admin />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="users" 
                    element={
                      <ProtectedRoute requireFounder>
                        <Users />
                      </ProtectedRoute>
                    } 
                  />
                </Route>
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </HashRouter>
        </TooltipProvider>
      </SystemProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
