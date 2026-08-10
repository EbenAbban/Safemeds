import type { Metadata } from "next";
import "./globals.css";
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
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
                {children}
                <OnboardingWizard />
              </OnboardingProvider>
            </NotificationProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
