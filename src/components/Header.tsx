"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { 
  Lock, 
  Crown, 
  ShieldCheck, 
  LogOut, 
  Package, 
  User as UserIcon,
  ChevronDown,
  Sparkles
} from "lucide-react";
import { VIP_CHECKOUT_URL } from "@/lib/constants";

interface HeaderProps {
  onOpenDeclarationCart?: () => void;
  declarationCount?: number;
  onOpenVipModal?: () => void;
}

export default function Header({
  onOpenDeclarationCart,
  declarationCount = 0,
  onOpenVipModal,
}: HeaderProps) {
  const { 
    user, 
    profile, 
    isAdmin, 
    isVip, 
    dailyAccessUsed, 
    hoursRemaining,
    loginWithGoogle, 
    mockLogin,
    logout 
  } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#09090c]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/logo.jpg"
              alt="YUANWARE Logo"
              className="h-10 w-10 rounded-xl object-cover border border-zinc-800 shadow-md group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-wider text-white group-hover:text-red-500 transition-colors">
                YUAN<span className="text-amber-400">WARE</span>
              </span>
              <span className="text-[10px] font-medium tracking-widest text-zinc-400 uppercase -mt-1">
                China Streetwear Vault
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-4 text-xs font-medium text-zinc-300">
            <Link href="#vitrine" className="hover:text-white transition-colors">
              Vitrine
            </Link>
            <Link href="#categorias" className="hover:text-white transition-colors">
              Categorias
            </Link>
            {isAdmin && (
              <Link 
                href="/admin" 
                className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 font-semibold"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Painel Admin
              </Link>
            )}
          </nav>
        </div>

        {/* Right Section: Declarations Cart, Quota Status & Auth */}
        <div className="flex items-center gap-3">
          
          {/* Declaration Cart Button (Roadmap Feature) */}
          <button
            onClick={onOpenDeclarationCart}
            className="relative flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors"
            title="Carrinho de Declarações Aduaneiras"
          >
            <Package className="h-4 w-4 text-zinc-400" />
            <span className="hidden sm:inline">Declarações</span>
            {declarationCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black">
                {declarationCount}
              </span>
            )}
          </button>

          {/* User Logged State */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 p-1.5 pr-2.5 hover:border-zinc-700 transition-colors"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "Avatar"}
                    className="h-7 w-7 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-800 text-zinc-300">
                    <UserIcon className="h-4 w-4" />
                  </div>
                )}

                {/* Status Indicator */}
                <div className="hidden sm:flex flex-col items-start text-left text-xs">
                  <span className="font-semibold text-zinc-200 max-w-[110px] truncate leading-tight">
                    {user.displayName || user.email?.split("@")[0]}
                  </span>
                  
                  {isVip ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400">
                      <Crown className="h-3 w-3" /> VIP ILIMITADO
                    </span>
                  ) : dailyAccessUsed ? (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-rose-400">
                      <Lock className="h-2.5 w-2.5" /> Cota usada ({hoursRemaining}h)
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-medium">
                      1 Link liberado hoje
                    </span>
                  )}
                </div>

                <ChevronDown className="h-3.5 w-3.5 text-zinc-400 ml-1" />
              </button>

              {/* User Dropdown Menu */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl z-50 text-xs">
                  <div className="px-3 py-2 border-b border-zinc-800/80">
                    <p className="font-medium text-white truncate">{user.displayName || "Usuário"}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                    <div className="mt-1.5">
                      {isVip ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          <Crown className="h-3 w-3" /> Plano VIP Ilimitado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">
                          Plano Gratuito (1 link/24h)
                        </span>
                      )}
                    </div>
                  </div>

                  {!isVip && (
                    <a
                      href={VIP_CHECKOUT_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMenuOpen(false)}
                      className="w-full mt-1.5 flex items-center justify-between rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-2 font-bold text-black hover:brightness-110 transition"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        Desbloquear VIP
                      </span>
                      <span className="text-[10px] font-extrabold">ILIMITADO</span>
                    </a>
                  )}

                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-amber-400 hover:bg-zinc-900 transition-colors"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Painel do Administrador
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="w-full mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sair da conta
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Google Login Button */
            <div className="flex items-center gap-2">
              <button
                onClick={loginWithGoogle}
                className="flex items-center gap-2 rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-zinc-200 transition-colors shadow-sm"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Entrar com Google</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </header>
  );
}
