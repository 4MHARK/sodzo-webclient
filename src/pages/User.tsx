import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, Shield, Search, ChevronDown, ChevronUp } from "lucide-react";

// ─── SWITCH THIS WHEN BACKEND IS READY ───────────────────────────────────────
// true  = show mock data (for demo / showing your boss)
// false = fetch real data from localhost:3000
const USE_MOCK = true;

// The URL your boss gave you — a separate server from the main Saby API.
const COMPLIANCE_URL =
  "http://localhost:3000/reports/baseline-intelligence/compliance";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ComplianceUser {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  roles: string[];
  status: "Compliant" | "Non-Compliant" | "Pending";
  lastUpdated: string;
}

// ─── Mock Data (remove this section when backend is live) ────────────────────

const MOCK_USERS: ComplianceUser[] = [
  {
    id: "1",
    firstname: "John",
    lastname: "Okafor",
    email: "john.okafor@swordofspirit.org",
    roles: ["Pastor", "Admin"],
    status: "Compliant",
    lastUpdated: "2026-06-28T10:30:00Z",
  },
  {
    id: "2",
    firstname: "Grace",
    lastname: "Adebayo",
    email: "grace.adebayo@swordofspirit.org",
    roles: ["Deacon", "Treasurer"],
    status: "Compliant",
    lastUpdated: "2026-06-25T14:15:00Z",
  },
  {
    id: "3",
    firstname: "David",
    lastname: "Emmanuel",
    email: "david.emmanuel@swordofspirit.org",
    roles: ["Usher", "Member"],
    status: "Non-Compliant",
    lastUpdated: "2026-07-01T09:00:00Z",
  },
  {
    id: "4",
    firstname: "Mary",
    lastname: "Chukwu",
    email: "mary.chukwu@swordofspirit.org",
    roles: ["Choir", "Member"],
    status: "Pending",
    lastUpdated: "2026-07-02T16:45:00Z",
  },
  {
    id: "5",
    firstname: "Samuel",
    lastname: "Ibrahim",
    email: "samuel.ibrahim@swordofspirit.org",
    roles: ["Elder", "Admin", "Finance"],
    status: "Compliant",
    lastUpdated: "2026-06-30T11:20:00Z",
  },
  {
    id: "6",
    firstname: "Esther",
    lastname: "Nwachukwu",
    email: "esther.nwachukwu@swordofspirit.org",
    roles: ["Sunday School", "Member"],
    status: "Non-Compliant",
    lastUpdated: "2026-06-20T08:00:00Z",
  },
  {
    id: "7",
    firstname: "Peter",
    lastname: "Oluwaseun",
    email: "peter.oluwaseun@swordofspirit.org",
    roles: ["Security", "Member"],
    status: "Pending",
    lastUpdated: "2026-07-03T07:30:00Z",
  },
  {
    id: "8",
    firstname: "Deborah",
    lastname: "Akintola",
    email: "deborah.akintola@swordofspirit.org",
    roles: ["Counselor", "Deacon"],
    status: "Compliant",
    lastUpdated: "2026-06-29T13:00:00Z",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStatusBadge(status: ComplianceUser["status"]) {
  switch (status) {
    case "Compliant":
      return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
    case "Non-Compliant":
      return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
    case "Pending":
      return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
    default:
      return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300";
  }
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default function User() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof ComplianceUser | "">("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // ── Data Fetching ────────────────────────────────────────────────────────
  // When USE_MOCK is true: returns fake data instantly (for demo).
  // When USE_MOCK is false: hits localhost:3000 for real data.
  // Just flip the USE_MOCK flag at the top when your backend is ready.

  const {
    data: users = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["user-compliance"],
    queryFn: async (): Promise<ComplianceUser[]> => {
      if (USE_MOCK) {
        // Simulate network delay so the loading spinner is visible briefly
        await new Promise((r) => setTimeout(r, 500));
        return MOCK_USERS;
      }

      // Real API call — runs when USE_MOCK is false
      const response = await fetch(COMPLIANCE_URL);
      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}: ${response.statusText}`
        );
      }
      const json = await response.json();
      return json.results || json.data || json;
    },
    retry: 1,
  });

  // ── Filtering & Sorting ──────────────────────────────────────────────────

  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.firstname?.toLowerCase().includes(q) ||
      u.lastname?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.roles?.join(" ").toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortKey) return 0;
    const av = a[sortKey];
    const bv = b[sortKey];
    if (av == null) return 1;
    if (bv == null) return -1;
    const aStr = Array.isArray(av) ? av.join(", ") : String(av);
    const bStr = Array.isArray(bv) ? bv.join(", ") : String(bv);
    return sortDir === "asc"
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });

  const toggleSort = (key: keyof ComplianceUser) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const counts = {
    compliant: users.filter((u) => u.status === "Compliant").length,
    nonCompliant: users.filter((u) => u.status === "Non-Compliant").length,
    pending: users.filter((u) => u.status === "Pending").length,
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          User Compliance
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Baseline intelligence — user compliance report
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Compliant", count: counts.compliant, color: "green" },
          { label: "Non-Compliant", count: counts.nonCompliant, color: "red" },
          { label: "Pending", count: counts.pending, color: "yellow" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center shadow-sm"
          >
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stat.count}
            </p>
            <p
              className={`text-sm font-medium ${
                stat.color === "green"
                  ? "text-green-600"
                  : stat.color === "red"
                    ? "text-red-600"
                    : "text-yellow-600"
              }`}
            >
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
        </div>

        <button
          onClick={() => refetch()}
          className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* ── Loading ──────────────────────────────────────────────────── */}
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Loading user compliance data...
            </span>
          </div>
        )}

        {/* ── Error ────────────────────────────────────────────────────── */}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <Shield className="w-12 h-12 text-red-400 mb-4" />
            <p className="text-red-600 dark:text-red-400 font-medium mb-2">
              Failed to load compliance data
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {(error as any)?.message || "Is the backend running on port 3000?"}
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ── Empty ────────────────────────────────────────────────────── */}
        {!isLoading && !error && users.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              No user compliance data available
            </p>
          </div>
        )}

        {/* ── Table ────────────────────────────────────────────────────── */}
        {!isLoading && !error && users.length > 0 && (
          <>
            {/* Column Headers */}
            <div className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 px-4 py-3 hidden md:grid md:grid-cols-12 gap-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              {(
                [
                  { key: "firstname" as const, label: "Name", span: "md:col-span-3" },
                  { key: "email" as const, label: "Email", span: "md:col-span-3" },
                  { key: "roles" as const, label: "Roles", span: "md:col-span-2" },
                  { key: "status" as const, label: "Status", span: "md:col-span-2" },
                  { key: "lastUpdated" as const, label: "Last Updated", span: "md:col-span-2" },
                ]
              ).map(({ key, label, span }) => (
                <div
                  key={key}
                  className={`${span} flex items-center gap-1 cursor-pointer hover:text-blue-600 select-none`}
                  onClick={() => toggleSort(key)}
                >
                  {label}
                  {sortKey === key &&
                    (sortDir === "asc" ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    ))}
                </div>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {sorted.map((u, i) => (
                <motion.div
                  key={u.id || i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    {/* Name */}
                    <div className="md:col-span-3">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {u.firstname} {u.lastname}
                      </span>
                    </div>

                    {/* Email */}
                    <div className="md:col-span-3 text-sm text-gray-600 dark:text-gray-400 truncate">
                      {u.email}
                    </div>

                    {/* Roles */}
                    <div className="md:col-span-2">
                      <div className="flex flex-wrap gap-1">
                        {u.roles?.length > 0 ? (
                          u.roles.map((role) => (
                            <span
                              key={role}
                              className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                            >
                              {role}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm italic">
                            No roles
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="md:col-span-2">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(u.status)}`}
                      >
                        {u.status}
                      </span>
                    </div>

                    {/* Last Updated */}
                    <div className="md:col-span-2 text-sm text-gray-500 dark:text-gray-400">
                      {u.lastUpdated
                        ? new Date(u.lastUpdated).toLocaleDateString()
                        : "—"}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
