import type { Metadata } from "next";
import { SonnerToaster } from "@/components/sonner-toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { getSettings } from "@/lib/settings";
import { startHealthScheduler } from "@/lib/scheduler";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grid",
  description: "A self-hosted grid with web-based configuration."
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_RUNTIME !== "edge") {
    startHealthScheduler();
  }

  const settings = await getSettings();

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider defaultTheme={settings.themeDefault}>
          {children}
          <SonnerToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
