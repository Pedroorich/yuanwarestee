"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Trash2, ArrowLeft } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin Page Error:", error);
  }, [error]);

  const handleClearCacheAndReload = () => {
    try {
      localStorage.removeItem("yw_users_list");
      localStorage.removeItem("yw_products");
      localStorage.removeItem("yw_banners");
      localStorage.removeItem("yw_popup");
      localStorage.removeItem("yw_mock_user");
    } catch (e) {
      console.error(e);
    }
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#09090c] text-zinc-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-4 shadow-xl">
        <AlertTriangle className="h-8 w-8" />
      </div>

      <h1 className="text-2xl font-black text-white uppercase tracking-tight">
        Aviso no Painel Administrativo
      </h1>

      <p className="mt-2 text-sm text-zinc-400 max-w-lg">
        Ocorreu uma inconsistência temporária nos dados do navegador ou do Firestore. Não se preocupe, seus dados estão salvos na nuvem.
      </p>

      {error?.message && (
        <div className="mt-4 max-w-md w-full bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 text-left">
          <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">
            Detalhes Técnicos:
          </span>
          <code className="text-xs text-rose-400 font-mono break-words block">
            {error.message}
          </code>
        </div>
      )}

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => reset()}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 px-6 py-3.5 text-xs font-black uppercase tracking-wider text-white transition shadow-xl shadow-red-600/30 border border-red-500/40"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Tentar Novamente</span>
        </button>

        <button
          onClick={handleClearCacheAndReload}
          className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-5 py-3 text-xs font-bold uppercase tracking-wider text-amber-300 transition"
        >
          <Trash2 className="h-4 w-4 text-amber-400" />
          <span>Limpar Cache Local e Recarregar</span>
        </button>

        <Link
          href="/"
          className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 py-3 px-4 text-xs font-medium text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar à Vitrine</span>
        </Link>
      </div>
    </div>
  );
}
