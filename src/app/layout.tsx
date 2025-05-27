import { Provider } from "@/components/ui/provider";
import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "./ClientLayout";
import { GoogleOAuthProvider } from "@react-oauth/google";

export const metadata: Metadata = {
  title: "Anon quest",
  description: "Anonymous surveys",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <GoogleOAuthProvider clientId="663573601235-e50dqh9g9ipc8shq28magdah1o8i54f8.apps.googleusercontent.com">
          <Provider>
            <ClientLayout>{children}</ClientLayout>
          </Provider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
