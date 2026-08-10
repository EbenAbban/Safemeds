import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";
import InstallGate from "@/components/pwa/InstallGate";
import ServiceWorkerRegistrar from "@/components/pwa/ServiceWorkerRegistrar";
import SessionProvider from "@/components/Auth/SessionProvider";
import { ThemeProvider } from "@/context/ThemeContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { OnboardingProvider } from "@/context/OnboardingContext";
import OnboardingWizard from "@/components/Common/OnboardingWizard";
import NavButtons from "@/components/Common/NavButtons";
import ThemeToggle from "@/components/Common/ThemeToggle";

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
    { media: "(prefers-color-scheme: light)", color: "#2563eb" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
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

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PRE_PAINT_SCRIPT }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <SessionProvider>
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
