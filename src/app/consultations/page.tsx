"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import Navigation from "@/components/Common/Navigation";
import { getConsultations, Consultation, ConsultationFilters } from "@/services/consultationService";

export default function ConsultationsPage() {
  const router = useRouter();
  useAuth(); // keep auth/redirect side-effect
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ConsultationFilters>({
    status: "",
    type: "",
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        setLoading(true);
        const response = await getConsultations(filters);
        setConsultations(response.consultations);
        setPagination(response.pagination);
      } catch (error) {
        console.error("Error fetching consultations:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConsultations();
  }, [filters]);

  const handleFilterChange = (key: keyof ConsultationFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-primary-fixed text-on-primary-fixed";
      case "COMPLETED":
        return "bg-secondary-container text-on-secondary-container";
      case "CANCELLED":
        return "bg-error-container text-on-error-container";
      default:
        return "bg-surface-container-low text-on-surface";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "general":
        return "";
      case "mental health":
        return "";
      case "pain relief":
        return "";
      case "pregnancy":
        return "";
      case "sexual health":
        return "️";
      default:
        return "";
    }
  };

  return (
    <ProtectedRoute allowedRoles={["PHARMACY", "ADMIN"]}>
      <div className="min-h-screen bg-gradient-to-br from-tertiary-fixed/30 to-tertiary-fixed/50 dark:from-surface-dark dark:to-surface-container-high">
        <Navigation title="Patient Consultations" userRole="pharmacy" />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-on-surface mb-2">
              Patient Consultations
            </h1>
            <p className="text-on-surface-variant">
              Manage and respond to patient health inquiries and consultations
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="bg-surface-container-lowest dark:bg-surface-container rounded-xl shadow-lg p-6 mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest dark:bg-surface-container-high text-on-surface rounded-lg focus:ring-2 focus:ring-soft-aqua focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-2">
                  Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange("type", e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest dark:bg-surface-container-high text-on-surface rounded-lg focus:ring-2 focus:ring-soft-aqua focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="general">General</option>
                  <option value="mental health">Mental Health</option>
                  <option value="pain relief">Pain Relief</option>
                  <option value="pregnancy">Pregnancy</option>
                  <option value="sexual health">Sexual Health</option>
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
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Consultations List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="bg-surface-container-lowest dark:bg-surface-container rounded-xl shadow-lg overflow-hidden"
          >
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tertiary mx-auto"></div>
                <p className="mt-4 text-on-surface-variant">Loading consultations...</p>
              </div>
            ) : consultations.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-4"></div>
                <h3 className="text-lg font-semibold text-on-surface mb-2">
                  No consultations found
                </h3>
                <p className="text-on-surface-variant">
                  {filters.status || filters.type
                    ? "Try adjusting your filters"
                    : "No consultations have been submitted yet"}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-outline-variant/60 dark:divide-outline-variant/40">
                    <thead className="bg-surface dark:bg-surface-container-high/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                          Patient
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                          Assigned To
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                          Messages
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-surface-container-lowest dark:bg-surface-container divide-y divide-outline-variant/60 dark:divide-outline-variant/40">
                      {consultations.map((consultation) => (
                        <motion.tr
                          key={consultation.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          whileHover={{ backgroundColor: "#f9fafb" }}
                          className="hover:bg-surface-container-high/50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                  <span className="text-sm font-medium text-tertiary">
                                    {consultation.isAnonymous
                                      ? "A"
                                      : consultation.user
                                      ? `${consultation.user.firstName[0]}${consultation.user.lastName[0]}`
                                      : "U"}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-on-surface dark:text-on-surface">
                                  {consultation.isAnonymous
                                    ? "Anonymous Patient"
                                    : consultation.user
                                    ? `${consultation.user.firstName} ${consultation.user.lastName}`
                                    : "Unknown"}
                                </div>
                                <div className="text-sm text-on-surface-variant">
                                  {consultation.isAnonymous
                                    ? `ID: ${consultation.anonymousId}`
                                    : consultation.user?.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-2xl mr-2">
                                {getTypeIcon(consultation.type)}
                              </span>
                              <span className="text-sm text-on-surface dark:text-on-surface capitalize">
                                {consultation.type}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(consultation.status)}`}>
                              {consultation.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface dark:text-on-surface">
                            {consultation.assignedPharmacist
                              ? `${consultation.assignedPharmacist.firstName} ${consultation.assignedPharmacist.lastName}`
                              : "Unassigned"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface dark:text-on-surface">
                            {consultation._count?.messages || 0} messages
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface-variant">
                            {new Date(consultation.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => router.push(`/chat/${consultation.id}`)}
                              className="text-tertiary hover:text-purple-900 mr-4"
                            >
                              View Chat
                            </button>
                            <button
                              onClick={() => router.push(`/consultations/${consultation.id}`)}
                              className="text-medical-teal hover:text-primary"
                            >
                              Details
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="bg-surface-container-lowest px-4 py-3 flex items-center justify-between border-t border-outline-variant/60 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-outline-variant text-sm font-medium rounded-md text-on-surface-variant bg-surface-container-lowest hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-outline-variant text-sm font-medium rounded-md text-on-surface-variant bg-surface-container-lowest hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
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
                                  ? "z-10 bg-tertiary-fixed/40 border-tertiary text-tertiary"
                                  : "bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface"
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </main>
      </div>
    </ProtectedRoute>
  );
} 