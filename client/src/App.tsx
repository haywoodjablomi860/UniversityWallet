import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Send from "@/pages/send";
import Withdraw from "@/pages/Withdraw";           // New import for Withdraw page
import AllTransactions from "@/pages/all-transactions";
import TransactionNetwork from "@/pages/TransactionNetwork";
import AdminFunds from "@/pages/AdminFunds";
import { SidebarNav } from "./components/sidebar-nav";
import { MobileNav } from "./components/mobile-nav";

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <div className="hidden md:block w-64 flex-shrink-0">
        <SidebarNav />
      </div>
      <main className="flex-1 overflow-auto pb-[4.5rem] md:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/">
        <ProtectedLayout>
          <Dashboard />
        </ProtectedLayout>
      </ProtectedRoute>
      <ProtectedRoute path="/send">
        <ProtectedLayout>
          <Send />
        </ProtectedLayout>
      </ProtectedRoute>
      <ProtectedRoute path="/withdraw">
        <ProtectedLayout>
          <Withdraw />
        </ProtectedLayout>
      </ProtectedRoute>
      <ProtectedRoute path="/all-transactions">
        <ProtectedLayout>
          <AllTransactions />
        </ProtectedLayout>
      </ProtectedRoute>
      <ProtectedRoute path="/transaction-network">
        <ProtectedLayout>
          <TransactionNetwork />
        </ProtectedLayout>
      </ProtectedRoute>
      <ProtectedRoute path="/admin">
        <ProtectedLayout>
          <AdminFunds />
        </ProtectedLayout>
      </ProtectedRoute>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
