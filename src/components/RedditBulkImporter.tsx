"use client";

import React, { useState } from "react";
import { Product } from "@/types";
import { 
  X, 
  Sparkles, 
  Download, 
  Trash2, 
  ExternalLink, 
  Check, 
  AlertCircle, 
  UploadCloud,
  FileText,
  Link as LinkIcon
} from "lucide-react";

interface RedditBulkImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImportProducts: (newProducts: Product[]) => void;
}

interface DraftItem {
  id: string;
  title: string;
  priceCny: number;
  category: string;
  targetUrl: string;
  imageUrl: string;
  description: string;
}

export default function RedditBulkImporter({
  isOpen,
  onClose,
  onImportProducts,
}: RedditBulkImporterProps) {
  const [redditUrl, setRedditUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [inputMode, setInputMode] = useState<"reddit" | "direct_links" | "text">("direct_links");
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [extractedItems, setExtractedItems] = useState<DraftItem[]>([]);

  if (!isOpen) return null;

  const handleExtract = async () => {
    setErrorMsg(null);
    if (inputMode === "reddit" && !redditUrl.trim()) {
      setErrorMsg("Insira o link de um post do Reddit.");
      return;
    }
    if (inputMode === "direct_links" && !rawText.trim()) {
      setErrorMsg("Insira os links dos produtos (um por linha).");
      return;
    }
    if (inputMode === "text" && !rawText.trim()) {
      setErrorMsg("Cole o texto ou markdown do post do Reddit.");
      return;
    }

    setLoading(true);
    setStatusText("Acessando os links e extraindo fotos reais, modelo e preços em Yuan (¥)...");

    try {
      const res = await fetch("/api/admin/extract-reddit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: inputMode === "reddit" ? redditUrl.trim() : undefined,
          rawText: inputMode !== "reddit" ? rawText.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Não foi possível extrair dados dos links informados.");
      }

      if (!data.products || data.products.length === 0) {
        setErrorMsg("Nenhum produto válido foi identificado nos links informados. Verifique os links e tente novamente.");
        setExtractedItems([]);
      } else {
        const drafts: DraftItem[] = data.products.map((p: any, idx: number) => ({
          id: "draft-" + Date.now() + "-" + idx,
          title: p.title || `Item #${idx + 1}`,
          priceCny: p.priceCny || 150,
          category: p.category || "Camisetas",
          targetUrl: p.targetUrl || "https://weidian.com",
          imageUrl: p.images?.[0] || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800",
          description: p.description || "Curadoria de fornecedores",
        }));
        setExtractedItems(drafts);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Falha ao conectar com o extrator.");
    } finally {
      setLoading(false);
      setStatusText("");
    }
  };

  const handleItemChange = (id: string, field: keyof DraftItem, value: any) => {
    setExtractedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveDraft = (id: string) => {
    setExtractedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleConfirmImport = () => {
    if (extractedItems.length === 0) return;

    const newProducts: Product[] = extractedItems.map((item) => ({
      id: "yw-prod-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
      title: item.title,
      priceCny: Number(item.priceCny) || 120,
      category: item.category,
      targetUrl: item.targetUrl,
      images: [item.imageUrl],
      description: item.description,
      tags: [item.category, "Streetwear", "Importado"],
      active: true,
      createdAt: Date.now(),
      estimatedWeightGrams: item.category === "Tênis" ? 1100 : item.category === "Moletons" ? 750 : 350,
      declarationCategoryPt: item.category,
      declarationCategoryEn: item.category,
      estimatedUsd: Math.round(item.priceCny / 7.1),
    }));

    onImportProducts(newProducts);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative flex flex-col w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 p-5 bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Extrator Automático de Produtos em Massa
              </h3>
              <p className="text-xs text-zinc-400">
                Acessa cada link, identifica o modelo real, foto oficial e preço original em Yuan (¥).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Extraction Form */}
        <div className="p-5 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => { setInputMode("direct_links"); setErrorMsg(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                inputMode === "direct_links"
                  ? "bg-amber-400 text-black font-bold shadow-md shadow-amber-500/20"
                  : "bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              <Download className="h-3.5 w-3.5" />
              <span>Colar Links Diretos (Weidian, Taobao, Yupoo...)</span>
            </button>
            <button
              onClick={() => { setInputMode("text"); setErrorMsg(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                inputMode === "text"
                  ? "bg-amber-400 text-black font-bold shadow-md shadow-amber-500/20"
                  : "bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Texto Completo Copiado</span>
            </button>
            <button
              onClick={() => { setInputMode("reddit"); setErrorMsg(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                inputMode === "reddit"
                  ? "bg-amber-400 text-black font-bold shadow-md shadow-amber-500/20"
                  : "bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              <span>Link do Post Reddit</span>
            </button>
          </div>

          {inputMode === "reddit" ? (
            <div className="flex gap-2">
              <input
                type="url"
                value={redditUrl}
                onChange={(e) => setRedditUrl(e.target.value)}
                placeholder="Ex: https://www.reddit.com/r/FashionReps/comments/1.../my_budget_haul_w2c/"
                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500/60 focus:outline-none"
              />
              <button
                onClick={handleExtract}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 px-5 py-3 text-xs font-bold text-white hover:brightness-110 transition disabled:opacity-50 shadow-lg shadow-red-600/30 border border-red-500/40"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                    <span>Processando...</span>
                  </span>
                ) : (
                  <>
                    <Download className="h-4 w-4 text-amber-400" />
                    <span>Acessar e Extrair Tudo</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                rows={3}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={
                  inputMode === "direct_links"
                    ? "Cole os links dos produtos (um por linha):\nhttps://weidian.com/item.html?itemID=...\nhttps://item.taobao.com/item.htm?id=...\nhttps://...yupoo.com/albums/..."
                    : "Cole aqui o texto, comentários ou descrição copiada do post do Reddit..."
                }
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500/60 focus:outline-none font-mono"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-400">
                  O robô entrará em cada página, buscando o modelo oficial, preço em Yuan e a foto real.
                </span>
                <button
                  onClick={handleExtract}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 px-6 py-2.5 text-xs font-bold text-white transition disabled:opacity-50 shadow-lg shadow-red-600/30 border border-red-500/40"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                      <span>Entrando nos links...</span>
                    </span>
                  ) : (
                    <>
                      <Download className="h-4 w-4 text-amber-400" />
                      <span>Processar e Extrair Produtos</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {loading && (
            <div className="mt-3 flex items-center gap-2 text-xs text-amber-400 animate-pulse">
              <Sparkles className="h-4 w-4" />
              <span>{statusText || "Acessando links e identificando fotos reais..."}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Extracted Products Preview Table */}
        <div className="flex-1 overflow-y-auto p-5">
          {extractedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-zinc-500">
              <UploadCloud className="h-10 w-10 text-zinc-700 mb-2 stroke-1" />
              <p className="text-xs text-zinc-400">Nenhum produto extraído ainda.</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Cole o link ou texto de um post do Reddit acima para carregar dezenas de itens com foto e link de uma só vez.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  {extractedItems.length} Produtos Prontos para Importação
                </span>
                <span className="text-[11px] text-zinc-400">
                  Revise os nomes, fotos e preços antes de confirmar.
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-3 w-16">Foto</th>
                      <th className="p-3">Modelo / Nome</th>
                      <th className="p-3 w-28">Preço (¥)</th>
                      <th className="p-3 w-32">Categoria</th>
                      <th className="p-3">Link Fornecedor</th>
                      <th className="p-3 w-12 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {extractedItems.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-900/40">
                        <td className="p-3">
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="h-12 w-12 rounded-lg object-cover bg-zinc-900 border border-zinc-800 shrink-0"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => handleItemChange(item.id, "title", e.target.value)}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-100"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            value={item.priceCny}
                            onChange={(e) => handleItemChange(item.id, "priceCny", e.target.value)}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-amber-400 font-bold"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={item.category}
                            onChange={(e) => handleItemChange(item.id, "category", e.target.value)}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200"
                          >
                            <option value="Camisetas">Camisetas</option>
                            <option value="Moletons">Moletons</option>
                            <option value="Calças">Calças</option>
                            <option value="Tênis">Tênis</option>
                            <option value="Jaquetas">Jaquetas</option>
                            <option value="Acessórios">Acessórios</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1 max-w-[200px]">
                            <input
                              type="url"
                              value={item.targetUrl}
                              onChange={(e) => handleItemChange(item.id, "targetUrl", e.target.value)}
                              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-400 truncate"
                            />
                            <a
                              href={item.targetUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-zinc-500 hover:text-white"
                            >
                              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                            </a>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleRemoveDraft(item.id)}
                            className="text-zinc-500 hover:text-rose-400 p-1"
                            title="Remover este item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-zinc-800 p-4 bg-zinc-900/50">
          <span className="text-xs text-zinc-400">
            {extractedItems.length} {extractedItems.length === 1 ? "produto selecionado" : "produtos selecionados"}
          </span>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-zinc-800 px-4 py-2 text-xs text-zinc-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={extractedItems.length === 0}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:brightness-110 transition disabled:opacity-50 shadow-lg shadow-red-600/30 border border-red-500/40"
            >
              <Check className="h-4 w-4 text-amber-400" />
              <span>Importar Todos ({extractedItems.length}) Para o Site</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
