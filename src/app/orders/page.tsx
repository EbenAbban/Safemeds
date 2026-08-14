"use client";

import { useState, useEffect, useCallback } from "react";
import { Banknote, ShoppingBag, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { EmptyState, TableSkeleton } from "@/components/ui";
import { useRouter } from "next/navigation";
import { SlideUp } from "@/components/animations";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import PharmacyShell from "@/components/pharmacy/PharmacyShell";

import { getOrders, Order } from "@/services/orderService";

export default function OrdersPage() {
  const router = useRouter();
  useAuth(); // keep auth/redirect side-effect
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    paymentStatus: "",
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [statistics, setStatistics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
  });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getOrders(filters);
      setOrders(response.orders);
      setPagination(response.pagination);
      setStatistics(response.statistics);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CONFIRMED":
        return "bg-primary-fixed text-on-primary-fixed";
      case "PROCESSING":
        return "bg-tertiary-fixed text-on-tertiary-fixed";
      case "READY_FOR_PICKUP":
        return "bg-secondary-container text-on-secondary-container";
      case "SHIPPED":
        return "bg-indigo-100 text-indigo-800";
      case "DELIVERED":
        return "bg-secondary-container text-on-secondary-container";
      case "CANCELLED":
        return "bg-error-container text-on-error-container";
      default:
        return "bg-surface-container-low text-on-surface";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "PAID":
        return "bg-secondary-container text-on-secondary-container";
      case "FAILED":
        return "bg-error-container text-on-error-container";
      case "REFUNDED":
        return "bg-surface-container-low text-on-surface";
      default:
        return "bg-surface-container-low text-on-surface";
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ProtectedRoute allowedRoles={["PHARMACY", "ADMIN"]}>
      <PharmacyShell active="deliveries" pageTitle="Deliveries">
      <div className="min-h-full">
        <main className="py-2">
          {/* Header */}
          <SlideUp className="mb-8">
            <h1 className="text-3xl font-bold text-on-surface mb-2">
              Order Management
            </h1>
            <p className="text-on-surface-variant">
              Process and track medication orders and deliveries
            </p>
          </SlideUp>

          {/* Statistics Cards */}
          <SlideUp className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-surface-container-lowest dark:bg-surface-container rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary-fixed/50 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="h-4 w-4 text-medical-teal" aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-on-surface-variant">Total Orders</p>
                  <p className="text-2xl font-bold text-on-surface">
                    {statistics.totalOrders}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest dark:bg-surface-container rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Banknote className="h-4 w-4 text-secondary" aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-on-surface-variant">Total Revenue</p>
                  <p className="text-2xl font-bold text-on-surface">
                    {formatCurrency(statistics.totalRevenue)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest dark:bg-surface-container rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-tertiary" aria-hidden="true" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-on-surface-variant">Average Order Value</p>
                  <p className="text-2xl font-bold text-on-surface">
                    {formatCurrency(statistics.averageOrderValue)}
                  </p>
                </div>
              </div>
            </div>
          </SlideUp>

          {/* Filters */}
          <SlideUp className="bg-surface-container-lowest dark:bg-surface-container rounded-xl shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-2">
                  Order Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest dark:bg-surface-container-high text-on-surface rounded-lg focus:ring-2 focus:ring-soft-aqua focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="READY_FOR_PICKUP">Ready for Pickup</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-2">
                  Payment Status
                </label>
                <select
                  value={filters.paymentStatus}
                  onChange={(e) => handleFilterChange("paymentStatus", e.target.value)}
                  className="w-full px-3 py-2 border border-outline-variant bg-surface-container-lowest dark:bg-surface-container-high text-on-surface rounded-lg focus:ring-2 focus:ring-soft-aqua focus:border-transparent"
                >
                  <option value="">All Payment Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="FAILED">Failed</option>
                  <option value="REFUNDED">Refunded</option>
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

              <div className="flex items-end">
                <button
                  onClick={fetchOrders}
                  className="w-full bg-medical-teal text-white px-4 py-2 rounded-lg font-medium hover:bg-secondary transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
          </SlideUp>

          {/* Orders Table */}
          <SlideUp className="bg-surface-container-lowest dark:bg-surface-container rounded-xl shadow-lg overflow-hidden">
            {loading ? (
              <div className="p-4">
                <TableSkeleton rows={filters.limit ?? 10} columns={5} />
              </div>
            ) : orders.length === 0 ? (
              <EmptyState
                className="border-0"
                icon={ShoppingBag}
                title="No orders found"
                description={
                  filters.status || filters.paymentStatus
                    ? "No order matches these filters. Try widening the status or payment filter."
                    : "No orders have been placed yet. New orders appear here as they arrive."
                }
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-outline-variant/60 dark:divide-outline-variant/40">
                    <thead className="bg-surface dark:bg-surface-container-high/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                          Order Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                          Patient
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                          Medication
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                          Payment
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
                      {orders.map((order) => (
                        // Hover stays in CSS. The previous Framer `whileHover`
                        // set a literal #f9fafb, which beat the class below and
                        // painted a near-white row in dark mode.
                        <tr
                          key={order.id}
                          className="transition-colors hover:bg-surface-container-high/50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-on-surface dark:text-on-surface">
                                {order.orderNumber}
                              </div>
                              <div className="text-sm text-on-surface-variant">
                                {order.isAnonymous ? "Anonymous Order" : "Regular Order"}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-on-surface dark:text-on-surface">
                                {order.isAnonymous
                                  ? "Anonymous Patient"
                                  : order.user
                                  ? `${order.user.firstName} ${order.user.lastName}`
                                  : "Unknown"}
                              </div>
                              <div className="text-sm text-on-surface-variant">
                                {order.isAnonymous
                                  ? `ID: ${order.anonymousId}`
                                  : order.user?.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {order.prescription?.medication ? (
                              <div>
                                <div className="text-sm font-medium text-on-surface dark:text-on-surface">
                                  {order.prescription.medication.name}
                                </div>
                                <div className="text-sm text-on-surface-variant">
                                  {order.prescription.medication.strength} - {order.prescription.medication.dosageForm}
                                </div>
                                <div className="text-sm text-on-surface-variant">
                                  Qty: {order.prescription.quantity}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-on-surface-variant">No prescription</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-on-surface dark:text-on-surface">
                              {formatCurrency(order.totalAmount)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                              {order.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                              {order.paymentStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface-variant">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => router.push(`/orders/${order.id}`)}
                              className="text-medical-teal hover:text-primary mr-4"
                            >
                              View Details
                            </button>
                            {order.delivery && (
                              <button
                                onClick={() => order.delivery && router.push(`/delivery/${order.delivery.id}`)}
                                className="text-secondary hover:text-green-900"
                              >
                                Track Delivery
                              </button>
                            )}
                          </td>
                        </tr>
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
                                  ? "z-10 bg-primary-fixed/30 border-soft-aqua text-medical-teal"
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
          </SlideUp>
        </main>
      </div>
      </PharmacyShell>
    </ProtectedRoute>
  );
} 