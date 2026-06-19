"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { LEGAL_VERSION, LEGAL_EFFECTIVE_DATE } from "@/lib/legal";

// Define legal text content blocks for easy search filtering
interface ContentBlock {
  title: string;
  text: string;
}

interface DocumentSection {
  id: string;
  title: string;
  icon: string;
  blocks: ContentBlock[];
}

function LegalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("terms");
  const [searchQuery, setSearchQuery] = useState("");
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Sync tab with URL search param if present (e.g. /legal?tab=hipaa)
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["terms", "privacy", "hipaa", "disclaimer"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const docs: DocumentSection[] = [
    {
      id: "terms",
      title: "Terms of Service",
      icon: "📄",
      blocks: [
        {
          title: "1. Acceptance of Terms",
          text: "By accessing or using SafeMeds, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use the application. These terms apply to all students, pharmacists, staff, and administrators who use the platform."
        },
        {
          title: "2. Description of Service",
          text: "SafeMeds is a telepharmacy application connecting students with licensed pharmacists for health consultations, prescription handling, and discreet delivery tracking. Consultations can be requested anonymously or through a registered account."
        },
        {
          title: "3. Account Security & Anonymous Sessions",
          text: "If you register for an account, you are responsible for maintaining the confidentiality of your credentials. For anonymous consultations, we generate an Anonymous Session ID. You are solely responsible for saving this ID; if it is lost, we cannot recover your session details or chat history. Anonymous sessions expire automatically after 7 days of inactivity."
        },
        {
          title: "4. Medication & Prescription Policy",
          text: "SafeMeds facilitates consultation and prescription requests, but does not directly manufacture or guarantee the availability of medications. All prescriptions must be issued by licensed healthcare providers. Controlled substances require rigorous identity verification and are subject to state laws and university policy."
        },
        {
          title: "5. User Conduct",
          text: "You agree not to use the service for any unlawful purposes, including obtaining unauthorized prescription medications, harassment of staff or pharmacists, or transmission of malicious code. Violations of this policy will result in account suspension and, if appropriate, referral to university disciplinary boards or local law enforcement."
        }
      ]
    },
    {
      id: "privacy",
      title: "Privacy Policy",
      icon: "🔒",
      blocks: [
        {
          title: "1. Privacy Commitment",
          text: "At SafeMeds, privacy is our core foundation. We are committed to protecting your personal information and health history. We do not sell, rent, or share patient data with third parties for marketing purposes."
        },
        {
          title: "2. Information We Collect",
          text: "For registered clients, we collect name, email, username, and encrypted passwords. For pharmacists, we also collect and verify professional license numbers. For anonymous sessions, we collect details regarding symptoms, allergies, and age, stored under a randomized token session ID with no identifying metadata linked to your device."
        },
        {
          title: "3. Data Encryption & Security",
          text: "All text messages, consultation details, and prescription requests are encrypted in transit using TLS 1.3 and at rest using AES-256 encryption. Access to patient records is strictly restricted to assigned pharmacists and authorized medical personnel."
        },
        {
          title: "4. Data Retention & Auto-Deletion",
          text: "Consistent with student health privacy, registered users can configure auto-deletion policies for their chat history (default is 30 days) in User Settings. Anonymous consultation chat data is permanently deleted 7 days after the consultation status changes to COMPLETED."
        },
        {
          title: "5. Cookie Usage",
          text: "We use essential cookies strictly to maintain authentication sessions. We do not use advertising, tracking, or marketing cookies. You can disable cookies in your browser settings, but it will prevent login features from functioning."
        }
      ]
    },
    {
      id: "hipaa",
      title: "HIPAA & Security Statement",
      icon: "🏥",
      blocks: [
        {
          title: "1. HIPAA Alignment",
          text: "While SafeMeds is designed primarily for university campus environments, we build all processes to align with the Health Insurance Portability and Accountability Act (HIPAA) Security and Privacy Rules. We employ standard technical safeguards to protect your Protected Health Information (PHI)."
        },
        {
          title: "2. Technical Safeguards",
          text: "Our servers run in secure data centers utilizing row-level database protection to prevent data exposure. Every API request requires a verified session cookie or authorized token. Audit logs track all pharmacist actions including record viewing, prescription writing, and message history."
        },
        {
          title: "3. Pharmacist Verification",
          text: "SafeMeds enforces identity and professional license verification for all accounts with the PHARMACY role. Licenses are verified against state licensing databases prior to granting access to patient consultations."
        },
        {
          title: "4. Breach Notification",
          text: "In the unlikely event of a security breach involving PHI, SafeMeds adheres to a strict protocol to notify affected users and university administrators within 24 hours of discovery, along with details of the mitigation steps taken."
        }
      ]
    },
    {
      id: "disclaimer",
      title: "Medical Disclaimer",
      icon: "⚠️",
      blocks: [
        {
          title: "1. EMERGENCY WARNING: NOT FOR EMERGENCIES",
          text: "SAFEMEDS IS NOT AN EMERGENCY HEALTH SERVICE. IF YOU ARE EXPERIENCING A MEDICAL EMERGENCY, SUSPECT A DRUG OVERDOSE, OR ARE HAVING THOUGHTS OF SELF-HARM, PLEASE DIAL 911 (OR YOUR LOCAL EMERGENCY NUMBER) OR VISIT THE NEAREST EMERGENCY ROOM IMMEDIATELY."
        },
        {
          title: "2. Advisory Nature of Service",
          text: "Consultations and chat logs provided on SafeMeds are for informational, educational, and advisory purposes. While our pharmacists are licensed professionals, an online chat or video consultation cannot substitute for an in-person diagnostic evaluation. No diagnosis or physical exams are performed on this platform."
        },
        {
          title: "3. Accuracy of Information",
          text: "Pharmacist recommendations rely entirely on the accuracy and completeness of the symptoms, medical history, allergies, and current medications you report. Failure to disclose complete medical details can lead to adverse drug interactions or ineffective treatment. You assume full responsibility for the accuracy of your reports."
        },
        {
          title: "4. External Prescriptions & Local Pharmacies",
          text: "SafeMeds facilitates prescription issuance and campus drop-off delivery. However, the final dispensing and counseling of medications are governed by standard pharmaceutical guidelines. Students are encouraged to consult their primary care physician for long-term clinical care."
        }
      ]
    }
  ];

  const faqs = [
    {
      q: "Is my consultation strictly anonymous?",
      a: "Yes. If you choose the anonymous consultation option, we generate a random 8-character token (e.g. Session ID). Your symptoms, chat logs, and instructions are associated only with this ID. We do not track IP addresses, emails, or student numbers for anonymous consultations."
    },
    {
      q: "Will my university or university health center see my records?",
      a: "No. Unless you explicitly authorize the release of your records, your consultations on SafeMeds are completely private. Pharmacists verify their licenses to use the platform but operate within strict doctor-patient confidentiality boundaries."
    },
    {
      q: "How does the discreet packaging and delivery work?",
      a: "All delivery orders checked out through SafeMeds are packaged in plain, unbranded boxes or envelopes with no markings indicating the contents. Delivery tracking updates indicate only the drop point location (e.g. Student Center Locker 4) and a pin code, with no medication details displayed."
    },
    {
      q: "What encryption standards does SafeMeds use?",
      a: "We encrypt all data in transit using SSL/TLS 1.3 protocols. Databases containing consultation history, chat transcripts, and settings use enterprise-grade AES-256 rest encryption, with restricted access keys updated regularly."
    }
  ];

  // Client-side text search implementation
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) {
      return <span>{text}</span>;
    }
    const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-yellow-200 text-black px-0.5 rounded font-medium">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const currentDoc = docs.find((d) => d.id === activeTab) || docs[0];

  // Check if search query matches any content block in the current document
  const filteredBlocks = currentDoc.blocks.filter(
    (block) =>
      block.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Print-only CSS style injection */}
      <style jsx global>{`
        @media print {
          nav, header, footer, .no-print {
            display: none !important;
          }
          .print-area {
            display: block !important;
            width: 100% !important;
            color: #000 !important;
            background: #fff !important;
          }
          body {
            background-color: #ffffff !important;
          }
        }
      `}</style>

      {/* Header */}
      <header className="relative border-b border-gray-200/80 dark:border-gray-700/80 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md z-10 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => router.push("/")}>
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-xl">🛡️</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                SafeMeds
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Trust & Security Hub
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Go Back
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Navigation Sidebar (No-print) */}
          <div className="lg:col-span-1 space-y-6 no-print">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-gray-150 dark:border-gray-700/50">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Trust Center Sections
              </h3>
              <nav className="space-y-1">
                {docs.map((doc) => (
                  <motion.button
                    key={doc.id}
                    whileHover={{ x: 4 }}
                    onClick={() => {
                      setActiveTab(doc.id);
                      setSearchQuery("");
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all ${
                      activeTab === doc.id
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <span className="text-lg">{doc.icon}</span>
                    <span>{doc.title}</span>
                  </motion.button>
                ))}
              </nav>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10 text-8xl font-bold">
                🔒
              </div>
              <h4 className="font-semibold text-lg mb-2">Need a copy?</h4>
              <p className="text-sm opacity-90 mb-4 leading-relaxed">
                You can download a PDF or print these disclaimers and agreements for your records.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrint}
                className="w-full bg-white text-indigo-600 hover:bg-gray-50 font-medium py-2.5 rounded-xl text-sm transition-colors shadow-sm"
              >
                Print / Save PDF
              </motion.button>
            </div>
          </div>

          {/* Document Content Area */}
          <div className="lg:col-span-3 space-y-8 print-area">
            
            {/* Search and Metadata Controls */}
            <div className="bg-white/85 dark:bg-gray-800/85 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-150 dark:border-gray-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder={`Search in ${currentDoc.title}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between md:justify-end gap-3 font-medium">
                <span>Effective Date: {LEGAL_EFFECTIVE_DATE}</span>
                <span className="hidden md:inline">•</span>
                <span>Version {LEGAL_VERSION}</span>
              </div>
            </div>

            {/* Document Render Panel */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-150 dark:border-gray-700/30 min-h-[500px]">
              <div className="flex items-center space-x-3 mb-8 pb-4 border-b border-gray-100 dark:border-gray-700">
                <span className="text-4xl">{currentDoc.icon}</span>
                <div>
                  <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    {currentDoc.title}
                  </h2>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                    SafeMeds Trust Center Compliance Document
                  </p>
                </div>
              </div>

              {/* Display Filtered Blocks */}
              <div className="space-y-8">
                {filteredBlocks.length === 0 ? (
                  <div className="text-center py-16">
                    <span className="text-4xl mb-4 block">🔍</span>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
                      No matching sections found
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Try clearing your search query or looking for different keywords.
                    </p>
                  </div>
                ) : (
                  filteredBlocks.map((block, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group"
                    >
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2 pb-1 border-b border-gray-50 dark:border-gray-800 group-hover:border-indigo-500/20 transition-colors">
                        {highlightText(block.title, searchQuery)}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                        {highlightText(block.text, searchQuery)}
                      </p>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* FAQs Accordion Panel (No-print) */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-150 dark:border-gray-700/50 no-print">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <span>🤔</span> Legal & Trust FAQs
              </h3>
              <div className="space-y-3">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="border border-gray-200/60 dark:border-gray-700/60 rounded-2xl overflow-hidden bg-white/40 dark:bg-gray-900/10"
                  >
                    <button
                      onClick={() => setFaqOpen(faqOpen === index ? null : index)}
                      className="w-full flex items-center justify-between px-6 py-4 text-left font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-sm"
                    >
                      <span>{faq.q}</span>
                      <span className={`text-gray-400 transition-transform duration-200 ${faqOpen === index ? "rotate-180" : ""}`}>
                        ▼
                      </span>
                    </button>
                    <AnimatePresence>
                      {faqOpen === index && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="px-6 pb-4 pt-1 text-sm text-gray-600 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-900/20 leading-relaxed"
                        >
                          {faq.a}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* Trust Footer */}
      <footer className="border-t border-gray-200/80 dark:border-gray-700/80 bg-white/50 dark:bg-gray-900/50 py-8 text-center text-xs text-gray-500 dark:text-gray-400 no-print">
        <div className="max-w-7xl mx-auto px-4 leading-relaxed space-y-1">
          <p>© 2026 SafeMeds Inc. Campus Telepharmacy Platform.</p>
          <p>Compliance audited under federal student privacy regulations and HIPAA standards.</p>
        </div>
      </footer>
    </div>
  );
}

export default function LegalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50" />}>
      <LegalContent />
    </Suspense>
  );
}
