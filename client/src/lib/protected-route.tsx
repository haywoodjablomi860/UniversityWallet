import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route } from "wouter";

type ProtectedRouteProps = {
  path: string;
  children: React.ReactNode;
};

export function ProtectedRoute({ path, children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      ) : !user ? (
        window.location.href = "/auth"
      ) : (
        children
      )}
    </Route>
  );
}