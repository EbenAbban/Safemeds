"use client";

import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import PharmacyShell from "@/components/pharmacy/PharmacyShell";
import AddMedicationForm from "@/components/pharmacy/AddMedicationForm";

export default function AddMedicationPage() {
  return (
    <ProtectedRoute allowedRoles={["PHARMACY", "ADMIN"]}>
      <PharmacyShell active="medications" pageTitle="Add Medication">
        <AddMedicationForm />
      </PharmacyShell>
    </ProtectedRoute>
  );
}
