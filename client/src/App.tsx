import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Navigation } from "@/components/navigation";
import { BottomNav } from "@/components/bottom-nav";
import Home from "@/pages/home";
import Workouts from "@/pages/workouts";
import WorkoutDetail from "@/pages/workout-detail";
import Clients from "@/pages/clients";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/workouts" component={Workouts} />
      <Route path="/workout/:id" component={WorkoutDetail} />
      <Route path="/clients" component={Clients} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 transition-all duration-500">
            <Navigation />
            <main className="pb-20 md:pb-6">
              <Router />
            </main>
            <BottomNav />
            <Toaster />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
