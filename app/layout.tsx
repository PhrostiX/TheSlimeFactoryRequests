import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FooterBar from "./components/FooterBar";
import ToastHost from "./components/ToastHost";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Slime Requests",
  description: "Geometry Dash Level Request Tracker",
  icons: {
    icon: "/tabicon.png",
    shortcut: "/tabicon.png",
    apple: "/tabicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="layoutRoot">
          <ToastHost />
          {children}
          <FooterBar />
        </div>
      </body>
    </html>
  );
}
