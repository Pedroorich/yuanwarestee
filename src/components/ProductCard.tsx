"use client";

import React from "react";
import { PublicProduct } from "@/types";
import { Lock, Unlock, ExternalLink, PackagePlus, Eye } from "lucide-react";

interface ProductCardProps {
  product: PublicProduct;
  isLocked: boolean;
  isVip: boolean;
  isUnlockedToday?: boolean;
  onOpenProduct: (product: PublicProduct) => void;
  onAccessLink: (product: PublicProduct) => void;
  onAddToDeclaration: (product: PublicProduct) => void;
}

export default function ProductCard({
  product,
  isLocked,
  isVip,
  isUnlockedToday = false,
  onOpenProduct,
  onAccessLink,
  onAddToDeclaration,
}: ProductCardProps) {
  // Approximate BRL conversion (1 CNY ≈ 0.80 BRL depending on rate)
  const estBrl = Math.round(product.priceCny * 0.82);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/60 hover:border-zinc-700 transition-all duration-300 hover:shadow-xl hover:shadow-black/60">
      
      {/* Image Showcase Container */}
      <div 
        onClick={() => onOpenProduct(product)}
        className="relative aspect-square w-full overflow-hidden bg-zinc-950 cursor-pointer"
      >
        <img
          src={product.images[0] || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800"}
          alt={product.title}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Dark subtle gradient on bottom of image */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-black/20" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
          <span className="rounded-md bg-zinc-900/90 border border-zinc-700/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-300 backdrop-blur-md">
            {product.category}
          </span>
          {product.tags?.[0] && (
            <span className="rounded-md bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-300 backdrop-blur-md">
              {product.tags[0]}
            </span>
          )}
        </div>

        {/* Lock Overlay on Image if Locked */}
        {isLocked && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/65 backdrop-blur-[2px] p-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900/90 border border-amber-500/50 text-amber-400 shadow-lg">
              <Lock className="h-6 w-6" />
            </div>
            <span className="mt-2 text-xs font-bold text-white uppercase tracking-wider">
              Link Bloqueado
            </span>
            <span className="text-[10px] text-zinc-300 mt-0.5">
              Cota diária de 1 link atingida
            </span>
            <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/40">
              Clique para Desbloquear VIP
            </span>
          </div>
        )}

        {/* Quick View Button */}
        <div className="absolute bottom-2.5 right-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenProduct(product);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900/90 border border-zinc-700 text-zinc-200 hover:text-white hover:bg-zinc-800 transition"
            title="Ver Detalhes"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Product Information Body */}
      <div className="flex flex-1 flex-col p-4">
        <h3 
          onClick={() => onOpenProduct(product)}
          className="text-sm font-semibold text-zinc-100 line-clamp-1 hover:text-amber-400 cursor-pointer transition-colors"
          title={product.title}
        >
          {product.title}
        </h3>

        {/* Price Tag in Yuan (¥) and Approx BRL */}
        <div className="mt-2 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-bold text-amber-400">¥</span>
            <span className="text-xl font-black tracking-tight text-white">
              {product.priceCny}
            </span>
            <span className="text-[10px] text-zinc-400 font-normal">
              Yuan
            </span>
          </div>
          <span className="text-[11px] font-medium text-zinc-400">
            ~R$ {estBrl}
          </span>
        </div>

        {/* Action Controls */}
        <div className="mt-4 flex items-center gap-2 pt-2 border-t border-zinc-800/70">
          
          {/* Main Action: Access Chinese Supplier Link */}
          <button
            onClick={() => onAccessLink(product)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 px-3 text-xs font-bold uppercase tracking-wider transition-all ${
              isLocked
                ? "bg-red-950/40 text-amber-400 hover:bg-red-900/50 border border-amber-500/40 shadow-sm"
                : isUnlockedToday
                ? "bg-emerald-600/90 text-white hover:bg-emerald-500 border border-emerald-400/40 shadow-md shadow-emerald-600/20"
                : isVip
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600 shadow-md shadow-red-600/25 border border-red-500/40"
                : "bg-red-600 text-white hover:bg-red-500 shadow-md shadow-red-600/20"
            }`}
          >
            {isLocked ? (
              <>
                <Lock className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-amber-400">Desbloquear VIP</span>
              </>
            ) : isUnlockedToday ? (
              <>
                <Unlock className="h-3.5 w-3.5 text-white" />
                <span>Ver Link Liberado</span>
              </>
            ) : isVip ? (
              <>
                <Unlock className="h-3.5 w-3.5 text-amber-300" />
                <span>Link Fornecedor</span>
              </>
            ) : (
              <>
                <ExternalLink className="h-3.5 w-3.5 text-amber-300" />
                <span>Pegar Link (1/dia)</span>
              </>
            )}
          </button>

          {/* Declaration Cart Button (Roadmap) */}
          <button
            onClick={() => onAddToDeclaration(product)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-white transition-colors"
            title="Adicionar ao Carrinho de Declarações"
          >
            <PackagePlus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
