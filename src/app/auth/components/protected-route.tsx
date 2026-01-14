"use client";

import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getClientToken, invokeFunction, setClientToken } from "@/services/api";

function SessionSkeleton() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="h-20 border-b border-[#E2E8F8] bg-[#FCFDFF] animate-pulse" />
      <div className="flex flex-1">
        <div className="hidden lg:block w-64 border-r border-[#E2E8F8] bg-[#F7F9FF] animate-pulse" />
        <div className="flex-1 p-8 space-y-6">
          <div className="h-10 w-48 rounded-md bg-[#ECF0FD] animate-pulse" />
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="h-32 rounded-xl border border-[#E2E8F8] bg-[#FDFDFE] animate-pulse" />
            <div className="h-32 rounded-xl border border-[#E2E8F8] bg-[#FDFDFE] animate-pulse" />
          </div>
          <div className="h-[360px] rounded-2xl border border-[#E2E8F8] bg-[#FDFDFE] animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function ProtectedRoute() {
  const [status, setStatus] = React.useState<"checking" | "authorized" | "unauthorized">(
    "checking",
  );

  React.useEffect(() => {
    let active = true;

    async function validateSession() {
      const token = getClientToken();
      if (!token) {
        if (active) setStatus("unauthorized");
        return;
      }

      try {
        await invokeFunction("admin-me", { method: "GET" });
        if (active) setStatus("authorized");
      } catch (error) {
        console.warn("Protegido: sessao invalida ou expirada.", error);
        setClientToken(null);
        if (active) setStatus("unauthorized");
      }
    }

    validateSession();

    return () => {
      active = false;
    };
  }, []);

  if (status === "checking") {
    return <SessionSkeleton />;
  }

  if (status === "unauthorized") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
