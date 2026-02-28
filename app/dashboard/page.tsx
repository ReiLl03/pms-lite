"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { collection, getDocs, addDoc, deleteDoc, doc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

type PropertyStatus = "Available" | "Booked";

interface Property {
  id: string;
  name: string;
  pricePerNight: number;
  status: PropertyStatus;
}

export default function DashboardPage() {
  const router = useRouter();
  const { currentUser, loading } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [fetching, setFetching] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStatus, setFormStatus] = useState<PropertyStatus>("Available");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

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
          const status: PropertyStatus =
            statusRaw === "Booked" ? "Booked" : "Available";

          return {
            id: d.id,
            name,
            pricePerNight: price,
            status,
          };
        });

        setProperties(docs);
        setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      } catch (err) {
        console.error("Failed to fetch properties:", err);
        setError("Could not load properties. Please try again later.");
      } finally {
        setFetching(false);
      }
    };

    fetchProperties();
  }, [currentUser]);

  const totalProperties = properties.length;
  const availableCount = useMemo(
    () => properties.filter((p) => p.status === "Available").length,
    [properties]
  );
  const bookedCount = useMemo(
    () => properties.filter((p) => p.status === "Booked").length,
    [properties]
  );

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
  };

  const handleAddProperty = async (e: React.FormEvent) => {
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
        },
      ]);

      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setModalOpen(false);
      resetForm();
    } catch (err) {
      console.error("Failed to add property:", err);
      setError("Failed to save property. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    setDeletingId(id);
    setError(null);

    try {
      await deleteDoc(doc(db, "properties", id));
      setProperties((prev) => prev.filter((p) => p.id !== id));
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Could not delete property. Please try again.");
    } finally {
      setDeletingId(null);
      setDeleteConfirmId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-sky-500" />
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-slate-800/60 bg-gradient-to-b from-slate-900 to-slate-950 px-4 py-6">
        {/* Logo */}
        <div className="mb-10 flex items-center gap-3 px-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-sm font-bold shadow-lg shadow-sky-500/30">
            PL
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight">PMS Lite</p>
            <p className="text-xs text-slate-500">Property Management</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 text-sm">
          <div className="flex items-center gap-3 rounded-lg bg-slate-800/70 px-4 py-3 text-slate-50 ring-1 ring-slate-700/60">
            <svg className="h-5 w-5 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            <span className="font-medium">Dashboard</span>
            <div className="ml-auto h-2 w-2 rounded-full bg-emerald-400" />
          </div>

          <a
            href="#properties-table"
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Properties</span>
          </a>

          <button
            onClick={() => alert("Settings module – coming soon")}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Settings</span>
          </button>
        </nav>

        {/* User info */}
        <div className="mt-auto rounded-xl border border-slate-800/60 bg-slate-900/60 px-4 py-4 text-xs">
          <p className="text-slate-500">Signed in as</p>
          <p className="mt-1 font-medium text-slate-300 truncate">{currentUser.email ?? "—"}</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-800/60 bg-slate-950/80 px-8 py-4 backdrop-blur-md">
          <div>
            <h1 className="text-lg font-semibold">Dashboard Overview</h1>
            <p className="text-sm text-slate-400 mt-0.5">Monitor properties & occupancy</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden rounded-full bg-slate-900/80 px-4 py-1.5 text-sm text-slate-400 ring-1 ring-slate-800 sm:block">
              {currentUser.email}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg border border-slate-700/70 bg-slate-800/40 px-4 py-2 text-sm font-medium text-slate-300 hover:border-red-600/50 hover:bg-red-900/20 hover:text-red-300 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
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
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-700/30 hover:from-sky-500 hover:to-blue-500 hover:shadow-sky-500/40 transition-all active:scale-97"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Property
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Total */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-600/40 hover:shadow-blue-900/10">
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
            </div>

            {/* Available */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-600/40 hover:shadow-emerald-900/10">
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
            </div>

            {/* Booked */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-sm transition hover:-translate-y-1 hover:border-rose-600/40 hover:shadow-rose-900/10">
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
            </div>
          </div>
        </section>

        {/* Properties Table */}
        <section id="properties-table" className="flex-1 px-8 py-6">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-200">Your Properties</h3>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400 ring-1 ring-slate-700">
              {properties.length} {properties.length === 1 ? "property" : "properties"}
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-800 shadow-2xl shadow-black/40">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-900/80">
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
                ) : properties.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-16 text-center">
                      <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-slate-400">
                        <svg className="h-16 w-16 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        <p className="text-lg font-medium text-slate-300">No properties added yet</p>
                        <p className="text-sm">Click "Add Property" to get started.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  properties.map((property) => (
                    <tr
                      key={property.id}
                      className="group hover:bg-slate-800/40 transition-colors"
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
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <button
                          onClick={() => setDeleteConfirmId(property.id)}
                          disabled={deletingId === property.id}
                          className="inline-flex items-center gap-1.5 rounded border border-transparent px-3 py-1.5 text-xs font-medium text-slate-400 hover:border-rose-600/40 hover:bg-rose-900/20 hover:text-rose-300 disabled:opacity-50 transition-colors"
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
                        </button>
                      </td>
                    </tr>
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
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
          </div>
        </div>
      )}

      {/* Add Property Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-7 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-50">Add New Property</h2>
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
                  <line x1="6" y1="6" x2="18" y2="6" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddProperty} className="space-y-5">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Property Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
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
                    onChange={(e) => setFormPrice(e.target.value)}
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
                  onChange={(e) => setFormStatus(e.target.value as PropertyStatus)}
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
                  {saving && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-transparent" />}
                  Save Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: PropertyStatus }) {
  const isAvailable = status === "Available";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ${
        isAvailable
          ? "bg-emerald-950/60 text-emerald-300 ring-emerald-800/60"
          : "bg-rose-950/60 text-rose-300 ring-rose-800/60"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${isAvailable ? "bg-emerald-400" : "bg-rose-400"}`} />
      {status}
    </span>
  );
}