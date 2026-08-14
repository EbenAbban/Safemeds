import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import localFont from "next/font/local";
import "./globals.css";
import InstallGate from "@/components/pwa/InstallGate";
import ServiceWorkerRegistrar from "@/components/pwa/ServiceWorkerRegistrar";
import SessionProvider from "@/components/Auth/SessionProvider";
import { auth } from "@/app/auth";
import { ThemeProvider } from "@/context/ThemeContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { OnboardingProvider } from "@/context/OnboardingContext";
import OnboardingWizard from "@/components/Common/OnboardingWizard";
import NavButtons from "@/components/Common/NavButtons";
import ThemeToggle from "@/components/Common/ThemeToggle";

// Self-hosted rather than next/font/google on purpose. The design system calls
// for Inter + Manrope, but ba2725d removed the Google Fonts dependency so the
// project could build offline — and next/font/google still fetches at build
// time. These are the latin-subset variable woff2 files (73 KB combined, both
// SIL Open Font License), committed so builds need no network at all.
const inter = localFont({
  src: "../assets/fonts/Inter-Variable-latin.woff2",
  variable: "--font-inter",
  weight: "100 900",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

const manrope = localFont({
  src: "../assets/fonts/Manrope-Variable-latin.woff2",
  variable: "--font-manrope",
  weight: "200 800",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "SafeMeds - Healthcare Management Platform",
  description:
    "Secure healthcare management platform with role-based access for clients and pharmacies",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "SafeMeds",
    statusBarStyle: "default",
  },
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    { rel: "apple-touch-icon", url: "/icons/apple-touch-icon.png" },
  ],
};

export const viewport: Viewport = {
  // viewportFit: cover lets the installed app draw into the safe areas rather
  // than sitting in letterboxed bars on notched phones.
  viewportFit: "cover",
  themeColor: [
    // Medical teal / dark navy, matching the SafeMeds Vital palette.
    { media: "(prefers-color-scheme: light)", color: "#0b5e4d" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

// Runs before first paint. Deliberately does no gate logic — it only records
// two things the server cannot know, so the CSS in globals.css can hide the
// install overlay for users who already installed or dismissed it. Keeping the
// decision rules out of here avoids maintaining a second copy of them.
const PRE_PAINT_SCRIPT = `(function(){try{var d=document.documentElement;
var s=(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)||window.navigator.standalone===true;
d.dataset.displayMode=s?'standalone':'browser';
if(sessionStorage.getItem('safemeds:pwa-install-bypassed')==='1'){d.dataset.pwaBypass='1';}
}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read server-side so the install overlay is present in the initial HTML for
  // mobile visitors, rather than popping in after hydration.
  const userAgent = (await headers()).get("user-agent") ?? "";
  // Resolved here so the client never has to fetch it before it can render
  // a guarded page. See SessionProvider for why this matters.
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PRE_PAINT_SCRIPT }} />
      </head>
      <body className={`${inter.variable} ${manrope.variable} antialiased`}>
        <ThemeProvider>
          <SessionProvider session={session}>
            <NotificationProvider>
              <OnboardingProvider>
                <NavButtons />
                {/* Global theme toggle — available on every page */}
                <div className="fixed bottom-4 right-3 z-[60] print:hidden">
                  <ThemeToggle variant="icon" size="sm" />
                </div>
                <InstallGate userAgent={userAgent}>{children}</InstallGate>
                <ServiceWorkerRegistrar />
                <OnboardingWizard />
              </OnboardingProvider>
            </NotificationProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
