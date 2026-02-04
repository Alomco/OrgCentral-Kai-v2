import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { DevelopmentSecurityWidget } from "@/components/dev/DevelopmentSecurityWidget";
import { DevelopmentToolbar, DevelopmentToolbarProvider } from "@/components/dev/toolbar";
import { TenantThemeRegistry } from "@/components/theme/tenant-theme-registry";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { UiStyleProvider } from "@/components/theme/ui-style-provider";
import { Providers } from "./providers";
import motionStyles from "@/styles/motion/view-transitions.module.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "OrgCentral",
    template: "%s | OrgCentral",
  },
  description: "Unified organization management for HR, operations, and compliance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased ${motionStyles.motionRoot}`}
        suppressHydrationWarning
      >
        <Providers>
          <ThemeProvider>
            <UiStyleProvider>
              <DevelopmentToolbarProvider>
                {process.env.NODE_ENV === "development" ? (
                  <>
                    <DevelopmentSecurityWidget />
                    <DevelopmentToolbar />
                  </>
                ) : null}
                <TenantThemeRegistry orgId={null}>{children}</TenantThemeRegistry>
              </DevelopmentToolbarProvider>
            </UiStyleProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}

