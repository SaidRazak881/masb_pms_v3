import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MIMOS Academy PMS",
  description: "MIMOS Academy Program Management System",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
