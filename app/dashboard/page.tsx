"use client";

import AppShell from "../components/AppShell";
import DashboardContent from "../components/DashboardContent";
import ProtectedRoute from "../components/ProtectedRoute";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <AppShell activePath="/dashboard">
        <DashboardContent />
      </AppShell>
    </ProtectedRoute>
  );
}

