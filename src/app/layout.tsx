
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ConnectionStatus } from "@/components/errors/connection-status";
import { UnsupportedDeviceScreen } from "@/components/errors/unsupported-device-screen";
import { AppApolloProvider } from "@/components/providers/apollo-provider";
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
  title: "CV Builder",
  description: "Create and manage your professional CVs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="min-[768px]:hidden">
          <UnsupportedDeviceScreen />
        </div>
        <div className="hidden min-[768px]:contents">
          <ConnectionStatus>
            <AppApolloProvider>{children}</AppApolloProvider>
          </ConnectionStatus>
        </div>
      </body>
    </html>
  );
}
