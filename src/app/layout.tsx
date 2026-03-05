import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Attention Mechanisms — Visually Explained",
  description: "Interactive reference for attention mechanisms used in modern transformers and LLMs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
