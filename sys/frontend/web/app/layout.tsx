import type { Metadata } from "next";
import StoreProvider from "@/store/StoreProvider";
import AuthInitializer from "./AuthInitializer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mobile Dev News",
  description: "Latest mobile development news and articles",
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
          <AuthInitializer />
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
