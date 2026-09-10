"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { 
  INITIAL_PRODUCTS, 
  INITIAL_BANNERS, 
  DEFAULT_POPUP, 
  CATEGORIES 
} from "@/lib/mock-data";
import { Product, Banner, PopupConfig, UserProfile, UserRole } from "@/types";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import RedditBulkImporter from "@/components/RedditBulkImporter";
import ImageUploader from "@/components/ImageUploader";
import { 
  ShieldCheck, 
  Package, 
  Users, 
  Sliders, 
  Plus, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Check, 
  X, 
  Crown, 
  Search, 
  ArrowLeft,
  Sparkles,
  Lock,
  Clock,
  Save,
  Image as ImageIcon,
  Download
} from "lucide-react";

export default function AdminPage() {
  const { user, profile, isAdmin, loginWithGoogle, mockLogin } = useAuth();

  // Active Admin Tab: 'products' | 'users' | 'banners' | 'popup'
  const [activeTab, setActiveTab] = useState<"products" | "users" | "banners" | "popup">("products");

  // State
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [banners, setBanners] = useState<Banner[]>(INITIAL_BANNERS);
  const [popupConfig, setPopupConfig] = useState<PopupConfig>(DEFAULT_POPUP);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filters inside Admin
  const [productSearch, setProductSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // Product Form Modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [uploadedProductImage, setUploadedProductImage] = useState<string>("");

  // Reddit Bulk Importer state
  const [isRedditModalOpen, setIsRedditModalOpen] = useState(false);

  // Uploaded images for Popup & Banner
  const [uploadedPopupImage, setUploadedPopupImage] = useState<string>("");
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [uploadedBannerImage, setUploadedBannerImage] = useState<string>("");

  // Load from Storage
  useEffect(() => {
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

    // Load registered users from Firestore or localStorage
    const loadUsers = async () => {
      if (isFirebaseConfigured) {
        try {
          const usersCol = collection(db, "users");
          const snap = await getDocs(usersCol);
          if (!snap.empty) {
            const firestoreUsers: UserProfile[] = [];
            snap.forEach((docSnap) => {
              firestoreUsers.push(docSnap.data() as UserProfile);
            });
            setUsersList(firestoreUsers);
            localStorage.setItem("yw_users_list", JSON.stringify(firestoreUsers));
            return;
          }
        } catch (err) {
          console.warn("Could not fetch users directly from Firestore, using local list:", err);
        }
      }

      const savedUsers = localStorage.getItem("yw_users_list");
      if (savedUsers) {
        try {
          setUsersList(JSON.parse(savedUsers));
          return;
        } catch (e) {
          console.error(e);
        }
      }

      const defaultUsers: UserProfile[] = [
        {
          uid: "lead-001",
          email: "joao.importador@gmail.com",
          displayName: "João Silva",
          photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
          role: "free",
          createdAt: Date.now() - 1000 * 60 * 60 * 48,
          lastLinkAccessAt: Date.now() - 1000 * 60 * 60 * 3,
          dailyAccessCount: 1,
          dailyDeclarationsCount: 0,
          totalDeclarationsCount: 0,
        },
        {
          uid: "lead-002",
          email: "marcelo.sneakers@gmail.com",
          displayName: "Marcelo D.",
          photoURL: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150",
          role: "vip",
          createdAt: Date.now() - 1000 * 60 * 60 * 120,
          lastLinkAccessAt: Date.now() - 1000 * 60 * 20,
          dailyAccessCount: 14,
          dailyDeclarationsCount: 3,
          totalDeclarationsCount: 18,
        },
        {
          uid: "admin-uid-01",
          email: "ph44608@gmail.com",
          displayName: "Pedro Admin",
          photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
          role: "admin",
          createdAt: Date.now() - 1000 * 60 * 60 * 300,
          lastLinkAccessAt: Date.now(),
          dailyAccessCount: 99,
          dailyDeclarationsCount: 2,
          totalDeclarationsCount: 45,
        },
      ];
      setUsersList(defaultUsers);
      localStorage.setItem("yw_users_list", JSON.stringify(defaultUsers));
    };

    loadUsers();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Product CRUD
  const handleSaveProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const title = formData.get("title") as string;
    const priceCny = Number(formData.get("priceCny")) || 0;
    const category = formData.get("category") as string;
    const targetUrl = formData.get("targetUrl") as string;
    const description = formData.get("description") as string;
    const imagesRaw = formData.get("images") as string;
    const tagsRaw = formData.get("tags") as string;
    const weight = Number(formData.get("weight")) || 500;
    const declPt = formData.get("declPt") as string;
    const declEn = formData.get("declEn") as string;

    const images = imagesRaw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    // If an image was uploaded from device, prioritize it
    if (uploadedProductImage && !images.includes(uploadedProductImage)) {
      images.unshift(uploadedProductImage);
    }

    const tags = tagsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingProduct) {
      // Update
      const updated = products.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              title,
              priceCny,
              category,
              targetUrl,
              description,
              images: images.length ? images : p.images,
              tags,
              estimatedWeightGrams: weight,
              declarationCategoryPt: declPt,
              declarationCategoryEn: declEn,
            }
          : p
      );
      setProducts(updated);
      localStorage.setItem("yw_products", JSON.stringify(updated));
      showToast("Produto atualizado com sucesso!");
    } else {
      // Create
      const newProd: Product = {
        id: "yw-prod-" + Date.now(),
        title,
        priceCny,
        category: category || "Camisetas",
        targetUrl: targetUrl || "https://weidian.com",
        description,
        images: images.length ? images : ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800"],
        tags,
        active: true,
        createdAt: Date.now(),
        estimatedWeightGrams: weight,
        declarationCategoryPt: declPt,
        declarationCategoryEn: declEn,
      };
      const updated = [newProd, ...products];
      setProducts(updated);
      localStorage.setItem("yw_products", JSON.stringify(updated));
      showToast("Novo produto adicionado à vitrine!");
    }

    setIsProductModalOpen(false);
    setEditingProduct(null);
    setUploadedProductImage("");
  };

  // Bulk import from Reddit handler
  const handleBulkImportProducts = (newProducts: Product[]) => {
    const updated = [...newProducts, ...products];
    setProducts(updated);
    localStorage.setItem("yw_products", JSON.stringify(updated));
    showToast(`✓ ${newProducts.length} produtos importados do Reddit com sucesso!`);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      const updated = products.filter((p) => p.id !== id);
      setProducts(updated);
      localStorage.setItem("yw_products", JSON.stringify(updated));
      showToast("Produto excluído.");
    }
  };

  const handleToggleProductStatus = (id: string) => {
    const updated = products.map((p) =>
      p.id === id ? { ...p, active: !p.active } : p
    );
    setProducts(updated);
    localStorage.setItem("yw_products", JSON.stringify(updated));
    showToast("Status do produto alterado.");
  };

  // User Role Management (FREE <-> VIP)
  const handleToggleUserRole = async (uid: string) => {
    let targetUser: UserProfile | null = null;
    const updated = usersList.map((u) => {
      if (u.uid === uid) {
        const newRole: UserRole = u.role === "vip" ? "free" : "vip";
        targetUser = { ...u, role: newRole };
        return targetUser;
      }
      return u;
    });

    setUsersList(updated);
    localStorage.setItem("yw_users_list", JSON.stringify(updated));

    // Update locally stored user profile if it's currently active user
    const localProf = localStorage.getItem(`yw_profile_${uid}`);
    if (localProf && targetUser) {
      try {
        const parsed = JSON.parse(localProf);
        parsed.role = (targetUser as UserProfile).role;
        localStorage.setItem(`yw_profile_${uid}`, JSON.stringify(parsed));
      } catch (e) {
        console.error(e);
      }
    }

    // Persist to Firestore if configured
    if (isFirebaseConfigured && targetUser) {
      try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, { role: (targetUser as UserProfile).role });
      } catch (err) {
        console.error("Failed to update role in Firestore:", err);
      }
    }

    showToast("Cargo do usuário atualizado!");
  };

  const handleResetUserQuota = (uid: string) => {
    const updated = usersList.map((u) => {
      if (u.uid === uid) {
        return { ...u, lastLinkAccessAt: null, lastAccessedProductId: null, dailyAccessCount: 0 };
      }
      return u;
    });
    setUsersList(updated);
    localStorage.setItem("yw_users_list", JSON.stringify(updated));

    // Also update current active session profile if resetting profile
    const savedProfile = localStorage.getItem(`yw_profile_${uid}`);
    if (savedProfile) {
      try {
        const p = JSON.parse(savedProfile);
        p.lastLinkAccessAt = null;
        p.lastAccessedProductId = null;
        p.dailyAccessCount = 0;
        localStorage.setItem(`yw_profile_${uid}`, JSON.stringify(p));
      } catch (e) {}
    }

    const savedMock = localStorage.getItem("yw_mock_user");
    if (savedMock) {
      try {
        const m = JSON.parse(savedMock);
        if (m.profile?.uid === uid || m.user?.uid === uid) {
          m.profile.lastLinkAccessAt = null;
          m.profile.lastAccessedProductId = null;
          m.profile.dailyAccessCount = 0;
          localStorage.setItem("yw_mock_user", JSON.stringify(m));
        }
      } catch (e) {}
    }

    // Call server to reset in-memory map
    fetch(`/api/products/${uid}/access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: uid, userEmail: "reset@admin.com", lastLinkAccessAt: null, reset: true }),
    }).catch(() => {});

    // Update Firestore if configured
    if (isFirebaseConfigured) {
      const userRef = doc(db, "users", uid);
      updateDoc(userRef, { lastLinkAccessAt: null, lastAccessedProductId: null, dailyAccessCount: 0 }).catch(console.error);
    }

    showToast("Cota de 24h de links resetada com sucesso! 1 novo link liberado.");
  };

  const handleResetDeclarationsQuota = (uid: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const updated = usersList.map((u) => {
      if (u.uid === uid) {
        return { ...u, dailyDeclarationsCount: 0, lastDeclarationDate: todayStr };
      }
      return u;
    });
    setUsersList(updated);
    localStorage.setItem("yw_users_list", JSON.stringify(updated));

    if (isFirebaseConfigured) {
      const userRef = doc(db, "users", uid);
      updateDoc(userRef, { dailyDeclarationsCount: 0, lastDeclarationDate: todayStr }).catch(console.error);
    }

    showToast("Cota diária de declarações resetada (0/10).");
  };

  // Save Popup Config
  const handleSavePopup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updated: PopupConfig = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      imageUrl: uploadedPopupImage || (formData.get("imageUrl") as string) || popupConfig.imageUrl || "",
      ctaText: formData.get("ctaText") as string,
      ctaUrl: formData.get("ctaUrl") as string,
      delaySeconds: Number(formData.get("delaySeconds")) || 10,
      active: formData.get("active") === "on",
    };
    setPopupConfig(updated);
    localStorage.setItem("yw_popup", JSON.stringify(updated));
    showToast("Configuração de Pop-up salva com sucesso!");
  };

  // Banner CRUD
  const handleSaveBanner = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const subtitle = formData.get("subtitle") as string;
    const targetUrl = formData.get("targetUrl") as string;
    const imageUrl = uploadedBannerImage || (formData.get("imageUrl") as string) || "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600";

    const newBanner: Banner = {
      id: "ban-" + Date.now(),
      title,
      subtitle,
      targetUrl: targetUrl || "#vitrine",
      imageUrl,
      active: true,
      order: banners.length + 1,
    };

    const updated = [...banners, newBanner];
    setBanners(updated);
    localStorage.setItem("yw_banners", JSON.stringify(updated));
    showToast("Novo banner adicionado com sucesso!");
    setIsBannerModalOpen(false);
    setUploadedBannerImage("");
  };

  const handleDeleteBanner = (id: string) => {
    if (confirm("Deseja remover este banner?")) {
      const updated = banners.filter((b) => b.id !== id);
      setBanners(updated);
      localStorage.setItem("yw_banners", JSON.stringify(updated));
      showToast("Banner removido.");
    }
  };

  // If user is not admin, show login prompt / unauthorized screen
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#09090c] text-zinc-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mb-4 shadow-xl">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-black text-white uppercase tracking-tight">
          Acesso Restrito ao Painel Admin
        </h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md">
          Este painel é exclusivo para o administrador (<strong>ph44608@gmail.com</strong>).
          Faça login com a conta autorizada para gerenciar produtos, links e clientes VIP.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => mockLogin("admin", "ph44608@gmail.com")}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 px-6 py-3.5 text-xs font-black uppercase tracking-wider text-white hover:brightness-110 transition shadow-xl shadow-red-600/30 border border-red-500/40"
          >
            <Crown className="h-4 w-4 text-amber-400" />
            <span>Acessar Como Administrador (<span className="text-amber-300">ph44608@gmail.com</span>)</span>
          </button>

          <button
            onClick={loginWithGoogle}
            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/90 px-5 py-3 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 transition shadow-sm"
          >
            <span>Login com Conta Google</span>
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

  return (
    <div className="min-h-screen bg-[#09090c] text-zinc-100 flex flex-col">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-zinc-950 px-4 py-3 text-xs font-semibold text-amber-300 shadow-2xl animate-in slide-in-from-top-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Topbar */}
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-[#09090c]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition mr-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-xs">Vitrine</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-xs">
                ADM
              </div>
              <h1 className="text-base font-bold text-white uppercase tracking-wider">
                Yuanware Admin
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-zinc-400 hidden sm:inline">Logado como:</span>
            <span className="font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
              {user?.email || "ph44608@gmail.com"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Admin Body */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800 gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "products"
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-600/30 border border-red-500/40"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            <Package className={`h-4 w-4 ${activeTab === "products" ? "text-amber-400" : ""}`} />
            <span>Produtos & Links ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "users"
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-600/30 border border-red-500/40"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            <Users className={`h-4 w-4 ${activeTab === "users" ? "text-amber-400" : ""}`} />
            <span>Clientes & Permissões VIP ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("banners")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "banners"
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-600/30 border border-red-500/40"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            <ImageIcon className={`h-4 w-4 ${activeTab === "banners" ? "text-amber-400" : ""}`} />
            <span>Banners ({banners.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("popup")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "popup"
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-600/30 border border-red-500/40"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            <Sliders className={`h-4 w-4 ${activeTab === "popup" ? "text-amber-400" : ""}`} />
            <span>Pop-ups & Temporizadores</span>
          </button>
        </div>

        {/* TAB 1: PRODUCTS & CHINESE SUPPLIER LINKS */}
        {activeTab === "products" && (
          <section className="mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Filtrar por nome ou categoria..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-10 pr-4 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500/60 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsRedditModalOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 px-4 py-2.5 text-xs font-bold text-white hover:brightness-110 transition shrink-0 shadow-lg shadow-red-600/25 border border-red-500/40"
                >
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span>Extrair em Massa</span>
                </button>

                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setUploadedProductImage("");
                    setIsProductModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black text-black hover:bg-amber-300 transition shrink-0 shadow-md shadow-amber-500/20"
                >
                  <Plus className="h-4 w-4" />
                  <span>Cadastrar Novo Produto</span>
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4">Produto</th>
                      <th className="p-4">Preço (¥)</th>
                      <th className="p-4">Categoria</th>
                      <th className="p-4">Link Fornecedor</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {products
                      .filter((p) =>
                        p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
                        p.category.toLowerCase().includes(productSearch.toLowerCase())
                      )
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-zinc-900/40 transition">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.images[0]}
                                alt=""
                                className="h-12 w-12 rounded-lg object-cover bg-zinc-900 border border-zinc-800 shrink-0"
                              />
                              <div>
                                <span className="font-semibold text-zinc-100 block max-w-xs truncate">
                                  {p.title}
                                </span>
                                <span className="text-[10px] text-zinc-500">ID: {p.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-amber-400">¥ {p.priceCny}</span>
                            <span className="text-[10px] text-zinc-500 block">
                              ~R$ {Math.round(p.priceCny * 0.82)}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-[11px] text-zinc-300">
                              {p.category}
                            </span>
                          </td>
                          <td className="p-4">
                            <a
                              href={p.targetUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-zinc-400 hover:text-amber-400 max-w-[180px] truncate"
                              title={p.targetUrl}
                            >
                              <span className="truncate">{p.targetUrl}</span>
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleToggleProductStatus(p.id)}
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition ${
                                p.active !== false
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                  : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                              }`}
                            >
                              {p.active !== false ? "Ativo" : "Oculto"}
                            </button>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingProduct(p);
                                  setIsProductModalOpen(true);
                                }}
                                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
                                title="Editar"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="rounded-lg p-2 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 transition"
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* TAB 2: USERS & VIP STATUS PERMISSIONS */}
        {activeTab === "users" && (
          <section className="mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white uppercase tracking-wider">
                  Controle Rigoroso de Acessos & Compradores VIP
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Aqui você decide quem é <strong>Gratuito (1 link a cada 24h)</strong> e quem é <strong>VIP Ilimitado (acesso a todos os links)</strong>.
                </p>
              </div>

              <div className="relative max-w-xs">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Buscar por e-mail ou nome..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-10 pr-4 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500/60 focus:outline-none"
                />
              </div>
            </div>

            {/* Users Table */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4">Usuário</th>
                      <th className="p-4">Plano Atual</th>
                      <th className="p-4">Declarações (Hoje / Total)</th>
                      <th className="p-4">Último Link Acessado</th>
                      <th className="p-4">Situação da Cota 24h</th>
                      <th className="p-4 text-right">Ações de Permissão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {usersList
                      .filter(
                        (u) =>
                          u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.displayName?.toLowerCase().includes(userSearch.toLowerCase())
                      )
                      .map((u) => {
                        const isVipUser = u.role === "vip" || u.role === "admin";
                        const hasRecentAccess =
                          u.lastLinkAccessAt && Date.now() - u.lastLinkAccessAt < 24 * 60 * 60 * 1000;
                        const todayStr = new Date().toISOString().split("T")[0];
                        const declarationsToday = u.lastDeclarationDate === todayStr ? (u.dailyDeclarationsCount || 0) : 0;
                        const totalDeclarations = u.totalDeclarationsCount || declarationsToday;

                        return (
                          <tr key={u.uid} className="hover:bg-zinc-900/40 transition">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                {u.photoURL ? (
                                  <img
                                    src={u.photoURL}
                                    alt=""
                                    className="h-10 w-10 rounded-full object-cover bg-zinc-800"
                                  />
                                ) : (
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 font-bold">
                                    {u.displayName?.[0] || u.email[0].toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <span className="font-semibold text-zinc-100 block">
                                    {u.displayName || "Usuário"}
                                  </span>
                                  <span className="text-[11px] text-zinc-400">{u.email}</span>
                                </div>
                              </div>
                            </td>

                            <td className="p-4">
                              {u.role === "admin" ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-md border border-purple-500/30">
                                  ADMINISTRADOR
                                </span>
                              ) : isVipUser ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/30">
                                  <Crown className="h-3.5 w-3.5" /> VIP COMPRADOR
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-300 bg-zinc-800 px-2.5 py-1 rounded-md">
                                  GRATUITO (1 link/dia)
                                </span>
                              )}
                            </td>

                            {/* Declarations Usage Column */}
                            <td className="p-4">
                              {isVipUser ? (
                                <div>
                                  <span className="font-semibold text-zinc-200 block">
                                    {declarationsToday} / 10 hoje
                                  </span>
                                  <span className="text-[10px] text-zinc-500">
                                    Total histórico: {totalDeclarations}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[11px] text-zinc-500 italic">
                                  Sem acesso (Free)
                                </span>
                              )}
                            </td>

                            <td className="p-4 text-zinc-400">
                              {u.lastLinkAccessAt ? (
                                <span>
                                  {new Date(u.lastLinkAccessAt).toLocaleString("pt-BR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              ) : (
                                <span className="text-zinc-600">Nenhum link ainda</span>
                              )}
                            </td>

                            <td className="p-4">
                              {isVipUser ? (
                                <span className="text-emerald-400 font-medium">Ilimitado</span>
                              ) : hasRecentAccess ? (
                                <span className="text-rose-400 font-medium flex items-center gap-1">
                                  <Lock className="h-3 w-3" /> Cota gasta (Bloqueado)
                                </span>
                              ) : (
                                <span className="text-emerald-400 font-medium">1 link disponível</span>
                              )}
                            </td>

                            <td className="p-4 text-right">
                              {u.role !== "admin" ? (
                                <div className="flex items-center justify-end gap-2">
                                  {hasRecentAccess && (
                                    <button
                                      onClick={() => handleResetUserQuota(u.uid)}
                                      className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-[10px] text-zinc-300 hover:text-white"
                                      title="Permitir novo link hoje"
                                    >
                                      Resetar Link
                                    </button>
                                  )}

                                  {isVipUser && declarationsToday > 0 && (
                                    <button
                                      onClick={() => handleResetDeclarationsQuota(u.uid)}
                                      className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 text-[10px] text-zinc-300 hover:text-white"
                                      title="Resetar cota diária de declarações"
                                    >
                                      Resetar Decl.
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleToggleUserRole(u.uid)}
                                    className={`rounded-lg px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition ${
                                      isVipUser
                                        ? "border border-rose-500/40 text-rose-300 hover:bg-rose-500/10"
                                        : "bg-amber-400 text-black hover:bg-amber-300 shadow-md shadow-amber-500/20"
                                    }`}
                                  >
                                    {isVipUser ? "Rebaixar para Free" : "Promover a VIP"}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-zinc-500">Super Admin</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* TAB: BANNERS PROMOCIONAIS */}
        {activeTab === "banners" && (
          <section className="mt-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white uppercase tracking-wider">
                  Banners em Destaque no Topo da Vitrine
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Gerencie os slides e campanhas principais com imagens e links de ação.
                </p>
              </div>

              <button
                onClick={() => {
                  setUploadedBannerImage("");
                  setIsBannerModalOpen(true);
                }}
                className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-black hover:bg-amber-300 transition"
              >
                <Plus className="h-4 w-4" />
                <span>Novo Banner</span>
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {banners.map((b) => (
                <div
                  key={b.id}
                  className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-4 flex flex-col justify-between"
                >
                  <div className="aspect-[16/7] w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 relative mb-3">
                    <img src={b.imageUrl} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <span className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">
                        Slide #{b.order}
                      </span>
                      <h4 className="text-sm font-black text-white uppercase">{b.title}</h4>
                      {b.subtitle && (
                        <p className="text-xs text-zinc-300 line-clamp-1">{b.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs">
                    <span className="text-zinc-400 truncate max-w-[220px]">
                      Destino: <strong>{b.targetUrl || "Nenhum"}</strong>
                    </span>
                    <button
                      onClick={() => handleDeleteBanner(b.id)}
                      className="text-zinc-500 hover:text-rose-400 p-1 transition"
                      title="Excluir Banner"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 3: POP-UPS & TIMERS CONFIGURATION */}
        {activeTab === "popup" && (
          <section className="mt-6 max-w-2xl">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                Configuração de Pop-up Automático com Temporizador
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Configure a janela modal que aparece para os visitantes da vitrine para capturar leads e vender o acesso VIP.
              </p>

              <form onSubmit={handleSavePopup} className="mt-6 space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Título do Pop-up</label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={popupConfig.title}
                    required
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-100 focus:border-amber-500/60 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Texto Descritivo</label>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={popupConfig.description}
                    required
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-100 focus:border-amber-500/60 focus:outline-none"
                  />
                </div>

                <div>
                  <ImageUploader
                    label="Imagem de Destaque do Pop-up (Upload ou URL)"
                    currentImage={uploadedPopupImage || popupConfig.imageUrl || ""}
                    onImageChange={(url) => setUploadedPopupImage(url)}
                    aspectRatio="banner"
                  />
                  <input
                    type="hidden"
                    name="imageUrl"
                    value={uploadedPopupImage || popupConfig.imageUrl || ""}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">Texto do Botão CTA</label>
                    <input
                      type="text"
                      name="ctaText"
                      defaultValue={popupConfig.ctaText}
                      required
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-100 focus:border-amber-500/60 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-semibold mb-1">Tempo de Espera (Segundos)</label>
                    <input
                      type="number"
                      name="delaySeconds"
                      min={1}
                      max={120}
                      defaultValue={popupConfig.delaySeconds}
                      required
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-100 focus:border-amber-500/60 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Link de Destino do Botão (Checkout/WhatsApp)</label>
                  <input
                    type="text"
                    name="ctaUrl"
                    defaultValue={popupConfig.ctaUrl}
                    placeholder="#vip ou https://..."
                    required
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-100 focus:border-amber-500/60 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    name="active"
                    id="activePopup"
                    defaultChecked={popupConfig.active}
                    className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="activePopup" className="text-zinc-200 font-medium">
                    Ativar este Pop-up na vitrine
                  </label>
                </div>

                <button
                  type="submit"
                  className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 py-3.5 px-6 text-xs font-black uppercase tracking-wider text-white transition shadow-xl shadow-red-600/30 border border-red-500/40"
                >
                  <Save className="h-4 w-4 text-amber-400" />
                  <span>Salvar Configuração do Pop-up</span>
                </button>
              </form>
            </div>
          </section>
        )}

      </main>

      {/* CREATE / EDIT PRODUCT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-950 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                {editingProduct ? "Editar Produto da China" : "Cadastrar Novo Produto"}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Título do Produto *</label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingProduct?.title || ""}
                  required
                  placeholder="Ex: Heavyweight Boxy Hoodie Vintage Wash"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-zinc-100 focus:border-amber-500/60 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Preço em Yuan (¥) *</label>
                  <input
                    type="number"
                    step="1"
                    name="priceCny"
                    defaultValue={editingProduct?.priceCny || 150}
                    required
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-zinc-100 focus:border-amber-500/60 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Categoria *</label>
                  <select
                    name="category"
                    defaultValue={editingProduct?.category || "Camisetas"}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-zinc-100 focus:border-amber-500/60 focus:outline-none"
                  >
                    {CATEGORIES.filter((c) => c !== "Todos").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Link de Destino do Fornecedor (Taobao / Weidian / 1688) *
                </label>
                <input
                  type="url"
                  name="targetUrl"
                  defaultValue={editingProduct?.targetUrl || ""}
                  required
                  placeholder="https://weidian.com/item.html?itemID=..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-zinc-100 focus:border-amber-500/60 focus:outline-none"
                />
                <span className="text-[10px] text-zinc-500 block mt-1">
                  🔒 Este link fica estritamente protegido pelo backend e só é liberado para quem tem cota ou VIP.
                </span>
              </div>

              <div>
                <ImageUploader
                  label="Foto Principal do Produto (Upload direto do PC ou URL)"
                  currentImage={uploadedProductImage || editingProduct?.images[0] || ""}
                  onImageChange={(url) => setUploadedProductImage(url)}
                  aspectRatio="square"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  URLs das Fotos (uma por linha)
                </label>
                <textarea
                  name="images"
                  rows={2}
                  defaultValue={editingProduct?.images.join("\n") || ""}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-zinc-100 focus:border-amber-500/60 focus:outline-none font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Descrição</label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={editingProduct?.description || ""}
                  placeholder="Detalhes do tecido, gramatura (GSM), caimento..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-zinc-100 focus:border-amber-500/60 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-zinc-400 text-[11px] mb-1">Tags (vírgula)</label>
                  <input
                    type="text"
                    name="tags"
                    defaultValue={editingProduct?.tags?.join(", ") || ""}
                    placeholder="Oversized, 400 GSM"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 text-[11px] mb-1">Peso Est. (gramas)</label>
                  <input
                    type="number"
                    name="weight"
                    defaultValue={editingProduct?.estimatedWeightGrams || 500}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 text-[11px] mb-1">Declaração (EN)</label>
                  <input
                    type="text"
                    name="declEn"
                    defaultValue={editingProduct?.declarationCategoryEn || "Cotton T-shirt"}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="rounded-xl border border-zinc-800 px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 px-6 py-2.5 font-bold text-white transition shadow-lg shadow-red-600/30 border border-red-500/40"
                >
                  {editingProduct ? "Salvar Alterações" : "Cadastrar Produto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE BANNER MODAL */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-950 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Novo Banner Promocional
              </h3>
              <button
                onClick={() => setIsBannerModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Título do Banner *</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="Ex: NOVO DROP EXCLUSIVO 1:1"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-zinc-100 focus:border-amber-500/60 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Subtítulo / Descrição</label>
                <input
                  type="text"
                  name="subtitle"
                  placeholder="Ex: Curadoria direta das melhores fábricas de Guangzhou"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-zinc-100 focus:border-amber-500/60 focus:outline-none"
                />
              </div>

              <div>
                <ImageUploader
                  label="Imagem do Banner (Upload do PC ou URL)"
                  currentImage={uploadedBannerImage}
                  onImageChange={(url) => setUploadedBannerImage(url)}
                  aspectRatio="banner"
                />
                <input type="hidden" name="imageUrl" value={uploadedBannerImage} />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Link de Destino do Botão</label>
                <input
                  type="text"
                  name="targetUrl"
                  defaultValue="#vitrine"
                  placeholder="#vitrine, #vip ou https://..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-zinc-100 focus:border-amber-500/60 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="rounded-xl border border-zinc-800 px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 px-6 py-2.5 font-bold text-white transition shadow-lg shadow-red-600/30 border border-red-500/40"
                >
                  Salvar Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REDDIT BULK IMPORTER MODAL */}
      <RedditBulkImporter
        isOpen={isRedditModalOpen}
        onClose={() => setIsRedditModalOpen(false)}
        onImportProducts={handleBulkImportProducts}
      />
    </div>
  );
}
