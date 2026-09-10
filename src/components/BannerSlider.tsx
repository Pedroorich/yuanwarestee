"use client";

import React, { useState, useEffect } from "react";
import { Banner } from "@/types";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { VIP_CHECKOUT_URL } from "@/lib/constants";

interface BannerSliderProps {
  banners: Banner[];
  onOpenVipModal?: () => void;
}

export default function BannerSlider({ banners, onOpenVipModal }: BannerSliderProps) {
  const activeBanners = banners.filter((b) => b.active);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  if (activeBanners.length === 0) return null;

  const current = activeBanners[currentIndex];

  const handleCta = () => {
    if (current.targetUrl === "#vip") {
      window.open(VIP_CHECKOUT_URL, "_blank");
    } else if (current.targetUrl?.startsWith("http")) {
      window.open(current.targetUrl, "_blank");
    } else if (current.targetUrl?.startsWith("#")) {
      const el = document.querySelector(current.targetUrl);
      el?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
      <div className="relative h-64 sm:h-80 md:h-96 w-full">
        {/* Background Image with Dark Vignette */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out"
          style={{ backgroundImage: `url(${current.imageUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
        </div>

        {/* Banner Content */}
        <div className="relative z-10 flex h-full max-w-2xl flex-col justify-end p-6 sm:p-10">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-amber-400 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            Curadoria Direta de Fábricas
          </span>
          <h2 className="mt-2 text-2xl sm:text-4xl font-black tracking-tight text-white uppercase leading-tight">
            {current.title}
          </h2>
          {current.subtitle && (
            <p className="mt-2 text-xs sm:text-sm text-zinc-300 max-w-lg leading-relaxed">
              {current.subtitle}
            </p>
          )}

          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={handleCta}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white transition-all shadow-xl shadow-red-600/30 border border-red-500/40"
            >
              <span>Explorar Ofertas</span>
              <ArrowUpRight className="h-4 w-4 text-amber-400" />
            </button>
            <a
              href={VIP_CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-zinc-950/80 px-4 py-2.5 text-xs font-bold text-amber-400 hover:bg-amber-400 hover:text-black transition-colors backdrop-blur-sm"
            >
              Acesso VIP
            </a>
          </div>
        </div>

        {/* Navigation Arrows */}
        {activeBanners.length > 1 && (
          <div className="absolute bottom-6 right-6 z-10 flex items-center gap-2">
            <button
              onClick={() =>
                setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length)
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800 transition-colors"
              aria-label="Banner anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % activeBanners.length)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800 transition-colors"
              aria-label="Próximo banner"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Slide Indicators */}
      {activeBanners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
          {activeBanners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1 rounded-full transition-all ${
                idx === currentIndex ? "w-6 bg-amber-400" : "w-2 bg-zinc-600"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
