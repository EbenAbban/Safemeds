"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/lib/currency";
import {
  AlertTriangle,
  Edit,
  Package,
  Plus,
  ShoppingCart,
  Truck,
  X,
} from "lucide-react";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import PharmacyShell from "@/components/pharmacy/PharmacyShell";
import { Badge, Button, Card, Input } from "@/components/ui";

interface InventoryMedication {
  id: string;
  name: string;
  genericName: string | null;
  dosageForm: string;
  strength: string;
  manufacturer: string;
  price: string;
  isPrescription: boolean;
  isControlled: boolean;
}

interface InventoryRow {
  id: string;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  lotNumber: string | null;
  expirationDate: string | null;
  location: string | null;
  medication: InventoryMedication;
}

interface InventoryResponse {
  inventoryItems: InventoryRow[];
  pagination: { page: number; limit: number; total: number; pages: number };
  statistics: { totalItems: number; totalQuantity: number | null; lowStockItems: number; expiringItems: number };
}

interface MedicationOption {
  id: string;
  name: string;
  strength: string;
  dosageForm: string;
}

function stockStatus(item: InventoryRow): { label: string; tone: "success" | "danger" | "neutral"; ratio: number } {
  if (item.quantity <= 0) return { label: "Out of Stock", tone: "neutral", ratio: 0 };
  if (item.quantity <= item.minQuantity) return { label: "Low Stock", tone: "danger", ratio: item.quantity / Math.max(item.maxQuantity, 1) };
  return { label: "In Stock", tone: "success", ratio: item.quantity / Math.max(item.maxQuantity, 1) };
}

function AddMedicationModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<MedicationOption[]>([]);
  const [selected, setSelected] = useState<MedicationOption | null>(null);
  const [quantity, setQuantity] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!query.trim() || selected) {
      setOptions([]);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/medications?search=${encodeURIComponent(query)}&limit=8`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        setOptions(data.medications ?? []);
      } catch {
        // Aborted or transient — the next keystroke will retry.
      }
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, selected]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || !quantity) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicationId: selected.id,
          quantity: Number(quantity),
          lotNumber: lotNumber || undefined,
          expirationDate: expirationDate || undefined,
          location: location || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to add medication");
      onAdded();
      onClose();
    } catch {
      setError("Could not add this medication. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-navy/50 p-4">
      <Card radius="xl" className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-on-surface">Add New Medication</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-on-surface-variant hover:text-on-surface">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Input
              label="Medication"
              value={selected ? `${selected.name} ${selected.strength}` : query}
              onChange={(e) => {
                setSelected(null);
                setQuery(e.target.value);
              }}
              placeholder="Search existing medications…"
              autoComplete="off"
              required
            />
            {options.length > 0 && !selected && (
              <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-outline-variant/60 bg-surface-container-lowest shadow-card dark:bg-surface-container">
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelected(opt);
                      setQuery("");
                      setOptions([]);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-on-surface hover:bg-surface-container-high"
                  >
                    {opt.name} — {opt.strength} ({opt.dosageForm})
                  </button>
                ))}
              </div>
            )}
          </div>

          <Input label="Quantity" type="number" min={1} required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Lot number" value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} />
            <Input label="Expiration date" type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} />
          </div>
          <Input label="Storage location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Shelf B-4" />

          {error && <p className="text-sm text-error">{error}</p>}

          <Button type="submit" fullWidth disabled={!selected || !quantity || submitting}>
            {submitting ? "Adding…" : "Add to Inventory"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function InventoryPageContent() {
  const [data, setData] = useState<InventoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [page, setPage] = useState(1);

  const load = useMemo(
    () => async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: "10" });
        if (search) params.set("search", search);
        if (showLowStock) params.set("lowStock", "true");
        const res = await fetch(`/api/inventory?${params.toString()}`);
        if (res.ok) setData(await res.json());
      } finally {
        setLoading(false);
      }
    },
    [page, search, showLowStock]
  );

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-8 px-5 py-8 sm:px-8 lg:px-12">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-headline-lg text-on-surface">Inventory Management</h1>
          <p className="mt-2 text-on-surface-variant">Monitor and restock pharmacy supplies.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add New Medication
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
        <Card interactive>
          <div className="mb-4 flex items-start justify-between">
            <div className="rounded-lg bg-secondary-container/20 p-3 text-medical-teal dark:text-primary-fixed-dim">
              <Package className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
          <p className="text-on-surface-variant">Total Items</p>
          <h3 className="mt-1 text-headline-md text-on-surface">{data?.statistics.totalItems ?? "—"}</h3>
        </Card>

        <Card interactive className="relative overflow-hidden">
          <div className="mb-4 flex items-start justify-between">
            <div className="rounded-lg bg-error-container/50 p-3 text-error">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            {(data?.statistics.lowStockItems ?? 0) > 0 && (
              <Badge tone="danger">Action Needed</Badge>
            )}
          </div>
          <p className="text-on-surface-variant">Low Stock Alerts</p>
          <h3 className="mt-1 text-headline-md text-error">{data?.statistics.lowStockItems ?? "—"}</h3>
        </Card>

        <Card interactive>
          <div className="mb-4 flex items-start justify-between">
            <div className="rounded-lg bg-tertiary-fixed p-3 text-tertiary">
              <Truck className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
          <p className="text-on-surface-variant">Expiring Within 30 Days</p>
          <h3 className="mt-1 text-headline-md text-on-surface">{data?.statistics.expiringItems ?? "—"}</h3>
        </Card>
      </div>

      <Card padding="none" radius="xl" className="overflow-hidden">
        <div className="flex flex-col items-center justify-between gap-4 border-b border-outline-variant/60 bg-surface-bright p-4 sm:flex-row sm:p-6 dark:bg-surface-dark">
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setPage(1);
                setShowLowStock((v) => !v);
              }}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                showLowStock
                  ? "border-error bg-error-container text-on-error-container"
                  : "border-outline-variant text-on-surface hover:bg-surface-container"
              }`}
            >
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              Low Stock Only
            </button>
            <span className="hidden text-sm text-on-surface-variant sm:inline">
              {data ? `Showing ${data.inventoryItems.length} of ${data.pagination.total}` : ""}
            </span>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search medications…"
            className="w-full rounded-lg border-none bg-surface-container px-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-soft-aqua sm:w-72"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead>
              <tr className="border-b border-outline-variant/60 bg-surface-container/50">
                <th className="p-4 text-sm font-semibold text-on-surface-variant">Medication</th>
                <th className="p-4 text-sm font-semibold text-on-surface-variant">Manufacturer</th>
                <th className="p-4 text-sm font-semibold text-on-surface-variant">Stock Level</th>
                <th className="p-4 text-sm font-semibold text-on-surface-variant">Unit Price</th>
                <th className="p-4 text-sm font-semibold text-on-surface-variant">Status</th>
                <th className="p-4 text-right text-sm font-semibold text-on-surface-variant">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {loading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-on-surface-variant">
                    Loading inventory…
                  </td>
                </tr>
              )}
              {!loading && data?.inventoryItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-on-surface-variant">
                    No inventory items match this filter.
                  </td>
                </tr>
              )}
              {!loading &&
                data?.inventoryItems.map((item) => {
                  const status = stockStatus(item);
                  return (
                    <tr key={item.id} className="group transition-colors hover:bg-surface-container/30">
                      <td className="p-4">
                        <div className="font-semibold text-on-surface">{item.medication.name}</div>
                        <div className="text-sm text-on-surface-variant">
                          {item.medication.strength} {item.medication.dosageForm}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-on-surface-variant">{item.medication.manufacturer}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 flex-grow overflow-hidden rounded-full bg-surface-container-highest">
                            <div
                              className={`h-full rounded-full ${status.tone === "danger" ? "bg-error" : "bg-soft-aqua"}`}
                              style={{ width: `${Math.min(100, status.ratio * 100)}%` }}
                            />
                          </div>
                          <span className={`w-12 text-right text-sm font-semibold ${status.tone === "danger" ? "text-error" : "text-on-surface"}`}>
                            {item.quantity}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-on-surface">{formatCurrency(item.medication.price)}</td>
                      <td className="p-4">
                        <Badge tone={status.tone === "success" ? "success" : status.tone === "danger" ? "danger" : "neutral"}>
                          {status.label}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button className="rounded-md p-2 text-on-surface-variant hover:bg-surface-container hover:text-medical-teal" title="Edit details" type="button">
                            <Edit className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            className="rounded-md p-2 text-on-surface-variant hover:bg-surface-container hover:text-medical-teal"
                            title="Restock"
                            type="button"
                            onClick={() => setShowAddModal(true)}
                          >
                            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {data && data.pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-outline-variant/60 bg-surface-bright p-4 dark:bg-surface-dark">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-sm font-medium text-on-surface-variant transition-colors hover:text-medical-teal disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-on-surface-variant">
              Page {data.pagination.page} of {data.pagination.pages}
            </span>
            <button
              type="button"
              disabled={page >= data.pagination.pages}
              onClick={() => setPage((p) => p + 1)}
              className="text-sm font-medium text-medical-teal transition-colors hover:text-primary disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </Card>

      {showAddModal && (
        <AddMedicationModal onClose={() => setShowAddModal(false)} onAdded={load} />
      )}
    </div>
  );
}

export default function InventoryPage() {
  return (
    <ProtectedRoute allowedRoles={["PHARMACY", "ADMIN"]}>
      <PharmacyShell active="inventory" pageTitle="Pharmacy Inventory">
        <InventoryPageContent />
      </PharmacyShell>
    </ProtectedRoute>
  );
}
