import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProgressBar from "@/components/ProgressBar";
import ScrollToTop from "@/components/ScrollToTop";
import LoadingScreen from "@/components/LoadingScreen";
import ScrollReset from "@/components/ScrollReset";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { LoadingProvider } from "@/components/LoadingProvider";
import ContentWrapper from "@/components/ContentWrapper";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import WhatsAppWidget from "@/components/WhatsAppWidget";

export const metadata: Metadata = {
  title: "Batra Technologies | Luxury Electronics",
  description: "Curated premium electronics for the discerning few. Batra Technologies — where technology meets luxury.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-dark-950 min-h-screen flex flex-col pb-20 lg:pb-0">
        <LoadingProvider>
          <LoadingScreen />
          <ContentWrapper>
            <ScrollReset />
            <CartProvider>
              <AuthProvider>
                <AnalyticsProvider>
                <ProgressBar />
                <Navbar />
                <main className="flex-1">{children}</main>
                <Footer />
                <ScrollToTop />
                <WhatsAppWidget />
                </AnalyticsProvider>
              </AuthProvider>
            </CartProvider>
          </ContentWrapper>
        </LoadingProvider>
      </body>
    </html>
  );
}
