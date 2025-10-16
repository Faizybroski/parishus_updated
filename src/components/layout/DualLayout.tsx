import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navigation from "@/components/layout/Navigation";
import Layout from "@/components/layout/Layout";

export default function ConditionalWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  if (user) {
    return (
      <ProtectedRoute>
        <Navigation />
        {children}
      </ProtectedRoute>
    );
  }

  return <Layout>{children}</Layout>;
}
