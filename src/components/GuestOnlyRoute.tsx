import { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useApp } from "@/context/AppContext";

type GuestOnlyRouteProps = {
  children: ReactNode;
};

const GuestOnlyRoute = ({ children }: GuestOnlyRouteProps) => {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Memuat...
      </div>
    );
  }

  if (!user) return <>{children}</>;

  const targetPath = user.role === "admin" ? "/admin" : "/app";
  return <Navigate to={targetPath} replace />;
};

export default GuestOnlyRoute;
