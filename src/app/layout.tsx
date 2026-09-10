import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "YUANWARE | Catálogo Exclusivo de Roupas & Fornecedores da China",
  description: "Acesse os melhores links e fornecedores de streetwear e vestuário importados da China com preços originais em Yuan (¥).",
  icons: {
    icon: "/logo.jpg",
    shortcut: "/logo.jpg",
    apple: "/logo.jpg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-[#09090b] text-zinc-100 antialiased selection:bg-amber-500/30 selection:text-amber-200">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
