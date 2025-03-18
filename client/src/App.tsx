import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { ErrorProvider } from "@/hooks/useErrors";
import { FeedbackProvider } from "@/hooks/useFeedback";
import ErrorDashboard from "@/components/debug/ErrorDashboard";

function Router() {
  return (
    <Switch>
      {/* Add pages below */}
      <Route path="/" component={Home} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorProvider>
        <FeedbackProvider>
          <Router />
          <ErrorDashboard />
          <Toaster />
        </FeedbackProvider>
      </ErrorProvider>
    </QueryClientProvider>
  );
}

export default App;
