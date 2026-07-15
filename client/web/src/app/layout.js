// src/app/layout.js
import "./globals.css";
import { APP_CONFIG } from "@/lib/constants";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: `${APP_CONFIG.nameFull} · Admin Panel`,
  description: APP_CONFIG.tagline,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily:
                "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
              fontSize: "13px",
              fontWeight: "500",
              borderRadius: "12px",
              padding: "12px 16px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              border: "1px solid #E5E7EB",
              color: "#111827",
              background: "white",
              maxWidth: "380px",
            },
            success: {
              iconTheme: {
                primary: "#059669",
                secondary: "white",
              },
              style: {
                border: "1px solid #A7F3D0",
                background: "white",
              },
            },
            error: {
              iconTheme: {
                primary: "#DC2626",
                secondary: "white",
              },
              style: {
                border: "1px solid #FECACA",
                background: "white",
              },
            },
          }}
        />
      </body>
    </html>
  );
}