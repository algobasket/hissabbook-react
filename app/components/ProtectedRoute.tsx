"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, canAccessApp, getUserRole, isAdmin } from "../utils/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push(redirectTo);
      return;
    }

    // Check if user is admin - admin should use admin panel
    if (isAdmin()) {
      // Redirect admin to admin panel
      const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "/admin";
      window.location.href = adminUrl;
      return;
    }

    // Check role-based access
    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = getUserRole();
      if (!userRole || !allowedRoles.includes(userRole)) {
        router.push("/unauthorized");
        return;
      }
    }

    // Check if user can access the app (not admin)
    if (!canAccessApp()) {
      router.push(redirectTo);
      return;
    }

    setIsAuthorized(true);
    setIsLoading(false);
  }, [router, allowedRoles, redirectTo]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#2f4bff] border-r-transparent"></div>
          <p className="mt-4 text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}







