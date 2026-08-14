"use client";

import { Suspense } from "react";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import PharmacyShell from "@/components/pharmacy/PharmacyShell";
import AddInventoryForm from "@/components/pharmacy/AddInventoryForm";

export default function AddInventoryPage() {
  return (
    <ProtectedRoute allowedRoles={["PHARMACY", "ADMIN"]}>
      <PharmacyShell active="inventory" pageTitle="Add Stock">
        {/* useSearchParams needs a Suspense boundary above it. */}
        <Suspense fallback={<div className="p-8 text-sm text-on-surface-variant">Loading…</div>}>
          <AddInventoryForm />
        </Suspense>
      </PharmacyShell>
    </ProtectedRoute>
  );
}
