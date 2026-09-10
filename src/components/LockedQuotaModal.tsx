"use client";

import React from "react";
import { Lock, Crown, Clock, X, CheckCircle2, ArrowRight } from "lucide-react";
import { VIP_CHECKOUT_URL } from "@/lib/constants";

interface LockedQuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  hoursRemaining?: number;
  onOpenCheckout?: () => void;
}

export default function LockedQuotaModal({
  isOpen,
  onClose,
  hoursRemaining = 24,
  onOpenCheckout,
}: LockedQuotaModalProps) {
  if (!isOpen) return null;

  const handleCheckout = () => {
    if (onOpenCheckout) {
      onOpenCheckout();
    } else {
      window.open(VIP_CHECKOUT_URL, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-700/80 bg-zinc-950 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Lock Icon Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-inner">
            <Lock className="h-8 w-8" />
          </div>

          <h3 className="mt-4 text-xl font-black text-white uppercase tracking-tight">
            Limite Diário de Links Atingido
          </h3>

          {/* Time Remaining Pill */}
          <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-zinc-900 border border-zinc-800 px-3 py-1 text-xs text-zinc-300 font-medium">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span>Próximo link gratuito em aprox. <strong>{hoursRemaining} horas</strong></span>
          </div>

          <p className="mt-3 text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xs">
            No plano gratuito você tem direito a abrir <strong>1 link de fornecedor por dia</strong>.
            Desbloqueie o acesso VIP para navegar e abrir <strong>quantos links quiser</strong> sem nenhuma restrição!
          </p>
        </div>

        {/* VIP Benefits Box */}
        <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3.5 text-xs text-zinc-300 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Acesso <strong>ilimitado</strong> a todos os links da vitrine</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Fornecedores diretos Weidian, Taobao e 1688</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Suporte para declaração aduaneira e calculadora</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            onClick={handleCheckout}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 p-4 text-xs font-black uppercase tracking-wider text-white hover:brightness-110 transition shadow-xl shadow-red-600/30 border border-red-500/40"
          >
            <Crown className="h-4 w-4 text-amber-400" />
            <span>Desbloquear Acesso VIP Ilimitado</span>
            <ArrowRight className="h-4 w-4 text-amber-400" />
          </button>

          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-800 py-2.5 text-xs font-medium text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition"
          >
            Entendido, aguardar 24 horas
          </button>
        </div>
      </div>
    </div>
  );
}
