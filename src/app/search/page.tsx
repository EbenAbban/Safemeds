"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Search, Pill, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui";

interface Medication {
  id: string;
  name: string;
  genericName: string | null;
  dosageForm: string;
  strength: string;
  price: number;
  manufacturer: string;
  isPrescription: boolean;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/medications?search=${encodeURIComponent(query)}&limit=50`
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setResults(data.medications || []);
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
      } finally {
        setLoading(false);
        setSearched(true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-fixed/30 to-primary-fixed/50 dark:from-surface-dark dark:to-surface-container-high">
      <nav className="sticky top-0 z-50 bg-surface-container-lowest/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-outline-variant/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-medical-teal dark:text-primary-fixed-dim">
            SafeMeds
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-on-surface-variant hover:text-medical-teal dark:hover:text-primary-fixed-dim transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl font-bold text-on-surface mb-3">
            Search Medications
          </h1>
          <p className="text-on-surface-variant">
            Find medications by name, generic name, or description
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="relative max-w-2xl mx-auto mb-10"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-outline" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for medications..."
            className="w-full pl-12 pr-4 py-4 text-lg bg-surface-container-lowest dark:bg-surface-container border border-outline-variant rounded-xl shadow-lg focus:ring-2 focus:ring-soft-aqua focus:border-transparent outline-none text-on-surface"
          />
        </motion.div>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 text-soft-aqua animate-spin" />
          </div>
        )}

        {!loading && searched && results.length === 0 && query.trim() && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Pill className="h-16 w-16 text-outline-variant dark:text-on-surface-variant mx-auto mb-4" />
            <p className="text-xl font-medium text-on-surface-variant">
              No medications found
            </p>
            <p className="text-outline mt-1">
              Try adjusting your search term
            </p>
          </motion.div>
        )}

        {!query.trim() && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Search className="h-16 w-16 text-outline-variant dark:text-on-surface-variant mx-auto mb-4" />
            <p className="text-lg text-outline">
              Type above to search for medications
            </p>
          </motion.div>
        )}

        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <p className="text-sm text-on-surface-variant mb-2">
              {results.length} result{results.length !== 1 ? "s" : ""} found
            </p>
            {results.map((med, i) => (
              <motion.div
                key={med.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-surface-container-lowest dark:bg-surface-container rounded-xl p-5 shadow-md border border-outline-variant/60 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-on-surface">
                      {med.name}
                    </h3>
                    {med.genericName && (
                      <p className="text-sm text-on-surface-variant">
                        {med.genericName}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge tone="primary">{med.dosageForm}</Badge>
                      <Badge tone="info">{med.strength}</Badge>
                      {med.isPrescription && <Badge tone="warning">Rx Required</Badge>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-on-surface">
                      ${Number(med.price).toFixed(2)}
                    </p>
                    <p className="text-xs text-outline mt-1">
                      {med.manufacturer}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
