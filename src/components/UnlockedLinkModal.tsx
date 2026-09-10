"use client";

import React, { useState } from "react";
import { ExternalLink, Copy, Check, X, ShieldCheck, Crown, ArrowUpRight } from "lucide-react";
import { VIP_CHECKOUT_URL } from "@/lib/constants";

interface UnlockedLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  productTitle: string;
  targetUrl: string;
  productImage?: string;
  isAlreadyUnlocked?: boolean;
  isVip?: boolean;
  onOpenVipModal?: () => void;
}

export default function UnlockedLinkModal({
  isOpen,
  onClose,
  productTitle,
  targetUrl,
  productImage,
  isAlreadyUnlocked = false,
  isVip = false,
  onOpenVipModal,
}: UnlockedLinkModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-emerald-500/40 bg-zinc-950 p-6 shadow-2xl shadow-emerald-500/10"
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

        {/* Header Badge */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">
              {isVip
                ? "Link Fornecedor VIP Liberado"
                : isAlreadyUnlocked
                ? "Link Liberado (Já Desbloqueado Hoje)"
                : "Seu 1 Link Gratuito foi Liberado!"}
            </span>
            <span className="text-[11px] text-zinc-400">
              {isVip
                ? "Acesso ilimitado concedido pelo seu plano VIP"
                : "Cota de 1 link a cada 24 horas utilizada com sucesso"}
            </span>
          </div>
        </div>

        {/* Product Card Showcase */}
        <div className="mt-4 flex items-center gap-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
          {productImage && (
            <img
              src={productImage}
              alt=""
              className="h-14 w-14 rounded-lg object-cover bg-zinc-950 border border-zinc-800 shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-zinc-100 line-clamp-1">
              {productTitle}
            </h4>
            <p className="text-[11px] text-zinc-400 mt-0.5 font-mono truncate">
              {targetUrl}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 space-y-2.5">
          {/* Direct External Link - Never blocked by browsers! */}
          <a
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 py-3.5 px-4 text-xs font-black uppercase tracking-wider text-white hover:brightness-110 transition shadow-xl shadow-red-600/30 border border-red-500/40 text-center"
          >
            <span>Acessar Fornecedor na China (Taobao / Weidian)</span>
            <ExternalLink className="h-4 w-4 text-amber-300" />
          </a>

          {/* Copy Link Button */}
          <button
            onClick={handleCopy}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/90 py-3 px-4 text-xs font-bold text-zinc-200 hover:bg-zinc-800 hover:text-white transition shadow-sm"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-400">Link Copiado para a Área de Transferência!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-amber-400" />
                <span>Copiar Link Direto (Para colar no CSSBUY / Sugargoo)</span>
              </>
            )}
          </button>
        </div>

        {/* Quota reminder and VIP CTA */}
        {!isVip && (
          <div className="mt-5 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5 text-xs text-zinc-400 space-y-2">
            <p className="text-[11px] leading-relaxed">
              💡 <strong>Dica:</strong> Você pode continuar acessando este mesmo link durante as próximas 24 horas. Para liberar <strong>todos os outros links</strong> da vitrine imediatamente, ative o VIP.
            </p>
            <a
              href={VIP_CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition"
            >
              <Crown className="h-3.5 w-3.5" />
              <span>Quero Acesso VIP Ilimitado a Mais de 500 Links</span>
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
