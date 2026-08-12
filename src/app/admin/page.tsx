"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import Navigation from "@/components/Common/Navigation";
import {
  Users,
  BarChart3,
  Shield,
  Settings,
  FileText,
  HelpCircle,
  MessageSquare,
  Activity,
  LayoutDashboard,
  Mail,
  IdCard,
  X,
  CheckCircle,
  XCircle,
  Clock,
  type LucideIcon,
} from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  pharmacyName?: string;
  licenseNumber?: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface LicenseVerification {
  id: string;
  userId: string;
  licenseNumber: string;
  licenseType: string;
  issuingBody: string;
  verified: boolean;
  rejectionReason: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    pharmacyName: string | null;
  };
}

type Tab = "dashboard" | "users" | "messages" | "licenses";

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editRole, setEditRole] = useState("");
  const [roleUpdating, setRoleUpdating] = useState(false);

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [viewMessage, setViewMessage] = useState<ContactMessage | null>(null);

  const [verifications, setVerifications] = useState<LicenseVerification[]>([]);
  const [verificationsLoading, setVerificationsLoading] = useState(false);

  const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: Users },
    { id: "messages", label: "Contact Messages", icon: Mail },
    { id: "licenses", label: "License Verifications", icon: IdCard },
  ];

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    if (activeTab === "messages") fetchMessages();
    if (activeTab === "licenses") fetchVerifications();
  }, [activeTab]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setUsers(data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchMessages = async () => {
    setMessagesLoading(true);
    try {
      const res = await fetch("/api/admin/contact-messages");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setMessages(data.messages);
    } catch (err) {
      console.error(err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const fetchVerifications = async () => {
    setVerificationsLoading(true);
    try {
      const res = await fetch("/api/admin/license-verifications");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setVerifications(data.verifications);
    } catch (err) {
      console.error(err);
    } finally {
      setVerificationsLoading(false);
    }
  };

  const handleRoleUpdate = async () => {
    if (!editUser) return;
    setRoleUpdating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editUser.id, role: editRole }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setRoleUpdating(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch("/api/admin/contact-messages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerify = async (id: string, action: "approve" | "reject") => {
    try {
      await fetch("/api/admin/license-verifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      fetchVerifications();
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const adminFeatures = [
    {
      id: "analytics",
      title: "System Analytics",
      description: "View comprehensive system analytics and performance metrics.",
      icon: BarChart3,
      color: "bg-soft-aqua hover:bg-medical-teal",
      path: "/admin/analytics",
    },
    {
      id: "security",
      title: "Security Settings",
      description: "Configure security policies and access controls.",
      icon: Shield,
      color: "bg-secondary hover:opacity-90",
      path: "/admin/security",
    },
    {
      id: "settings",
      title: "System Settings",
      description: "Configure system-wide settings and preferences.",
      icon: Settings,
      color: "bg-tertiary hover:opacity-90",
      path: "/admin/settings",
    },
    {
      id: "logs",
      title: "Audit Logs",
      description: "Review system audit logs and activity history.",
      icon: FileText,
      color: "bg-orange-500 hover:bg-orange-600",
      path: "/admin/logs",
    },
    {
      id: "support",
      title: "Support Center",
      description: "Access support tools and help documentation.",
      icon: HelpCircle,
      color: "bg-indigo-500 hover:bg-medical-teal",
      path: "/admin/support",
    },
  ];

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-surface-dark dark:to-surface-container-high">
        <Navigation title="Admin Dashboard" userRole="admin" />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-on-surface mb-2">
              Admin Dashboard
            </h1>
            <p className="text-on-surface-variant">
              Welcome back, {user?.name || "Administrator"}. Manage your SafeMeds platform.
            </p>
          </motion.div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 border-b border-outline-variant/60 pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-surface-container-lowest dark:bg-surface-container text-error border-b-2 border-error"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-surface-container-lowest dark:bg-surface-container rounded-xl shadow-lg p-6 border border-error/30 dark:border-outline-variant/40">
                    <div className="flex items-center">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Users className="h-6 w-6 text-error" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-on-surface-variant">Total Users</p>
                        <p className="text-2xl font-bold text-on-surface">{users.length || "—"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface-container-lowest dark:bg-surface-container rounded-xl shadow-lg p-6 border border-primary-fixed dark:border-outline-variant/40">
                    <div className="flex items-center">
                      <div className="p-2 bg-primary-fixed/50 rounded-lg">
                        <MessageSquare className="h-6 w-6 text-medical-teal" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-on-surface-variant">Contact Messages</p>
                        <p className="text-2xl font-bold text-on-surface">{messages.length || "—"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface-container-lowest dark:bg-surface-container rounded-xl shadow-lg p-6 border border-secondary/30 dark:border-outline-variant/40">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <IdCard className="h-6 w-6 text-secondary" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-on-surface-variant">License Verifications</p>
                        <p className="text-2xl font-bold text-on-surface">{verifications.length || "—"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface-container-lowest dark:bg-surface-container rounded-xl shadow-lg p-6 border border-tertiary-fixed dark:border-outline-variant/40">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Activity className="h-6 w-6 text-tertiary" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-on-surface-variant">System Health</p>
                        <p className="text-2xl font-bold text-secondary">98%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin Info Card */}
                <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl shadow-lg p-6 mb-8 border border-error/30 dark:border-outline-variant/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-on-surface mb-2">
                        Admin Information
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-on-surface-variant">Admin:</span>
                          <span className="ml-2 font-medium">{user?.name || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-on-surface-variant">Email:</span>
                          <span className="ml-2 font-medium">{user?.email || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-on-surface-variant">Username:</span>
                          <span className="ml-2 font-medium">{user?.username || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-on-surface-variant">Role:</span>
                          <span className="ml-2 font-medium capitalize">{user?.role || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl mb-2"></div>
                      <div className="text-sm text-on-surface-variant">Admin Account</div>
                    </div>
                  </div>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {adminFeatures.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <motion.div
                        key={feature.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0 + index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        className="bg-surface-container-lowest dark:bg-surface-container rounded-xl shadow-lg p-6 border border-error/30 dark:border-outline-variant/40 hover:shadow-xl transition-all duration-300"
                      >
                        <div className="flex items-center mb-4">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <Icon className="h-6 w-6 text-error" />
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-on-surface mb-2">{feature.title}</h3>
                        <p className="text-on-surface-variant text-sm mb-4">{feature.description}</p>
                        <button
                          onClick={() => router.push(feature.path)}
                          className={`${feature.color} text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full`}
                        >
                          Access {feature.title}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Recent Activity */}
                <div className="mt-8 bg-surface-container-lowest dark:bg-surface-container rounded-2xl shadow-lg p-6 border border-error/30 dark:border-outline-variant/40">
                  <h3 className="text-xl font-semibold text-on-surface mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-surface dark:bg-surface-container-high/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-secondary rounded-full mr-3"></div>
                        <span className="text-sm text-on-surface-variant">New user registration: john.doe@example.com</span>
                      </div>
                      <span className="text-xs text-on-surface-variant">2 minutes ago</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-surface dark:bg-surface-container-high/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-soft-aqua rounded-full mr-3"></div>
                        <span className="text-sm text-on-surface-variant">Consultation completed: #CONS-2024-001</span>
                      </div>
                      <span className="text-xs text-on-surface-variant">15 minutes ago</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-surface dark:bg-surface-container-high/50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                        <span className="text-sm text-on-surface-variant">System backup completed successfully</span>
                      </div>
                      <span className="text-xs text-on-surface-variant">1 hour ago</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "users" && (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl shadow-lg border border-error/30 dark:border-outline-variant/40 overflow-hidden">
                  <div className="p-6 border-b border-outline-variant/60">
                    <h2 className="text-xl font-semibold text-on-surface">User Management</h2>
                    <p className="text-sm text-on-surface-variant mt-1">Manage all users and their roles</p>
                  </div>
                  {usersLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-4 border-error border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-surface dark:bg-surface-container-high/50">
                            <th className="text-left px-6 py-3 font-medium text-on-surface-variant">Name</th>
                            <th className="text-left px-6 py-3 font-medium text-on-surface-variant">Email</th>
                            <th className="text-left px-6 py-3 font-medium text-on-surface-variant">Role</th>
                            <th className="text-left px-6 py-3 font-medium text-on-surface-variant">Verified</th>
                            <th className="text-left px-6 py-3 font-medium text-on-surface-variant">Created</th>
                            <th className="text-right px-6 py-3 font-medium text-on-surface-variant">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/60 dark:divide-outline-variant/40">
                          {users.map((u) => (
                            <tr key={u.id} className="hover:bg-surface-container-high/30">
                              <td className="px-6 py-4 text-on-surface">
                                {u.firstName} {u.lastName}
                              </td>
                              <td className="px-6 py-4 text-on-surface-variant">{u.email}</td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  u.role === "ADMIN"
                                    ? "bg-error-container text-on-error-container dark:bg-error-container dark:text-on-error-container"
                                    : u.role === "PHARMACY"
                                    ? "bg-tertiary-fixed text-on-tertiary-fixed dark:bg-purple-900/30 dark:text-purple-300"
                                    : "bg-primary-fixed text-on-primary-fixed dark:bg-primary-container dark:text-on-primary-container"
                                }`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {u.isVerified ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-error" />
                                )}
                              </td>
                              <td className="px-6 py-4 text-on-surface-variant text-xs">
                                {formatDate(u.createdAt)}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => {
                                    setEditUser(u);
                                    setEditRole(u.role);
                                  }}
                                  className="px-3 py-1.5 text-xs font-medium text-medical-teal hover:text-secondary bg-primary-fixed/30 dark:bg-blue-900/30 hover:bg-primary-fixed/60 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                          {users.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-6 py-12 text-center text-outline">
                                No users found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "messages" && (
              <motion.div
                key="messages"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl shadow-lg border border-error/30 dark:border-outline-variant/40 overflow-hidden">
                  <div className="p-6 border-b border-outline-variant/60">
                    <h2 className="text-xl font-semibold text-on-surface">Contact Messages</h2>
                    <p className="text-sm text-on-surface-variant mt-1">Messages from the contact form</p>
                  </div>
                  {messagesLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-4 border-error border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-surface dark:bg-surface-container-high/50">
                            <th className="text-left px-6 py-3 font-medium text-on-surface-variant">Name</th>
                            <th className="text-left px-6 py-3 font-medium text-on-surface-variant">Email</th>
                            <th className="text-left px-6 py-3 font-medium text-on-surface-variant">Subject</th>
                            <th className="text-left px-6 py-3 font-medium text-on-surface-variant">Date</th>
                            <th className="text-right px-6 py-3 font-medium text-on-surface-variant">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/60 dark:divide-outline-variant/40">
                          {messages.map((msg) => (
                            <tr
                              key={msg.id}
                              className={`hover:bg-surface-container-high/30 ${
                                !msg.read ? "bg-primary-fixed/30/50 dark:bg-blue-900/10 font-medium" : ""
                              }`}
                            >
                              <td className="px-6 py-4 text-on-surface">{msg.name}</td>
                              <td className="px-6 py-4 text-on-surface-variant">{msg.email}</td>
                              <td className="px-6 py-4 text-on-surface-variant max-w-[200px] truncate">
                                {msg.subject}
                              </td>
                              <td className="px-6 py-4 text-on-surface-variant text-xs whitespace-nowrap">
                                {formatDate(msg.createdAt)}
                              </td>
                              <td className="px-6 py-4 text-right space-x-2">
                                <button
                                  onClick={() => {
                                    setViewMessage(msg);
                                    if (!msg.read) handleMarkRead(msg.id);
                                  }}
                                  className="px-3 py-1.5 text-xs font-medium text-medical-teal hover:text-secondary bg-primary-fixed/30 dark:bg-blue-900/30 hover:bg-primary-fixed/60 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                          {messages.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-outline">
                                No messages yet
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "licenses" && (
              <motion.div
                key="licenses"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl shadow-lg border border-error/30 dark:border-outline-variant/40 overflow-hidden">
                  <div className="p-6 border-b border-outline-variant/60">
                    <h2 className="text-xl font-semibold text-on-surface">License Verifications</h2>
                    <p className="text-sm text-on-surface-variant mt-1">Approve or reject pharmacist license verifications</p>
                  </div>
                  {verificationsLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-4 border-error border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-surface dark:bg-surface-container-high/50">
                            <th className="text-left px-6 py-3 font-medium text-on-surface-variant">Pharmacist</th>
                            <th className="text-left px-6 py-3 font-medium text-on-surface-variant">License #</th>
                            <th className="text-left px-6 py-3 font-medium text-on-surface-variant">Type</th>
                            <th className="text-left px-6 py-3 font-medium text-on-surface-variant">Issuing Body</th>
                            <th className="text-left px-6 py-3 font-medium text-on-surface-variant">Status</th>
                            <th className="text-left px-6 py-3 font-medium text-on-surface-variant">Date</th>
                            <th className="text-right px-6 py-3 font-medium text-on-surface-variant">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/60 dark:divide-outline-variant/40">
                          {verifications.map((v) => {
                            const isPending = !v.verified && !v.rejectionReason;
                            const isRejected = !v.verified && v.rejectionReason;
                            const isVerified = v.verified;
                            return (
                              <tr key={v.id} className="hover:bg-surface-container-high/30">
                                <td className="px-6 py-4 text-on-surface">
                                  {v.user.firstName} {v.user.lastName}
                                  {v.user.pharmacyName && (
                                    <span className="block text-xs text-outline">{v.user.pharmacyName}</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-on-surface-variant font-mono text-xs">{v.licenseNumber}</td>
                                <td className="px-6 py-4 text-on-surface-variant">{v.licenseType}</td>
                                <td className="px-6 py-4 text-on-surface-variant">{v.issuingBody}</td>
                                <td className="px-6 py-4">
                                  {isPending && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                                      <Clock className="h-3 w-3" /> Pending
                                    </span>
                                  )}
                                  {isRejected && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-container text-on-error-container dark:bg-error-container dark:text-on-error-container">
                                      <XCircle className="h-3 w-3" /> Rejected
                                    </span>
                                  )}
                                  {isVerified && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-container text-on-secondary-container dark:bg-secondary-container dark:text-on-secondary-container">
                                      <CheckCircle className="h-3 w-3" /> Verified
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-on-surface-variant text-xs whitespace-nowrap">
                                  {formatDate(v.createdAt)}
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                  {isPending && (
                                    <>
                                      <button
                                        onClick={() => handleVerify(v.id, "approve")}
                                        className="px-3 py-1.5 text-xs font-medium text-secondary bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-lg transition-colors"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => handleVerify(v.id, "reject")}
                                        className="px-3 py-1.5 text-xs font-medium text-error bg-error-container/60 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}
                                  {!isPending && (
                                    <span className="text-xs text-outline italic">
                                      {isVerified ? "Approved" : "Rejected"}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          {verifications.length === 0 && (
                            <tr>
                              <td colSpan={7} className="px-6 py-12 text-center text-outline">
                                No verification requests yet
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Edit Role Modal */}
        {editUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl shadow-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-on-surface">
                  Edit User Role
                </h3>
                <button
                  onClick={() => setEditUser(null)}
                  className="p-1 text-outline hover:text-on-surface-variant dark:hover:text-on-surface"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-on-surface-variant mb-4">
                Changing role for <strong>{editUser.firstName} {editUser.lastName}</strong> ({editUser.email})
              </p>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="w-full px-4 py-3 border border-outline-variant rounded-lg bg-surface-container-lowest dark:bg-surface-container-high text-on-surface focus:ring-2 focus:ring-soft-aqua focus:border-transparent outline-none mb-4"
              >
                <option value="CLIENT">Client</option>
                <option value="PHARMACY">Pharmacy</option>
                <option value="ADMIN">Admin</option>
              </select>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditUser(null)}
                  className="flex-1 py-2.5 border border-outline-variant text-on-surface-variant rounded-lg font-medium hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRoleUpdate}
                  disabled={roleUpdating}
                  className="flex-1 py-2.5 bg-medical-teal hover:bg-secondary disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  {roleUpdating ? "Updating..." : "Save"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* View Message Modal */}
        {viewMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl shadow-2xl p-6 w-full max-w-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-on-surface">
                  Message from {viewMessage.name}
                </h3>
                <button
                  onClick={() => setViewMessage(null)}
                  className="p-1 text-outline hover:text-on-surface-variant dark:hover:text-on-surface"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="text-sm text-on-surface-variant mb-4 space-y-1">
                <p><strong className="text-on-surface-variant">Email:</strong> {viewMessage.email}</p>
                <p><strong className="text-on-surface-variant">Subject:</strong> {viewMessage.subject}</p>
                <p><strong className="text-on-surface-variant">Date:</strong> {formatDate(viewMessage.createdAt)}</p>
              </div>
              <div className="bg-surface dark:bg-surface-container-high/50 rounded-lg p-4 mb-4">
                <p className="text-sm text-on-surface-variant whitespace-pre-wrap">{viewMessage.message}</p>
              </div>
              <button
                onClick={() => setViewMessage(null)}
                className="w-full py-2.5 bg-medical-teal hover:bg-secondary text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
