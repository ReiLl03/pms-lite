"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { collection, getDocs, addDoc } from "firebase/firestore";
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

  useEffect(() => {
    if (!loading && !currentUser) {
      router.replace("/login");
    }
  }, [currentUser, loading, router]);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const snapshot = await getDocs(collection(db, "properties"));
        const docs: Property[] = snapshot.docs.map((doc) => {
          const data = doc.data() as {
            name?: string;
            pricePerNight?: number;
            status?: PropertyStatus;
          };

          return {
            id: doc.id,
            name: data.name ?? "Untitled",
            pricePerNight: Number(data.pricePerNight ?? 0),
            status: (data.status as PropertyStatus) ?? "Available",
          };
        });
        setProperties(docs);
      } catch (err) {
        // eslint-disable-next-line no-console
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
    [properties],
  );
  const bookedCount = useMemo(
    () => properties.filter((p) => p.status === "Booked").length,
    [properties],
  );

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
        {
          id: docRef.id,
          name: formName.trim(),
          pricePerNight: price,
          status: formStatus,
        },
      ]);

      setModalOpen(false);
      resetForm();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError("Failed to add property. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || (!currentUser && !fetching)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <aside className="flex w-64 flex-col border-r border-slate-800 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 px-5 py-6 shadow-2xl shadow-slate-950/70">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-sm font-semibold shadow-lg shadow-sky-500/30">
            PL
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">PMS Lite</p>
            <p className="text-[11px] text-slate-400">Property dashboard</p>
          </div>
        </div>

        <nav className="space-y-1 text-sm font-medium text-slate-300">
          <button className="flex w-full items-center justify-between rounded-lg bg-slate-900 px-3 py-2 text-slate-50 shadow-sm shadow-slate-950/60 ring-1 ring-slate-800">
            <span>Dashboard</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </button>
          <button className="w-full rounded-lg px-3 py-2 text-left text-slate-300 transition hover:bg-slate-900/70 hover:text-slate-50">
            Properties
          </button>
          <button className="w-full rounded-lg px-3 py-2 text-left text-slate-300 transition hover:bg-slate-900/70 hover:text-slate-50">
            Settings
          </button>
        </nav>

        <div className="mt-auto pt-6 text-xs text-slate-500">
          <p>Signed in as</p>
          <p className="truncate font-medium text-slate-200">
            {currentUser.email}
          </p>
        </div>
      </aside>

      <main className="flex-1 bg-slate-950">
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-8 py-4 backdrop-blur">
          <div>
            <h1 className="text-lg font-semibold text-slate-50">
              Dashboard overview
            </h1>
            <p className="text-xs text-slate-400">
              Monitor your properties and occupancy at a glance.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-slate-900 px-3 py-1.5 text-xs text-slate-300 ring-1 ring-slate-800">
              {currentUser.email}
            </div>
            <button
              onClick={handleLogout}
              className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-red-500/70 hover:bg-red-500/10 hover:text-red-100"
            >
              Logout
            </button>
          </div>
        </header>

        <section className="px-8 py-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
              Portfolio snapshot
            </h2>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-sky-500/30 transition hover:from-sky-400 hover:to-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70"
            >
              <span className="text-base leading-none">＋</span>
              Add property
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <StatsCard
              label="Total properties"
              value={totalProperties}
              accent="from-slate-300 to-slate-100"
            />
            <StatsCard
              label="Available"
              value={availableCount}
              accent="from-emerald-400 to-emerald-300"
            />
            <StatsCard
              label="Booked"
              value={bookedCount}
              accent="from-rose-400 to-rose-300"
            />
          </div>
        </section>

        <section className="px-8 pb-10">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100">
              Properties
            </h3>
            <p className="text-[11px] text-slate-500">
              Showing{" "}
              <span className="font-medium text-slate-300">
                {properties.length}
              </span>{" "}
              records
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/80 shadow-xl shadow-slate-950/70">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="bg-slate-950/80">
                  <th className="border-b border-slate-800 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Property name
                  </th>
                  <th className="border-b border-slate-800 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Price / night
                  </th>
                  <th className="border-b border-slate-800 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {fetching ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-6 text-center text-xs text-slate-400"
                    >
                      Loading properties...
                    </td>
                  </tr>
                ) : properties.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-6 text-center text-xs text-slate-400"
                    >
                      No properties yet. Use &quot;Add property&quot; to create
                      your first listing.
                    </td>
                  </tr>
                ) : (
                  properties.map((property, index) => (
                    <tr
                      key={property.id}
                      className={`text-sm transition hover:bg-slate-900/60 ${
                        index % 2 === 0 ? "bg-slate-950" : "bg-slate-950/60"
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-slate-100">
                        {property.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-slate-100">
                        <span className="font-medium">
                          ${property.pricePerNight.toLocaleString()}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge status={property.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {error && (
            <p className="mt-3 text-xs text-rose-300/90">{error}</p>
          )}
        </section>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md scale-100 rounded-2xl border border-slate-800 bg-slate-950/95 p-6 text-slate-50 shadow-2xl shadow-slate-950/70 transition-transform">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-50">
                  Add property
                </h2>
                <p className="text-[11px] text-slate-400">
                  Create a new listing with pricing and status.
                </p>
              </div>
              <button
                onClick={() => {
                  setModalOpen(false);
                  resetForm();
                }}
                className="rounded-full bg-slate-900 px-2 py-1 text-xs text-slate-400 transition hover:bg-slate-800 hover:text-slate-100"
              >
                Esc
              </button>
            </div>

            <form onSubmit={handleAddProperty} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="name"
                  className="text-xs font-medium text-slate-200"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                  placeholder="Oceanview Apartment"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="price"
                  className="text-xs font-medium text-slate-200"
                >
                  Price per night (USD)
                </label>
                <input
                  id="price"
                  type="number"
                  min={0}
                  step="1"
                  required
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                  placeholder="180"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="status"
                  className="text-xs font-medium text-slate-200"
                >
                  Status
                </label>
                <select
                  id="status"
                  value={formStatus}
                  onChange={(e) =>
                    setFormStatus(e.target.value as PropertyStatus)
                  }
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="Available">Available</option>
                  <option value="Booked">Booked</option>
                </select>
              </div>

              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    resetForm();
                  }}
                  className="rounded-lg px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-900/80 hover:text-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-sky-500/30 transition hover:from-sky-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-200/70 border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    "Save property"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatsCard(props: {
  label: string;
  value: number;
  accent: string;
}) {
  const { label, value, accent } = props;
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-b from-slate-950/90 to-slate-900/80 px-4 py-4 shadow-lg shadow-slate-950/70">
      <div className="pointer-events-none absolute inset-x-0 -top-6 h-16 bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-violet-500/10" />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-50">
            {value.toLocaleString()}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/80 ring-1 ring-slate-700/80">
          <span
            className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br ${accent} text-[11px] font-semibold text-slate-950 shadow-md shadow-slate-900/70`}
          >
            {label.charAt(0)}
          </span>
        </div>
      </div>
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

