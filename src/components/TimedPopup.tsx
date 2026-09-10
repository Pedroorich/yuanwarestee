"use client";

import React, { useState, useEffect } from "react";
import { PopupConfig } from "@/types";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { VIP_CHECKOUT_URL } from "@/lib/constants";

interface TimedPopupProps {
  config: PopupConfig;
  onOpenVipModal?: () => void;
}

export default function TimedPopup({ config, onOpenVipModal }: TimedPopupProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!config.active) return;

    // Don't show repeatedly in the same browser session if dismissed
    const alreadyDismissed = sessionStorage.getItem("yw_popup_dismissed");
    if (alreadyDismissed) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
    }, Math.max(2, config.delaySeconds || 10) * 1000);

    return () => clearTimeout(timer);
  }, [config.active, config.delaySeconds]);

  const handleDismiss = () => {
    setIsOpen(false);
    sessionStorage.setItem("yw_popup_dismissed", "true");
  };

  const handleCta = () => {
    handleDismiss();
    const url = config.ctaUrl && config.ctaUrl.startsWith("http") ? config.ctaUrl : VIP_CHECKOUT_URL;
    window.open(url, "_blank");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-700/90 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3.5 right-3.5 z-20 flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Optional Header Image */}
        {config.imageUrl && (
          <div className="relative h-44 w-full overflow-hidden bg-zinc-900">
            <img
              src={config.imageUrl}
              alt=""
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Oportunidade Exclusiva</span>
          </div>

          <h3 className="text-xl font-black text-white leading-tight">
            {config.title}
          </h3>

          <p className="mt-2.5 text-xs sm:text-sm text-zinc-300 leading-relaxed">
            {config.description}
          </p>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handleCta}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 py-3.5 px-4 text-xs font-black uppercase tracking-wider text-white hover:brightness-110 transition shadow-xl shadow-red-600/30 border border-red-500/40"
            >
              <span>{config.ctaText || "Acessar Agora"}</span>
              <ArrowRight className="h-4 w-4 text-amber-400" />
            </button>

            <button
              onClick={handleDismiss}
              className="rounded-xl border border-zinc-800 py-3 px-4 text-xs font-medium text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition"
            >
              Depois
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
