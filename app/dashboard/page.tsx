"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type PropertyStatus = "Available" | "Booked";

interface Property {
  id: string;
  name: string;
  pricePerNight: number;
  status: PropertyStatus;
  createdAt?: Date;
}

type SortKey = "name" | "pricePerNight" | "status" | "createdAt";

export default function DashboardPage() {
  const router = useRouter();
  const { currentUser, loading } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [fetching, setFetching] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStatus, setFormStatus] = useState<PropertyStatus>("Available");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !currentUser) {
      router.replace("/login");
    }
  }, [currentUser, loading, router]);

  // Fetch properties
  useEffect(() => {
    if (!currentUser) return;

    const fetchProperties = async () => {
      setFetching(true);
      setError(null);

      try {
        const snapshot = await getDocs(collection(db, "properties"));
        const docs = snapshot.docs.map((d) => {
          const data = d.data();
          const name = typeof data.name === "string" ? data.name.trim() : "Untitled";
          const priceRaw = Number(data.pricePerNight);
          const price = Number.isFinite(priceRaw) && priceRaw >= 0 ? priceRaw : 0;
          const statusRaw = data.status;
          const status: PropertyStatus = statusRaw === "Booked" ? "Booked" : "Available";
          const createdAt = data.createdAt?.toDate?.() ?? undefined;

          return {
            id: d.id,
            name,
            pricePerNight: price,
            status,
            createdAt,
          };
        });

        setProperties(docs);
        setLastUpdated(
          new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        );
      } catch (err) {
        console.error("Failed to fetch properties:", err);
        setError("Could not load properties. Please try again later.");
      } finally {
        setFetching(false);
      }
    };

    fetchProperties();
  }, [currentUser]);

  const filteredProperties = useMemo(() => {
    let filtered = properties.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered = [...filtered].sort((a, b) => {
      let valA: string | number | Date | undefined = a[sortBy];
      let valB: string | number | Date | undefined = b[sortBy];

      if (sortBy === "createdAt") {
        valA = a.createdAt?.getTime() ?? 0;
        valB = b.createdAt?.getTime() ?? 0;
      } else if (sortBy === "pricePerNight") {
        valA = a.pricePerNight;
        valB = b.pricePerNight;
      }

      if (valA === undefined) valA = "";
      if (valB === undefined) valB = "";

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [properties, searchQuery, sortBy, sortAsc]);

  const totalProperties = properties.length;
  const availableCount = useMemo(
    () => properties.filter((p) => p.status === "Available").length,
    [properties]
  );
  const bookedCount = useMemo(
    () => properties.filter((p) => p.status === "Booked").length,
    [properties]
  );

  // Mock chart data for occupancy trend
  const chartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => ({
      day: `Day ${i + 1}`,
      available: Math.round(Math.random() * totalProperties),
      booked: Math.round(Math.random() * totalProperties),
    }));
  }, [totalProperties]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormPrice("");
    setFormStatus("Available");
    setError(null);
    setEditId(null);
  };

  const handleAddOrEditProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError("Property name is required.");
      return;
    }

    const priceNum = Number(formPrice);
    if (!formPrice || !Number.isFinite(priceNum) || priceNum < 0) {
      setError("Please enter a valid non-negative price.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editId) {
        // Optimistic update
        setProperties((prev) =>
          prev.map((p) =>
            p.id === editId
              ? { ...p, name: formName.trim(), pricePerNight: priceNum, status: formStatus }
              : p
          )
        );

        await updateDoc(doc(db, "properties", editId), {
          name: formName.trim(),
          pricePerNight: priceNum,
          status: formStatus,
        });

        setToast("Property updated successfully!");
      } else {
        const docRef = await addDoc(collection(db, "properties"), {
          name: formName.trim(),
          pricePerNight: priceNum,
          status: formStatus,
          createdAt: Timestamp.now(),
        });

        setProperties((prev) => [
          ...prev,
          {
            id: docRef.id,
            name: formName.trim(),
            pricePerNight: priceNum,
            status: formStatus,
            createdAt: new Date(),
          },
        ]);

        setToast("Property added successfully!");
      }

      setLastUpdated(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
      setModalOpen(false);
      resetForm();
    } catch (err) {
      console.error("Failed to save property:", err);
      setError("Failed to save property. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (property: Property) => {
    setEditId(property.id);
    setFormName(property.name);
    setFormPrice(property.pricePerNight.toString());
    setFormStatus(property.status);
    setModalOpen(true);
  };

  const handleDeleteProperty = async (id: string) => {
    setDeletingId(id);
    setError(null);

    try {
      // Optimistic delete
      setProperties((prev) => prev.filter((p) => p.id !== id));

      await deleteDoc(doc(db, "properties", id));
      setToast("Property deleted successfully!");
      setLastUpdated(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Could not delete property. Please try again.");
    } finally {
      setDeletingId(null);
      setDeleteConfirmId(null);
    }
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-sky-500" />
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50 relative overflow-hidden">
      {/* Background glow for depth */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{ background: "radial-gradient(circle at 50% 50%, #3b82f6, transparent 70%)" }}
      />

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -256 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex w-64 flex-col border-r border-slate-800/60 bg-gradient-to-b from-slate-900 to-slate-950 px-4 py-6"
      >
        {/* Logo */}
        <div className="mb-10 flex items-center gap-3 px-1">
          <motion.div
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-sm font-bold shadow-lg shadow-sky-500/30"
            whileHover={{ scale: 1.1 }}
          >
            PL
          </motion.div>
          <div>
            <p className="text-base font-semibold tracking-tight">PMS Lite</p>
            <p className="text-xs text-slate-500">Property Management</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 text-sm">
          <motion.div
            className="flex items-center gap-3 rounded-lg bg-slate-800/70 px-4 py-3 text-slate-50 ring-1 ring-slate-700/60"
            whileHover={{ scale: 1.02 }}
          >
            <svg className="h-5 w-5 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            <span className="font-medium">Dashboard</span>
            <div className="ml-auto h-2 w-2 rounded-full bg-emerald-400" />
          </motion.div>

          <motion.a
            href="#properties-table"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors"
            whileHover={{ scale: 1.02 }}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Properties</span>
          </motion.a>

          <motion.button
            onClick={() => alert("Settings module – coming soon")}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors"
            whileHover={{ scale: 1.02 }}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Settings</span>
          </motion.button>
        </nav>

        {/* User info */}
        <div className="mt-auto rounded-xl border border-slate-800/60 bg-slate-900/60 px-4 py-4 text-xs">
          <p className="text-slate-500">Signed in as</p>
          <p className="mt-1 font-medium text-slate-300 truncate">{currentUser.email ?? "—"}</p>
        </div>
      </motion.aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-800/60 bg-slate-950/80 px-8 py-4 backdrop-blur-md">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <h1 className="text-lg font-semibold">Dashboard Overview</h1>
            <p className="text-sm text-slate-400 mt-0.5">Monitor properties & occupancy</p>
          </motion.div>
          <div className="flex items-center gap-4">
            <div className="hidden rounded-full bg-slate-900/80 px-4 py-1.5 text-sm text-slate-400 ring-1 ring-slate-800 sm:block">
              {currentUser.email}
            </div>
            <motion.button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-800/40 px-4 py-2 text-sm font-medium text-slate-300 hover:border-red-600/50 hover:bg-red-900/20 hover:text-red-300 transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </motion.button>
          </div>
        </header>

        {/* Stats Cards */}
        <section className="px-8 pt-8 pb-4">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Portfolio Snapshot</h2>
              {lastUpdated && (
                <p className="mt-1 text-xs text-slate-600">Last updated {lastUpdated}</p>
              )}
            </div>
            <motion.button
              onClick={() => setModalOpen(true)}
              className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-700/30 hover:from-sky-500 hover:to-blue-500 hover:shadow-sky-500/40 transition-all active:scale-97"
              whileHover={{ scale: 1.05 }}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Property
            </motion.button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <motion.div
              className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-600/40 hover:shadow-blue-900/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Properties</p>
                  <p className="mt-3 text-4xl font-bold text-slate-50">{totalProperties}</p>
                </div>
                <div className="rounded-lg bg-blue-900/30 p-3">
                  <svg className="h-6 w-6 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-600/40 hover:shadow-emerald-900/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Available</p>
                  <p className="mt-3 text-4xl font-bold text-slate-50">{availableCount}</p>
                </div>
                <div className="rounded-lg bg-emerald-900/30 p-3">
                  <svg className="h-6 w-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm transition hover:-translate-y-1 hover:border-rose-600/40 hover:shadow-rose-900/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Booked</p>
                  <p className="mt-3 text-4xl font-bold text-slate-50">{bookedCount}</p>
                </div>
                <div className="rounded-lg bg-rose-900/30 p-3">
                  <svg className="h-6 w-6 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Occupancy Trend Chart */}
          <motion.div
            className="mt-8 rounded-xl border border-slate-800 bg-slate-900/70 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Occupancy Trend (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none" }} />
                <Line type="monotone" dataKey="available" stroke="#10b981" dot={false} />
                <Line type="monotone" dataKey="booked" stroke="#f43f5e" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </section>

        {/* Properties Table */}
        <section id="properties-table" className="flex-1 px-8 py-6">
          <div className="mb-5 flex items-center justify-between flex-wrap gap-4">
            <h3 className="text-lg font-semibold text-slate-200">Your Properties</h3>
            <div className="flex items-center gap-4 flex-wrap">
              <input
                type="text"
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 outline-none transition min-w-[200px]"
              />
              <select
                value={sortBy}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as SortKey)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-100 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 outline-none transition"
              >
                <option value="name">Sort by Name</option>
                <option value="pricePerNight">Sort by Price</option>
                <option value="status">Sort by Status</option>
                <option value="createdAt">Sort by Date Added</option>
              </select>
              <button
                onClick={() => setSortAsc(!sortAsc)}
                className="text-sm text-slate-400 hover:text-slate-200 transition"
              >
                {sortAsc ? "↑ Asc" : "↓ Desc"}
              </button>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400 ring-1 ring-slate-700">
                {filteredProperties.length} {filteredProperties.length === 1 ? "property" : "properties"}
              </span>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-800 shadow-2xl shadow-black/40 overflow-y-auto max-h-[60vh]">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-900/80 sticky top-0">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Property</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Price / Night</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {fetching ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-3">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-sky-500" />
                        Loading properties...
                      </div>
                    </td>
                  </tr>
                ) : filteredProperties.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-16 text-center">
                      <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-slate-400">
                        <svg className="h-16 w-16 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        <p className="text-lg font-medium text-slate-300">No properties found</p>
                        <p className="text-sm">Try adjusting your search or add a new one.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProperties.map((property, index) => (
                    <motion.tr
                      key={property.id}
                      className="group hover:bg-slate-800/40 transition-colors"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-100">
                        {property.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <span className="font-semibold text-slate-50">
                          ${property.pricePerNight.toLocaleString()}
                        </span>
                        <span className="ml-1.5 text-xs text-slate-500">/night</span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <StatusBadge status={property.status} />
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right flex gap-2 justify-end">
                        <motion.button
                          onClick={() => handleEdit(property)}
                          className="inline-flex items-center gap-1.5 rounded border border-transparent px-3 py-1.5 text-xs font-medium text-slate-400 hover:border-sky-600/40 hover:bg-sky-900/20 hover:text-sky-300 transition-colors"
                          whileHover={{ scale: 1.05 }}
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Edit
                        </motion.button>
                        <motion.button
                          onClick={() => setDeleteConfirmId(property.id)}
                          disabled={deletingId === property.id}
                          className="inline-flex items-center gap-1.5 rounded border border-transparent px-3 py-1.5 text-xs font-medium text-slate-400 hover:border-rose-600/40 hover:bg-rose-900/20 hover:text-rose-300 disabled:opacity-50 transition-colors"
                          whileHover={{ scale: 1.05 }}
                        >
                          {deletingId === property.id ? (
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                          ) : (
                            <>
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6M14 11v6" />
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                              </svg>
                              Delete
                            </>
                          )}
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}
        </section>

        <footer className="border-t border-slate-800/60 px-8 py-4 text-center text-xs text-slate-600">
          PMS Lite © 2026 — Next.js + Firebase
        </footer>
      </main>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 rounded-lg bg-emerald-900/80 px-6 py-3 text-sm text-emerald-300 shadow-lg z-50"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setDeleteConfirmId(null)}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-900/30 text-rose-400">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">Delete Property?</h3>
                  <p className="mt-1 text-sm text-slate-400">This action cannot be undone.</p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteProperty(deleteConfirmId)}
                  disabled={deletingId === deleteConfirmId}
                  className="flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-rose-500 transition-colors disabled:opacity-60"
                >
                  {deletingId === deleteConfirmId && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-transparent" />
                  )}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Property Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => {
              setModalOpen(false);
              resetForm();
            }}
          >
            <motion.div
              className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-7 shadow-2xl"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-50">
                    {editId ? "Edit Property" : "Add New Property"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">Enter the property details below.</p>
                </div>
                <button
                  onClick={() => {
                    setModalOpen(false);
                    resetForm();
                  }}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                >
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAddOrEditProperty} className="space-y-5">
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-300">
                    Property Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormName(e.target.value)}
                    required
                    autoFocus
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 outline-none transition"
                    placeholder="e.g. Downtown Studio Apartment"
                  />
                </div>

                <div>
                  <label htmlFor="price" className="mb-1.5 block text-sm font-medium text-slate-300">
                    Price per Night (USD)
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <input
                      id="price"
                      type="number"
                      min="0"
                      step="1"
                      value={formPrice}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormPrice(e.target.value)}
                      required
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-10 pr-4 py-3 text-slate-100 placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 outline-none transition"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-slate-300">
                    Current Status
                  </label>
                  <select
                    id="status"
                    value={formStatus}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFormStatus(e.target.value as PropertyStatus)
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 outline-none transition"
                  >
                    <option value="Available">Available</option>
                    <option value="Booked">Booked</option>
                  </select>
                </div>

                {error && <p className="text-sm text-rose-400">{error}</p>}

                <div className="flex justify-end gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModalOpen(false);
                      resetForm();
                    }}
                    className="rounded-lg border border-slate-700 px-6 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:from-sky-500 hover:to-blue-500 disabled:opacity-60 transition-all"
                  >
                    {saving && (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-transparent" />
                    )}
                    {editId ? "Update Property" : "Save Property"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: PropertyStatus }) {
  const isAvailable = status === "Available";

  return (
    <motion.span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ${
        isAvailable
          ? "bg-emerald-950/60 text-emerald-300 ring-emerald-800/60"
          : "bg-rose-950/60 text-rose-300 ring-rose-800/60"
      }`}
      whileHover={{ scale: 1.1 }}
    >
      <span className={`h-2 w-2 rounded-full ${isAvailable ? "bg-emerald-400" : "bg-rose-400"}`} />
      {status}
    </motion.span>
  );
}