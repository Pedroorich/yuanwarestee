"use client";

import React, { useState } from "react";
import { DeclarationCartItem, OptimizedDeclarationResult } from "@/types";
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  PackageCheck, 
  Download, 
  FileSpreadsheet, 
  Scale, 
  DollarSign, 
  Check, 
  Sparkles,
  Calculator,
  Crown,
  Lock,
  AlertCircle,
  ShieldCheck,
  Globe,
  Info,
  Copy,
  Edit3,
  RefreshCw
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { 
  generateOptimizedCustomsDeclaration,
  detectStandardCategory,
  getOptimizedUnitPrice
} from "@/lib/customs-declaration";
import { VIP_CHECKOUT_URL } from "@/lib/constants";

interface DeclarationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: DeclarationCartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onOpenVipModal?: () => void;
}

export default function DeclarationDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenVipModal,
}: DeclarationDrawerProps) {
  const { 
    user, 
    isVip, 
    loginWithGoogle,
    dailyDeclarationsCount, 
    declarationsRemainingToday, 
    canGenerateDeclaration,
    recordDeclarationUsage 
  } = useAuth();

  const [copiedLang, setCopiedLang] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [quotaExceededMessage, setQuotaExceededMessage] = useState<string | null>(null);
  const [optimizedResult, setOptimizedResult] = useState<OptimizedDeclarationResult | null>(null);
  const [activeLangTab, setActiveLangTab] = useState<"pt" | "en" | "zh" | "json">("en");
  
  // Editable declaration text states so the lead can freely customize before copying
  const [editedTextEn, setEditedTextEn] = useState<string>("");
  const [editedTextZh, setEditedTextZh] = useState<string>("");
  const [editedTextPt, setEditedTextPt] = useState<string>("");

  if (!isOpen) return null;

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalWeightGrams = items.reduce(
    (acc, item) => acc + (item.product.estimatedWeightGrams || 500) * item.quantity,
    0
  );
  const totalCny = items.reduce(
    (acc, item) => acc + item.product.priceCny * item.quantity,
    0
  );

  const totalDeclaredUsd = items.reduce((acc, item, idx) => {
    const cat = detectStandardCategory(`${item.product.title} ${item.product.category} ${item.product.declarationCategoryPt || ""}`);
    const unitPrice = getOptimizedUnitPrice(cat.kind, idx);
    return acc + unitPrice * item.quantity;
  }, 0).toFixed(2);

  const handleOptimizeClick = async () => {
    if (!user) {
      onClose();
      await loginWithGoogle();
      return;
    }

    if (!isVip) {
      setQuotaExceededMessage("O sistema de declaração aduaneira é exclusivo para membros VIP.");
      return;
    }

    if (!canGenerateDeclaration) {
      setQuotaExceededMessage("Você atingiu o limite de segurança de 10 declarações por dia. Sua cota renova amanhã.");
      return;
    }

    // Generate fully optimized customs declaration following all fiscal and CSSBUY rules
    const result = generateOptimizedCustomsDeclaration(items);
    setOptimizedResult(result);
    setEditedTextEn(result.declarationTextEn);
    setEditedTextZh(result.declarationTextZh);
    setEditedTextPt(result.declarationText);

    const success = await recordDeclarationUsage();
    if (success) {
      setQuotaExceededMessage(null);
      setShowExportModal(true);
    } else {
      setQuotaExceededMessage("Você atingiu o limite de 10 declarações geradas hoje.");
    }
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLang(label);
    setTimeout(() => setCopiedLang(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative flex h-full w-full max-w-lg flex-col border-l border-zinc-800 bg-zinc-950 p-6 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <PackageCheck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-tight">
                Carrinho de Declarações
              </h2>
              <span className="text-[11px] text-zinc-400">
                {totalItems} {totalItems === 1 ? "peça selecionada" : "peças selecionadas"} para o pacote
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quota Banner & Status */}
        <div className="mt-3 mb-2">
          {!user ? (
            <div className="flex items-center justify-between rounded-xl bg-zinc-900 border border-zinc-800 p-3 text-xs">
              <span className="text-zinc-300">Faça login com Google para usar o gerador.</span>
              <button
                onClick={loginWithGoogle}
                className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-black hover:bg-zinc-200"
              >
                Entrar
              </button>
            </div>
          ) : !isVip ? (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-start gap-2.5">
              <Lock className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
              <div className="flex-1">
                <span className="font-bold block">Recurso Exclusivo VIP</span>
                <span className="text-[11px] text-zinc-300 block mt-0.5">
                  Usuários gratuitos não têm acesso à geração de declaração. Assine o VIP para liberar declarações e links ilimitados.
                </span>
                <a
                  href={VIP_CHECKOUT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 rounded-lg bg-amber-400 px-2.5 py-1 text-[10px] font-bold text-black hover:bg-amber-300 transition"
                >
                  <Crown className="h-3 w-3" />
                  Virar VIP
                </a>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs">
              <div className="flex items-center gap-1.5">
                <Crown className="h-3.5 w-3.5 text-amber-400" />
                <span className="font-semibold text-zinc-200">Cota VIP de Declarações</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`font-mono font-bold ${declarationsRemainingToday > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {dailyDeclarationsCount} / 10 usadas hoje
                </span>
                <span className="text-[10px] text-zinc-500">
                  ({declarationsRemainingToday} restantes)
                </span>
              </div>
            </div>
          )}

          {quotaExceededMessage && (
            <div className="mt-2 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{quotaExceededMessage}</span>
            </div>
          )}
        </div>

        {/* Package Summary Metrics */}
        {items.length > 0 && (
          <div className="my-3 grid grid-cols-3 gap-2 rounded-xl bg-zinc-900/80 border border-zinc-800/80 p-3 text-center">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Peso Pacote</span>
              <span className="text-xs font-bold text-zinc-100 flex items-center justify-center gap-1 mt-0.5">
                <Scale className="h-3 w-3 text-amber-400" />
                {(totalWeightGrams / 1000).toFixed(2)} kg
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Total Yuan</span>
              <span className="text-xs font-bold text-zinc-100 block mt-0.5">
                ¥ {totalCny}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Declaração USD</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                <DollarSign className="h-3 w-3" />
                ${totalDeclaredUsd}
              </span>
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-zinc-500">
              <PackageCheck className="h-12 w-12 stroke-1 text-zinc-700 mb-3" />
              <p className="text-sm font-medium text-zinc-400">Seu carrinho de declaração está vazio</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                Navegue pela vitrine e clique no ícone de pacote para adicionar roupas e gerar a declaração completa do seu pacote da China.
              </p>
            </div>
          ) : (
            items.map((item, idx) => {
              const cat = detectStandardCategory(`${item.product.title} ${item.product.category} ${item.product.declarationCategoryPt || ""}`);
              const optUnit = getOptimizedUnitPrice(cat.kind, idx);
              const optTotal = (optUnit * item.quantity).toFixed(2);

              return (
                <div
                  key={item.product.id}
                  className="flex items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3 hover:border-zinc-700 transition"
                >
                  <img
                    src={item.product.images[0]}
                    alt=""
                    className="h-14 w-14 rounded-lg object-cover bg-zinc-950 border border-zinc-800 shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-zinc-100 truncate">
                      {item.product.title}
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      ¥{item.product.priceCny} • Categoria: {cat.categoryPt}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-medium mt-0.5">
                      Declaração Sugerida: ${optTotal} USD (${optUnit.toFixed(2)} un) • {(item.product.estimatedWeightGrams || 500) * item.quantity}g
                    </p>
                  </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg p-1">
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, -1)}
                    className="flex h-5 w-5 items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-xs font-bold text-zinc-200 px-1">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, 1)}
                    className="flex h-5 w-5 items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                {/* Remove Item */}
                <button
                  onClick={() => onRemoveItem(item.product.id)}
                  className="text-zinc-500 hover:text-rose-400 p-1 transition"
                  title="Remover"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          }))}
        </div>

        {/* Footer Actions */}
        {items.length > 0 && (
          <div className="mt-4 border-t border-zinc-800 pt-4 flex flex-col gap-2.5">
            <button
              onClick={!isVip ? () => window.open(VIP_CHECKOUT_URL, "_blank") : handleOptimizeClick}
              disabled={isVip && !canGenerateDeclaration}
              className={`flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-black uppercase tracking-wider transition ${
                !isVip
                  ? "bg-gradient-to-r from-amber-400 to-amber-500 text-black hover:brightness-110 shadow-lg shadow-amber-500/20"
                  : !canGenerateDeclaration
                  ? "bg-rose-950/40 text-rose-400 border border-rose-500/30 cursor-not-allowed"
                  : "bg-gradient-to-r from-amber-400 to-amber-500 text-black hover:brightness-110 shadow-lg shadow-amber-500/20"
              }`}
            >
              {!isVip ? (
                <>
                  <Crown className="h-4 w-4" />
                  <span>Desbloquear Declaração (Virar VIP)</span>
                </>
              ) : !canGenerateDeclaration ? (
                <>
                  <AlertCircle className="h-4 w-4" />
                  <span>Limite Diário de 10 Atingido</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Otimizar Declaração ({declarationsRemainingToday} hoje)</span>
                </>
              )}
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const res = optimizedResult || generateOptimizedCustomsDeclaration(items);
                  handleCopyText(res.declarationTextEn, "quick_copy");
                }}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition"
              >
                {copiedLang === "quick_copy" ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Copiado (CSSBUY En)!</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span>Copiar Declaração Rápida</span>
                  </>
                )}
              </button>

              <button
                onClick={onClearCart}
                className="rounded-xl border border-zinc-800 py-2.5 px-3 text-xs text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 transition"
              >
                Limpar
              </button>
            </div>
          </div>
        )}

        {/* Modal of Optimized Customs Package */}
        {showExportModal && optimizedResult && (
          <div className="absolute inset-0 z-50 flex flex-col bg-[#0b0b0f] p-5 animate-in slide-in-from-bottom duration-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    Declaração Aduaneira Otimizada
                  </h3>
                  <span className="text-[10px] text-zinc-400">
                    Formato Oficial Redirecionadoras (CSSBUY / BaseTao / KameKache)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto space-y-4 my-3 pr-1">
              
              {/* Fiscal Radar & Risk Alert */}
              <div className={`rounded-xl border p-3.5 text-xs ${
                optimizedResult.customsAlertLevel === "alto"
                  ? "bg-rose-950/20 border-rose-500/40 text-rose-200"
                  : optimizedResult.customsAlertLevel === "medio"
                  ? "bg-amber-950/20 border-amber-500/40 text-amber-200"
                  : "bg-emerald-950/20 border-emerald-500/40 text-emerald-200"
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                    <AlertCircle className="h-4 w-4" />
                    Radar Aduaneiro: Risco {optimizedResult.customsAlertLevel.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/40 border border-white/10 font-bold">
                    Chance de Taxação: {optimizedResult.riskAnalysis.taxPossibility}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-zinc-300">
                  {optimizedResult.customsAlertExplanation}
                </p>
                {optimizedResult.riskAnalysis.recommendations.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Recomendações do Especialista:
                    </span>
                    {optimizedResult.riskAnalysis.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] text-zinc-300">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totals Banner */}
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-zinc-900 border border-zinc-800 p-3 text-center">
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase">Peso Total</span>
                  <span className="text-xs font-bold text-white mt-0.5 block">
                    {optimizedResult.totals.totalWeightKg} kg
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase">Itens Reais</span>
                  <span className="text-xs font-bold text-white mt-0.5 block">
                    {optimizedResult.totals.itemCount} un
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase">Valor Proposto</span>
                  <span className="text-xs font-bold text-emerald-400 mt-0.5 block">
                    ${optimizedResult.totals.totalValueUsd.toFixed(2)} USD
                  </span>
                </div>
              </div>

              {/* Multi-language CSSBUY Tabs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-amber-400" />
                    Texto de Declaração CSSBUY:
                  </span>

                  <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                    <button
                      onClick={() => setActiveLangTab("en")}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition ${
                        activeLangTab === "en" ? "bg-amber-400 text-black shadow" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Inglês (Recomendado)
                    </button>
                    <button
                      onClick={() => setActiveLangTab("zh")}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition ${
                        activeLangTab === "zh" ? "bg-amber-400 text-black shadow" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Chinês (中文)
                    </button>
                    <button
                      onClick={() => setActiveLangTab("pt")}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition ${
                        activeLangTab === "pt" ? "bg-amber-400 text-black shadow" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Português
                    </button>
                    <button
                      onClick={() => setActiveLangTab("json")}
                      className={`px-2 py-1 text-[10px] font-bold rounded-md transition ${
                        activeLangTab === "json" ? "bg-amber-400 text-black shadow" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      JSON
                    </button>
                  </div>
                </div>

                {/* Text Box for active language - Now fully editable by the lead before copying! */}
                <div className="relative rounded-xl border border-zinc-800 bg-zinc-950 p-3.5 focus-within:border-amber-500/50 transition">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-zinc-400 font-semibold flex items-center gap-1">
                      <Edit3 className="h-3 w-3 text-amber-400" />
                      Texto Editável (Altere se desejar antes de copiar):
                    </span>

                    <div className="flex items-center gap-2">
                      {activeLangTab !== "json" && (
                        <button
                          onClick={() => {
                            if (activeLangTab === "en") setEditedTextEn(optimizedResult.declarationTextEn);
                            if (activeLangTab === "zh") setEditedTextZh(optimizedResult.declarationTextZh);
                            if (activeLangTab === "pt") setEditedTextPt(optimizedResult.declarationText);
                          }}
                          className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300"
                          title="Restaurar texto original gerado"
                        >
                          <RefreshCw className="h-2.5 w-2.5" />
                          Restaurar
                        </button>
                      )}

                      <button
                        onClick={() => {
                          const textToCopy =
                            activeLangTab === "en"
                              ? editedTextEn
                              : activeLangTab === "zh"
                              ? editedTextZh
                              : activeLangTab === "pt"
                              ? editedTextPt
                              : JSON.stringify(optimizedResult, null, 2);
                          handleCopyText(textToCopy, activeLangTab);
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-700 px-2.5 py-1 text-[11px] font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition shadow"
                      >
                        {copiedLang === activeLangTab ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-amber-400" />
                            <span>Copiar {activeLangTab.toUpperCase()}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {activeLangTab === "json" ? (
                    <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                      {JSON.stringify(optimizedResult, null, 2)}
                    </pre>
                  ) : (
                    <textarea
                      rows={6}
                      value={
                        activeLangTab === "en"
                          ? editedTextEn
                          : activeLangTab === "zh"
                          ? editedTextZh
                          : editedTextPt
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (activeLangTab === "en") setEditedTextEn(val);
                        else if (activeLangTab === "zh") setEditedTextZh(val);
                        else if (activeLangTab === "pt") setEditedTextPt(val);
                      }}
                      className="w-full rounded-lg bg-zinc-900/80 p-2.5 text-xs text-zinc-200 font-mono leading-relaxed border border-zinc-800 focus:border-amber-500/60 focus:outline-none resize-y"
                      placeholder="Você pode personalizar o texto aqui antes de copiar..."
                    />
                  )}
                </div>
              </div>

              {/* Items Breakdown Accordion/Table */}
              <div>
                <span className="text-xs font-bold text-zinc-200 block mb-2">
                  Itens Declarados com IDs Originais ({optimizedResult.items.length}):
                </span>
                <div className="space-y-2">
                  {optimizedResult.items.map((it, idx) => (
                    <div
                      key={it.id}
                      className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-200">
                          #{idx + 1} {it.standardCategory}
                        </span>
                        <span className="font-bold text-amber-400">
                          ${it.totalPrice.toFixed(2)} USD (${it.unitPrice.toFixed(2)} un)
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        {it.technicalDescription}
                      </p>
                      <span className="text-[10px] text-zinc-600 block mt-1 font-mono">
                        ID Original: {it.id}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legal Observations */}
              <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/60 p-3 text-[11px] text-zinc-400 space-y-1.5">
                <span className="text-zinc-300 font-semibold flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 text-amber-400" />
                  Observações Regulatórias (Receita Federal):
                </span>
                {optimizedResult.legalObservations.map((obs, i) => (
                  <p key={i}>• {obs}</p>
                ))}
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="border-t border-zinc-800 pt-3 flex gap-2">
              <button
                onClick={() => {
                  const textToCopy = editedTextEn || optimizedResult.declarationTextEn;
                  handleCopyText(textToCopy, "bottom_en");
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 py-3 text-xs font-black text-black hover:brightness-110 shadow-lg shadow-amber-500/20"
              >
                {copiedLang === "bottom_en" ? (
                  <>
                    <Check className="h-4 w-4 text-black" />
                    <span>Texto em Inglês Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copiar Declaração para o Agente (CSSBUY)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowExportModal(false)}
                className="rounded-xl border border-zinc-800 px-4 py-3 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
