"use client";

import React, { useState } from "react";
import { PublicProduct } from "@/types";
import { 
  X, 
  Lock, 
  ExternalLink, 
  PackagePlus, 
  FileText, 
  Scale, 
  Tag, 
  ShieldCheck,
  Check
} from "lucide-react";

interface ProductModalProps {
  product: PublicProduct | null;
  isOpen: boolean;
  onClose: () => void;
  isLocked: boolean;
  isVip: boolean;
  isUnlockedToday?: boolean;
  onAccessLink: (product: PublicProduct) => void;
  onAddToDeclaration: (product: PublicProduct) => void;
  onDirectDeclaration: (product: PublicProduct) => void;
}

export default function ProductModal({
  product,
  isOpen,
  onClose,
  isLocked,
  isVip,
  isUnlockedToday = false,
  onAccessLink,
  onAddToDeclaration,
  onDirectDeclaration,
}: ProductModalProps) {
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [addedNotice, setAddedNotice] = useState(false);

  if (!isOpen || !product) return null;

  const handleAdd = () => {
    onAddToDeclaration(product);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  const estBrl = Math.round(product.priceCny * 0.82);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative flex flex-col md:flex-row w-full max-w-4xl max-h-[90vh] overflow-y-auto md:overflow-hidden rounded-2xl border border-zinc-700/80 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900/80 text-zinc-300 hover:text-white hover:bg-zinc-800 transition border border-zinc-700"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Left Column: Image Gallery */}
        <div className="flex flex-col md:w-1/2 p-6 bg-zinc-900/40 border-b md:border-b-0 md:border-r border-zinc-800">
          <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-zinc-950 border border-zinc-800">
            <img
              src={product.images[selectedImageIdx] || product.images[0]}
              alt={product.title}
              className="h-full w-full object-cover object-center"
            />

            {isLocked && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center">
                <Lock className="h-10 w-10 text-amber-400 mb-2" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Link Protegido
                </span>
                <span className="text-[11px] text-zinc-300 mt-1">
                  Limite diário de 1 link atingido
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    selectedImageIdx === idx ? "border-amber-400" : "border-zinc-800 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Information & Action Options */}
        <div className="flex flex-col md:w-1/2 p-6 overflow-y-auto">
          {/* Header Badges */}
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-zinc-800 px-2.5 py-0.5 text-xs font-semibold text-zinc-300">
              {product.category}
            </span>
            <span className="text-xs text-zinc-500">•</span>
            <span className="text-xs text-emerald-400 font-medium">
              Fornecedor Verificado 🇨🇳
            </span>
          </div>

          <h2 className="mt-2 text-xl sm:text-2xl font-black text-white leading-snug">
            {product.title}
          </h2>

          {/* Price Tag */}
          <div className="mt-4 flex items-baseline gap-3 p-3 rounded-xl bg-zinc-900/90 border border-zinc-800/80">
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-amber-400">¥</span>
              <span className="text-3xl font-black text-white">{product.priceCny}</span>
              <span className="text-xs text-zinc-400 ml-1">Yuan</span>
            </div>
            <div className="text-xs text-zinc-400">
              Aprox. <strong className="text-zinc-200">R$ {estBrl}</strong> (ou ${product.estimatedUsd || Math.round(product.priceCny / 7.1)} USD)
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <p className="mt-4 text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Specs & Customs Info (Roadmap preparation) */}
          <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80 p-2.5">
              <Scale className="h-4 w-4 text-zinc-400" />
              <div>
                <span className="text-[10px] text-zinc-500 block">Peso Estimado</span>
                <span className="font-semibold text-zinc-200">{product.estimatedWeightGrams || 500}g</span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80 p-2.5">
              <Tag className="h-4 w-4 text-zinc-400" />
              <div>
                <span className="text-[10px] text-zinc-500 block">Declaração Aduaneira</span>
                <span className="font-semibold text-zinc-200 truncate block max-w-[120px]">
                  {product.declarationCategoryPt || product.category}
                </span>
              </div>
            </div>
          </div>

          {/* 3 Core Action Triggers Requested by User */}
          <div className="mt-6 flex flex-col gap-2.5 border-t border-zinc-800 pt-5">
            
            {/* Action 1: Pegar link do produto */}
            <button
              onClick={() => onAccessLink(product)}
              className={`flex items-center justify-center gap-2 rounded-xl p-3.5 text-xs font-black uppercase tracking-wider transition ${
                isLocked
                  ? "bg-red-950/50 text-amber-400 border border-amber-500/40 hover:bg-red-900/60 shadow-md"
                  : isUnlockedToday
                  ? "bg-emerald-600/90 text-white hover:bg-emerald-500 border border-emerald-400/40 shadow-xl shadow-emerald-600/30"
                  : "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600 shadow-xl shadow-red-600/30 border border-red-500/40"
              }`}
            >
              {isLocked ? (
                <>
                  <Lock className="h-4 w-4 text-amber-400" />
                  <span>Pegar Link do Produto (Desbloquear VIP)</span>
                </>
              ) : isUnlockedToday ? (
                <>
                  <ExternalLink className="h-4 w-4 text-white" />
                  <span>Ver Link Liberado Hoje (Taobao / Weidian)</span>
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 text-amber-300" />
                  <span>Pegar Link do Fornecedor {isVip ? "(VIP)" : "(1 Diário)"}</span>
                </>
              )}
            </button>

            {/* Action 2: Fazer declaração para esse produto */}
            <button
              onClick={() => onDirectDeclaration(product)}
              className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/90 p-3 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition"
            >
              {isVip ? (
                <>
                  <FileText className="h-4 w-4 text-amber-400" />
                  <span>Fazer Declaração Para Esse Produto (VIP)</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 text-zinc-400" />
                  <span>Fazer Declaração (Exclusivo VIP)</span>
                </>
              )}
            </button>

            {/* Action 3: Adicionar no carrinho de Declarações */}
            <button
              onClick={handleAdd}
              className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition ${
                addedNotice 
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" 
                  : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700 hover:text-white"
              }`}
            >
              {addedNotice ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Adicionado ao Carrinho de Declarações!</span>
                </>
              ) : isVip ? (
                <>
                  <PackagePlus className="h-4 w-4 text-amber-400" />
                  <span>Adicionar no Carrinho de Declarações</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 text-zinc-500" />
                  <span>Carrinho de Declarações (Exclusivo VIP)</span>
                </>
              )}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
