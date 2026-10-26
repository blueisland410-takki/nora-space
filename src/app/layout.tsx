import type { Metadata } from "next";
import "./globals.css";
import "./ui-refresh.css";

export const metadata: Metadata = {
  title: "NORA SPACE",
  description: "Your personal operating system.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
