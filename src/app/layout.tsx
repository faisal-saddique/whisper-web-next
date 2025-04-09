import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Whisper Web - Next.js",
  description: "ML-powered speech recognition directly in your browser",
  // Add CSP for external script from jsdelivr (AudioMotion)
  other: {
    "script-src": "'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex justify-center items-center">
          <div className="container flex flex-col justify-center items-center max-w-4xl mx-auto px-4">
            {children}
            <div className="mt-8 text-center text-sm text-gray-500">
              Made with{" "}
              <a
                className="underline"
                href="https://github.com/xenova/transformers.js"
                target="_blank"
                rel="noopener noreferrer"
              >
                🤗 Transformers.js
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}