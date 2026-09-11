"use client";

import React, { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import BannerSlider from "@/components/BannerSlider";
import ProductCard from "@/components/ProductCard";
import ProductModal from "@/components/ProductModal";
import LockedQuotaModal from "@/components/LockedQuotaModal";
import UnlockedLinkModal from "@/components/UnlockedLinkModal";
import TimedPopup from "@/components/TimedPopup";
import DeclarationDrawer from "@/components/DeclarationDrawer";
import { useAuth } from "@/lib/auth-context";
import { 
  INITIAL_PRODUCTS, 
  INITIAL_BANNERS, 
  DEFAULT_POPUP, 
  CATEGORIES 
} from "@/lib/mock-data";
import { VIP_CHECKOUT_URL } from "@/lib/constants";
import { 
  getBannersFromFirestore, 
  getProductsFromFirestore, 
  getPopupFromFirestore,
  subscribeToBanners,
  subscribeToProducts
} from "@/lib/firestore-sync";
import { PublicProduct, Product, DeclarationCartItem, Banner, PopupConfig } from "@/types";
import { 
  Search, 
  Sparkles, 
  Lock, 
  Crown, 
  SlidersHorizontal,
  Flame,
  ShieldAlert,
  ArrowUpRight
} from "lucide-react";

export default function Home() {
  const { 
    user, 
    profile, 
    isAdmin, 
    isVip, 
    isFree, 
    dailyAccessUsed, 
    hoursRemaining,
    recordLinkAccess,
    loginWithGoogle,
    refreshProfile 
  } = useAuth();

  // Catalog Data
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [banners, setBanners] = useState<Banner[]>(INITIAL_BANNERS);
  const [popupConfig, setPopupConfig] = useState<PopupConfig>(DEFAULT_POPUP);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  // Modals & Drawers
  const [activeModalProduct, setActiveModalProduct] = useState<PublicProduct | null>(null);
  const [lockedModalOpen, setLockedModalOpen] = useState(false);
  const [unlockedModalData, setUnlockedModalData] = useState<{
    isOpen: boolean;
    productTitle: string;
    targetUrl: string;
    productImage?: string;
    isAlreadyUnlocked?: boolean;
  }>({
    isOpen: false,
    productTitle: "",
    targetUrl: "",
    productImage: "",
    isAlreadyUnlocked: false,
  });
  const [declarationDrawerOpen, setDeclarationDrawerOpen] = useState(false);
  const [declarationItems, setDeclarationItems] = useState<DeclarationCartItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load custom admin-saved products & settings from localStorage and Firestore
  useEffect(() => {
    // 1. Initial instant load from localStorage
    const savedProducts = localStorage.getItem("yw_products");
    if (savedProducts) {
      try {
        setProducts(JSON.parse(savedProducts));
      } catch (e) {
        console.error(e);
      }
    }

    const savedBanners = localStorage.getItem("yw_banners");
    if (savedBanners) {
      try {
        setBanners(JSON.parse(savedBanners));
      } catch (e) {
        console.error(e);
      }
    }

    const savedPopup = localStorage.getItem("yw_popup");
    if (savedPopup) {
      try {
        setPopupConfig(JSON.parse(savedPopup));
      } catch (e) {
        console.error(e);
      }
    }

    const savedCart = localStorage.getItem("yw_declaration_cart");
    if (savedCart) {
      try {
        setDeclarationItems(JSON.parse(savedCart));
      } catch (e) {
        console.error(e);
      }
    }

    // 2. Real-time subscriptions to cloud banners and products (instant live sync)
    const unsubBanners = subscribeToBanners((cloudBanners) => {
      if (cloudBanners && cloudBanners.length > 0) {
        setBanners(cloudBanners);
        localStorage.setItem("yw_banners", JSON.stringify(cloudBanners));
      }
    });

    const unsubProducts = subscribeToProducts((cloudProducts) => {
      if (cloudProducts && cloudProducts.length > 0) {
        setProducts(cloudProducts);
        localStorage.setItem("yw_products", JSON.stringify(cloudProducts));
      }
    });

    getPopupFromFirestore().then((cloudPopup) => {
      if (cloudPopup) {
        setPopupConfig(cloudPopup);
        localStorage.setItem("yw_popup", JSON.stringify(cloudPopup));
      }
    }).catch(() => {});

    return () => {
      if (unsubBanners) unsubBanners();
      if (unsubProducts) unsubProducts();
    };
  }, []);

  // Save cart changes
  const updateCart = (newItems: DeclarationCartItem[]) => {
    setDeclarationItems(newItems);
    localStorage.setItem("yw_declaration_cart", JSON.stringify(newItems));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => p.active !== false)
      .filter((p) => {
        const matchesCategory =
          selectedCategory === "Todos" || p.category.toLowerCase() === selectedCategory.toLowerCase();
        const matchesSearch =
          !searchQuery.trim() ||
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
      });
  }, [products, selectedCategory, searchQuery]);

  // Check if a specific product was already unlocked today by this free user
  const isProductUnlockedToday = (productId: string) => {
    const localProduct = typeof window !== "undefined" && user?.uid
      ? localStorage.getItem(`yw_last_product_${user.uid}`)
      : null;
    const isMatching = profile?.lastAccessedProductId === productId || localProduct === productId;
    return Boolean(isFree && dailyAccessUsed && isMatching);
  };

  // Handle Accessing the Chinese Supplier Link
  const handleAccessLink = async (product: PublicProduct) => {
    // 1. Mandatory Google Authentication Check
    if (!user) {
      showToast("Faça login com sua conta Google para liberar o link do produto.");
      try {
        await loginWithGoogle();
      } catch (e) {
        return;
      }
      return;
    }

    const localProduct = typeof window !== "undefined" && user?.uid
      ? localStorage.getItem(`yw_last_product_${user.uid}`)
      : null;
    const isSameProduct = profile?.lastAccessedProductId === product.id || localProduct === product.id;

    // 2. If Free user and daily quota already spent on another product -> Show Locked Modal
    if (!isVip && dailyAccessUsed && !isSameProduct) {
      setLockedModalOpen(true);
      return;
    }

    // 3. Request Link via Secure Server-Side Endpoint
    try {
      const fullProduct = products.find((p) => p.id === product.id);
      const targetUrl = (fullProduct as any)?.targetUrl || (product as any)?.targetUrl || "";

      const res = await fetch(`/api/products/${product.id}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.uid,
          userEmail: user?.email,
          userRole: profile?.role || "free",
          lastLinkAccessAt: profile?.lastLinkAccessAt ?? null,
          lastAccessedProductId: profile?.lastAccessedProductId ?? null,
          targetUrl,
          productTitle: product.title,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.locked) {
        setLockedModalOpen(true);
        return;
      }

      // If free user just consumed daily quota, update profile and sync everywhere
      if (data.status === "FREE_QUOTA_USED") {
        await recordLinkAccess(product.id);
        showToast("✓ Link da China liberado! Sua cota de 1 link gratuito foi ativada.");
      }

      const finalUrl = data.targetUrl || targetUrl;

      // Display dedicated unlocked link modal with direct copy & button
      setUnlockedModalData({
        isOpen: true,
        productTitle: data.productTitle || product.title,
        targetUrl: finalUrl,
        productImage: product.images[0],
        isAlreadyUnlocked: data.status === "FREE_ALREADY_UNLOCKED",
      });

      // Also attempt opening in new tab
      if (finalUrl) {
        try {
          window.open(finalUrl, "_blank", "noopener,noreferrer");
        } catch (e) {}
      }
    } catch (err) {
      console.error(err);
      showToast("Erro ao carregar o link. Tente novamente.");
    }
  };

  // Cart & Declaration operations - Strictly VIP only
  const handleAddToDeclaration = (product: PublicProduct) => {
    if (!user) {
      showToast("Faça login com Google para acessar o sistema de declarações.");
      loginWithGoogle();
      return;
    }
    if (!isVip) {
      showToast("O sistema de declaração aduaneira é exclusivo para membros VIP.");
      setLockedModalOpen(true);
      return;
    }

    const existing = declarationItems.find((i) => i.product.id === product.id);
    let updated: DeclarationCartItem[];
    if (existing) {
      updated = declarationItems.map((i) =>
        i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
      );
    } else {
      updated = [
        ...declarationItems,
        {
          product,
          quantity: 1,
          customValueUsd: product.estimatedUsd || 15,
          weightGrams: product.estimatedWeightGrams || 500,
        },
      ];
    }
    updateCart(updated);
    showToast(`Adicionado ao Carrinho de Declarações: ${product.title}`);
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    const updated = declarationItems
      .map((i) => {
        if (i.product.id === productId) {
          const newQtd = i.quantity + delta;
          return newQtd > 0 ? { ...i, quantity: newQtd } : null;
        }
        return i;
      })
      .filter(Boolean) as DeclarationCartItem[];
    updateCart(updated);
  };

  const handleRemoveCartItem = (productId: string) => {
    updateCart(declarationItems.filter((i) => i.product.id !== productId));
  };

  const handleClearCart = () => {
    updateCart([]);
  };

  const handleDirectDeclaration = (product: PublicProduct) => {
    if (!user) {
      showToast("Faça login com Google para acessar o sistema de declarações.");
      loginWithGoogle();
      return;
    }
    if (!isVip) {
      showToast("O sistema de declaração aduaneira é exclusivo para membros VIP.");
      setLockedModalOpen(true);
      return;
    }
    handleAddToDeclaration(product);
    setActiveModalProduct(null);
    setDeclarationDrawerOpen(true);
  };

  // Determine if links should show locked state for the current viewer
  const isCurrentlyLocked = !isVip && dailyAccessUsed;

  return (
    <div className="min-h-screen bg-[#09090c] text-zinc-100 flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-zinc-950/95 px-4 py-3 text-xs font-semibold text-amber-300 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        onOpenDeclarationCart={() => setDeclarationDrawerOpen(true)}
        declarationCount={declarationItems.reduce((acc, i) => acc + i.quantity, 0)}
        onOpenVipModal={() => setLockedModalOpen(true)}
      />

      {/* Content Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Promotional Banner Section */}
        <BannerSlider
          banners={banners}
          onOpenVipModal={() => setLockedModalOpen(true)}
        />

        {/* Catalog Showcase Header & Controls */}
        <section id="vitrine" className="mt-10 sm:mt-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
                <Flame className="h-4 w-4" />
                <span>Vitrine de Fornecedores Diretos</span>
              </div>
              <h1 className="mt-1 text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                Catálogo Yuanware 2026
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-zinc-400">
                Produtos selecionados de fábricas da China (Taobao, Weidian e 1688) com valores em Yuan (¥).
              </p>
            </div>

            {/* Quota Status Box for Free Users */}
            <div className="flex items-center gap-3">
              {isVip ? (
                <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3.5 py-2 text-xs text-amber-400 font-bold">
                  <Crown className="h-4 w-4" />
                  <span>Acesso VIP Ilimitado Ativo</span>
                </div>
              ) : isCurrentlyLocked ? (
                <button
                  onClick={() => setLockedModalOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 px-3.5 py-2 text-xs text-rose-300 hover:bg-rose-500/20 transition"
                >
                  <Lock className="h-3.5 w-3.5 text-rose-400" />
                  <span>Cota Diária Esgotada ({hoursRemaining}h restantes)</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 text-xs text-emerald-400 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Você possui <strong>1 link gratuito</strong> disponível hoje</span>
                </div>
              )}
            </div>
          </div>

          {/* Search Bar & Category Filter Bar */}
          <div id="categorias" className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar por nome, marca ou categoria..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500/60 focus:outline-none transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Category Scrollable Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
                    selectedCategory === cat
                      ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-600/30 border border-red-500/40"
                      : "bg-zinc-900/90 text-zinc-400 hover:text-amber-300 border border-zinc-800/80 hover:border-zinc-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => {
              const unlocked = isProductUnlockedToday(product.id);
              const locked = !isVip && dailyAccessUsed && !unlocked;

              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  isLocked={locked}
                  isUnlockedToday={unlocked}
                  isVip={isVip}
                  onOpenProduct={(p) => setActiveModalProduct(p)}
                  onAccessLink={(p) => handleAccessLink(p)}
                  onAddToDeclaration={(p) => handleAddToDeclaration(p)}
                />
              );
            })}
          </div>

          {/* Empty Search Fallback */}
          {filteredProducts.length === 0 && (
            <div className="my-16 flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-zinc-800 bg-zinc-900/30">
              <SlidersHorizontal className="h-10 w-10 text-zinc-600 mb-3" />
              <h3 className="text-base font-bold text-zinc-300">Nenhum produto encontrado</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                Nenhum item corresponde à busca &ldquo;{searchQuery}&rdquo;. Tente buscar por outros termos ou selecione &ldquo;Todos&rdquo;.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("Todos");
                }}
                className="mt-4 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-700 transition"
              >
                Resetar Filtros
              </button>
            </div>
          )}
        </section>

        {/* VIP Upgrade Banner Section */}
        {!isVip && (
          <section className="mt-16 overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-zinc-900 via-zinc-950 to-[#120f04] p-8 sm:p-10 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-400">
                  <Crown className="h-4 w-4" />
                  Membro VIP Yuanware
                </span>
                <h3 className="mt-2 text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                  Liberdade Total de Importação
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  Elimine a restrição de 1 link por dia. Tenha acesso a mais de 500 fornecedores 1:1, novidades diárias e ferramentas integradas de declaração aduaneira.
                </p>
              </div>

              <a
                href={VIP_CHECKOUT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3.5 text-xs font-black uppercase tracking-wider text-black hover:brightness-110 transition shadow-xl shadow-amber-500/20 shrink-0"
              >
                <span>Quero Acesso VIP Ilimitado</span>
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-zinc-800/80 bg-zinc-950 py-10 text-xs text-zinc-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.jpg"
              alt="YUANWARE"
              className="h-7 w-7 rounded-lg object-cover border border-zinc-800"
            />
            <span className="font-bold text-zinc-200">YUANWARE</span>
            <span className="text-zinc-400">• Curadoria & Catálogo de Roupas da China</span>
          </div>

          <div className="text-[11px] text-zinc-400 text-center md:text-right">
            Preços informados em Yuan (¥). Todos os redirecionamentos são de fornecedores independentes.
          </div>
        </div>
      </footer>

      {/* Product Detail Modal */}
      <ProductModal
        product={activeModalProduct}
        isOpen={Boolean(activeModalProduct)}
        onClose={() => setActiveModalProduct(null)}
        isLocked={
          !isVip &&
          dailyAccessUsed &&
          Boolean(activeModalProduct && !isProductUnlockedToday(activeModalProduct.id))
        }
        isUnlockedToday={Boolean(activeModalProduct && isProductUnlockedToday(activeModalProduct.id))}
        isVip={isVip}
        onAccessLink={(p) => handleAccessLink(p)}
        onAddToDeclaration={(p) => handleAddToDeclaration(p)}
        onDirectDeclaration={(p) => handleDirectDeclaration(p)}
      />

      {/* Unlocked Link Direct Access & Copy Modal (Popup-blocker proof) */}
      <UnlockedLinkModal
        isOpen={unlockedModalData.isOpen}
        onClose={() => setUnlockedModalData((prev) => ({ ...prev, isOpen: false }))}
        productTitle={unlockedModalData.productTitle}
        targetUrl={unlockedModalData.targetUrl}
        productImage={unlockedModalData.productImage}
        isAlreadyUnlocked={unlockedModalData.isAlreadyUnlocked}
        isVip={isVip}
        onOpenVipModal={() => setLockedModalOpen(true)}
      />

      {/* 24h Quota Exceeded & VIP Offer Modal */}
      <LockedQuotaModal
        isOpen={lockedModalOpen}
        onClose={() => setLockedModalOpen(false)}
        hoursRemaining={hoursRemaining}
      />

      {/* Configurable Timed Popup */}
      <TimedPopup
        config={popupConfig}
        onOpenVipModal={() => setLockedModalOpen(true)}
      />

      {/* Customs Declaration Cart Drawer */}
      <DeclarationDrawer
        isOpen={declarationDrawerOpen}
        onClose={() => setDeclarationDrawerOpen(false)}
        items={declarationItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onOpenVipModal={() => {
          setDeclarationDrawerOpen(false);
          setLockedModalOpen(true);
        }}
      />
    </div>
  );
}
