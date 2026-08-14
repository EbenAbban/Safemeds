"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import Navigation from "@/components/Common/Navigation";
import { getMedications, Medication } from "@/services/medicationService";
import { EmptyState, MedicationSkeleton } from "@/components/ui";
import { formatCurrency } from "@/lib/currency";
import { PillBottle } from "lucide-react";

export default function MedicationsPage() {
  const router = useRouter();
  useAuth(); // keep auth/redirect side-effect
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    isPrescription: "",
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    const fetchMedications = async () => {
      try {
        setLoading(true);
        const response = await getMedications(filters as unknown as Parameters<typeof getMedications>[0]);
        setMedications(response.medications);
        setPagination(response.pagination);
      } catch (error) {
        console.error("Error fetching medications:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMedications();
  }, [filters]);

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const getPrescriptionBadge = (isPrescription: boolean) => {
    return isPrescription ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-container text-on-error-container">
        Prescription Required
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-container text-on-secondary-container">
        Over the Counter
      </span>
    );
  };

  const getControlledBadge = (isControlled: boolean) => {
    return isControlled ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
        Controlled Substance
      </span>
    ) : null;
  };

  const getStockStatus = (
    inventoryItems: Array<{ quantity: number; minQuantity?: number }>
  ) => {
    if (!inventoryItems || inventoryItems.length === 0) {
      return {
        status: "out-of-stock",
        text: "Out of Stock",
        color: "text-error",
        bgColor: "bg-red-100",
      };
    }

    const totalQuantity = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
    const minQuantity = inventoryItems[0]?.minQuantity || 10;

    if (totalQuantity === 0) {
      return {
        status: "out-of-stock",
        text: "Out of Stock",
        color: "text-error",
        bgColor: "bg-red-100",
      };
    } else if (totalQuantity <= minQuantity) {
      return {
        status: "low-stock",
        text: "Low Stock",
        color: "text-orange-600",
        bgColor: "bg-orange-100",
      };
    } else {
      return {
        status: "in-stock",
        text: "In Stock",
        color: "text-secondary",
        bgColor: "bg-green-100",
      };
    }
  };

  return (
    <ProtectedRoute allowedRoles={["PHARMACY", "ADMIN"]}>
      <div className="min-h-screen bg-gradient-to-br from-primary-fixed/30 to-primary-fixed/50 dark:from-surface-dark dark:to-surface-container-high">
        <Navigation title="Medication Management" userRole="pharmacy" />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-on-surface mb-2">
                  Medication Management
                </h1>
                <p className="text-on-surface-variant">
                  Manage your pharmacy inventory and medication catalog
                </p>
              </div>
              <button
                onClick={() => router.push("/medications/add")}
                className="bg-secondary text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-colors"
              >
                Add Medication
              </button>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="bg-surface-container-lowest dark:bg-surface-container rounded-xl shadow-lg p-6 mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-2">
                  Search Medications
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  placeholder="Search by name, generic name..."
                  className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest dark:bg-surface-container-high text-on-surface rounded-lg focus:ring-2 focus:ring-soft-aqua focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange("category", e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest dark:bg-surface-container-high text-on-surface rounded-lg focus:ring-2 focus:ring-soft-aqua focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  <option value="antibiotics">Antibiotics</option>
                  <option value="pain-relief">Pain Relief</option>
                  <option value="mental-health">Mental Health</option>
                  <option value="contraceptives">Contraceptives</option>
                  <option value="vitamins">Vitamins & Supplements</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-2">
                  Type
                </label>
                <select
                  value={filters.isPrescription}
                  onChange={(e) => handleFilterChange("isPrescription", e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest dark:bg-surface-container-high text-on-surface rounded-lg focus:ring-2 focus:ring-soft-aqua focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="true">Prescription Only</option>
                  <option value="false">Over the Counter</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-2">
                  Items per page
                </label>
                <select
                  value={filters.limit}
                  onChange={(e) => handleFilterChange("limit", parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest dark:bg-surface-container-high text-on-surface rounded-lg focus:ring-2 focus:ring-soft-aqua focus:border-transparent"
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Medications Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {loading ? (
              <div className="col-span-full">
                <MedicationSkeleton items={6} />
              </div>
            ) : medications.length === 0 ? (
              <EmptyState
                className="col-span-full"
                icon={PillBottle}
                title="No medications found"
                description={
                  filters.search || filters.category || filters.isPrescription
                    ? "No medication matches these filters. Try clearing the search or category."
                    : "No medications have been added to the catalogue yet."
                }
                action={
                  // Only offer the add action when the catalogue is genuinely
                  // empty — suggesting "add a medication" to someone whose
                  // filter simply matched nothing is the wrong next step.
                  filters.search || filters.category || filters.isPrescription
                    ? undefined
                    : { label: "Add first medication", href: "/medications/add" }
                }
              />
            ) : (
              medications.map((medication) => {
                const stockStatus = getStockStatus(medication.inventoryItems ?? []);
                return (
                  <motion.div
                    key={medication.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    className="bg-surface-container-lowest dark:bg-surface-container rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-on-surface mb-1">
                          {medication.name}
                        </h3>
                        {medication.genericName && (
                          <p className="text-sm text-on-surface-variant mb-2">
                            Generic: {medication.genericName}
                          </p>
                        )}
                      </div>
                      <div className="text-2xl"></div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-on-surface-variant">
                        <span className="font-medium mr-2">Strength:</span>
                        {medication.strength}
                      </div>
                      <div className="flex items-center text-sm text-on-surface-variant">
                        <span className="font-medium mr-2">Form:</span>
                        {medication.dosageForm}
                      </div>
                      <div className="flex items-center text-sm text-on-surface-variant">
                        <span className="font-medium mr-2">Manufacturer:</span>
                        {medication.manufacturer}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {getPrescriptionBadge(medication.isPrescription)}
                      {getControlledBadge(medication.isControlled)}
                    </div>

                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.bgColor} ${stockStatus.color}`}>
                          {stockStatus.text}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-on-surface">
                        {formatCurrency(medication.price)}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/medications/${medication.id}`)}
                        className="flex-1 bg-medical-teal text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => router.push(`/inventory/add?medicationId=${medication.id}`)}
                        className="flex-1 bg-secondary text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-colors"
                      >
                        Add Stock
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>

          {/* Pagination */}
          {!loading && pagination.pages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              className="mt-8 bg-surface-container-lowest dark:bg-surface-container rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-on-surface-variant">
                    Showing{" "}
                    <span className="font-medium">
                      {(pagination.page - 1) * pagination.limit + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">{pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === pagination.page
                            ? "z-10 bg-green-50 border-green-500 text-secondary"
                            : "bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
} 