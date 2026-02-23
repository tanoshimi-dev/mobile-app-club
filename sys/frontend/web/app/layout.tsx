import type { Metadata } from "next";
import Link from "next/link";
import StoreProvider from "@/store/StoreProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mobile Dev News",
  description: "Latest mobile development news",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          <nav>
            <Link href="/">Home</Link>
            {" | "}
            <Link href="/categories">Categories</Link>
            {" | "}
            <Link href="/saved">Saved</Link>
            {" | "}
            <Link href="/profile">Profile</Link>
          </nav>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
