"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

type PropertyStatus = "Available" | "Booked";

type Property = {
  id: string;
  name: string;
  pricePerNight: number;
  status: PropertyStatus;
};

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

  useEffect(() => {
    if (!loading && !currentUser) {
      router.replace("/login");
    }
  }, [currentUser, loading, router]);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const snapshot = await getDocs(collection(db, "properties"));
        const docs: Property[] = snapshot.docs.map((d) => {
          const data = d.data() as {
            name?: string;
            pricePerNight?: number;
            status?: PropertyStatus;
          };
          return {
            id: d.id,
            name: data.name ?? "Untitled",
            pricePerNight: Number(data.pricePerNight ?? 0),
            status: (data.status as PropertyStatus) ?? "Available",
          };
        });
        setProperties(docs);
        setLastUpdated(
          new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        );
      } catch (err) {
        console.error(err);
        setError("Failed to load properties.");
      } finally {
        setFetching(false);
      }
    };

    if (currentUser) {
      fetchProperties();
    }
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
  const occupancyRate =
    totalProperties > 0 ? Math.round((bookedCount / totalProperties) * 100) : 0;

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  const resetForm = () => {
    setFormName("");
    setFormPrice("");
    setFormStatus("Available");
    setError(null);
  };

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice) return;
    setSaving(true);
    setError(null);
    try {
      const price = Number(formPrice);
      const docRef = await addDoc(collection(db, "properties"), {
        name: formName.trim(),
        pricePerNight: price,
        status: formStatus,
      });
      setProperties((prev) => [
        ...prev,
        { id: docRef.id, name: formName.trim(), pricePerNight: price, status: formStatus },
      ]);
      setLastUpdated(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
      setModalOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      setError("Failed to add property. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "properties", id));
      setProperties((prev) => prev.filter((p) => p.id !== id));
      setLastUpdated(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    } catch (err) {
      console.error(err);
      setError("Failed to delete property.");
    } finally {
      setDeletingId(null);
      setDeleteConfirmId(null);
    }
  };

  if (loading || (!currentUser && !fetching)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" />
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 px-5 py-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-sm font-semibold shadow-lg shadow-sky-500/30">
            PL
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">PMS Lite</p>
            <p className="text-[11px] text-slate-400">Property dashboard</p>
          </div>
        </div>

        <nav className="space-y-1 text-sm font-medium">
          <button className="flex w-full items-center justify-between rounded-lg bg-slate-900 px-3 py-2 text-slate-50 ring-1 ring-slate-800 transition-all duration-200">
            <span>Dashboard</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </button>

          {/* Fixed anchor */}
          <a
            href="#properties-table"
            className="block w-full rounded-lg px-3 py-2 text-slate-300 transition-all duration-200 hover:bg-slate-900/70 hover:text-slate-50"
          >
            Properties
          </a>

          <button
            onClick={() => alert("Settings coming soon")}
            className="w-full rounded-lg px-3 py-2 text-left text-slate-300 transition-all duration-200 hover:bg-slate-900/70 hover:text-slate-50"
          >
            Settings
          </button>
        </nav>

        <div className="mt-auto pt-6 text-xs text-slate-500">
          <p>Signed in as</p>
          <p className="truncate font-medium text-slate-200">{currentUser.email}</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col bg-slate-950">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-8 py-4 backdrop-blur">
          <div>
            <h1 className="text-lg font-semibold text-slate-50">Dashboard overview</h1>
            <p className="text-xs text-slate-400">Monitor your properties and occupancy at a glance.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-slate-900 px-3 py-1.5 text-xs text-slate-300 ring-1 ring-slate-800">
              {currentUser.email}
            </div>
            <button
              onClick={handleLogout}
              className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition-all duration-200 hover:border-red-500/70 hover:bg-red-500/10 hover:text-red-100 active:scale-95"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Stats section */}
        <section className="px-8 py-6">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
              Portfolio Snapshot
            </h2>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-sky-500/30 transition-all duration-200 hover:from-sky-400 hover:to-blue-500 active:scale-95"
            >
              <span className="text-base leading-none">＋</span>
              Add property
            </button>
          </div>

          {lastUpdated && (
            <p className="mb-4 text-[11px] text-slate-500">Last updated: {lastUpdated}</p>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            {/* Total */}
            <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-b from-slate-950/90 to-slate-900/80 px-4 py-4 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl" style={{ borderTop: "3px solid #3b82f6" }}>
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-400">Total Properties</p>
              <p className="mt-2 text-2xl font-semibold text-slate-50">{totalProperties}</p>
              <p className="mt-1 text-[11px] text-slate-500">of total portfolio</p>
            </div>
            {/* Available */}
            <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-b from-slate-950/90 to-slate-900/80 px-4 py-4 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl" style={{ borderTop: "3px solid #10b981" }}>
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-400">Available</p>
              <p className="mt-2 text-2xl font-semibold text-slate-50">{availableCount}</p>
              <p className="mt-1 text-[11px] text-slate-500">available now</p>
            </div>
            {/* Booked */}
            <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-b from-slate-950/90 to-slate-900/80 px-4 py-4 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl" style={{ borderTop: "3px solid #f43f5e" }}>
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-400">Booked</p>
              <p className="mt-2 text-2xl font-semibold text-slate-50">{bookedCount}</p>
              <p className="mt-1 text-[11px] text-slate-500">currently booked</p>
            </div>
          </div>

          {/* Occupancy bar */}
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300">Occupancy Rate</span>
              <span className="font-semibold text-slate-100">{occupancyRate}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${occupancyRate}%`, background: "linear-gradient(to right, #10b981, #f59e0b, #f43f5e)" }} />
            </div>
          </div>
        </section>

        {/* Table */}
        <section className="flex-1 px-8 pb-6" id="properties-table">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100">Properties</h3>
            <p className="text-[11px] text-slate-500">
              Showing <span className="font-medium text-slate-300">{properties.length}</span> records
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/80 shadow-xl">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="bg-slate-950/80">
                  <th className="border-b border-slate-800 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Property Name</th>
                  <th className="border-b border-slate-800 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Price / Night</th>
                  <th className="border-b border-slate-800 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                  <th className="border-b border-slate-800 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fetching ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-xs text-slate-400">Loading properties...</td>
                  </tr>
                ) : properties.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center">
                      <p className="text-sm font-medium text-slate-300">No properties yet</p>
                      <p className="mt-1 text-xs text-slate-500">Click &quot;Add property&quot; to create your first listing.</p>
                    </td>
                  </tr>
                ) : (
                  properties.map((property, index) => (
                    <tr key={property.id} className={`text-sm transition-all duration-150 hover:bg-slate-900/60 ${index % 2 === 0 ? "bg-slate-950" : "bg-slate-950/60"}`}>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-100" style={{ borderLeft: `3px solid ${property.status === "Available" ? "#10b981" : "#f43f5e"}` }}>
                        {property.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-100">${property.pricePerNight.toLocaleString()}</td>
                      <td className="whitespace-nowrap px-4 py-3"><StatusBadge status={property.status} /></td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <button
                          onClick={() => setDeleteConfirmId(property.id)}
                          disabled={deletingId === property.id}
                          className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-500 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 active:scale-95 disabled:opacity-50"
                        >
                          {deletingId === property.id ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {error && <p className="mt-3 text-xs text-rose-300/90">{error}</p>}
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800 px-8 py-4 text-center text-[11px] text-slate-600">
          PMS Lite © 2026 — Built with Next.js & Firebase
        </footer>
      </main>

      {/* Delete confirmation modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center shadow-lg">
            <p className="mb-4 text-sm text-slate-200">Are you sure you want to delete this property?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleDeleteProperty(deleteConfirmId)}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-900/40"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add property modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-lg">
            <h4 className="mb-4 text-lg font-semibold text-slate-50">Add New Property</h4>
            <form onSubmit={handleAddProperty} className="space-y-4">
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Property Name"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
              <input
                type="number"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                placeholder="Price per night"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as PropertyStatus)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="Available">Available</option>
                <option value="Booked">Booked</option>
              </select>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setModalOpen(false); resetForm(); }}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Add Property"}
                </button>
              </div>
              {error && <p className="mt-2 text-xs text-rose-300/90">{error}</p>}
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
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        isAvailable
          ? "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/40"
          : "bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/40"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isAvailable ? "bg-emerald-400" : "bg-rose-400"
        }`}
      />
      {status}
    </span>
  );
}