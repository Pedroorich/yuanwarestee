"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, Image as ImageIcon, X, Link as LinkIcon, Check } from "lucide-react";

interface ImageUploaderProps {
  label?: string;
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
  aspectRatio?: "square" | "banner" | "auto";
}

export default function ImageUploader({
  label = "Imagem",
  currentImage = "",
  onImageChange,
  aspectRatio = "auto",
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>(currentImage);
  const [mode, setMode] = useState<"file" | "url">("file");
  const [urlInput, setUrlInput] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 5MB for client-side storage/performance)
    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem selecionada é muito pesada (máximo 5MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPreview(dataUrl);
      onImageChange(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      setPreview(urlInput.trim());
      onImageChange(urlInput.trim());
      setUrlInput("");
    }
  };

  const handleClear = () => {
    setPreview("");
    onImageChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const aspectClass =
    aspectRatio === "square"
      ? "aspect-square max-h-48"
      : aspectRatio === "banner"
      ? "aspect-[16/7] max-h-44"
      : "max-h-48";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-zinc-300 font-semibold text-xs">{label}</label>
        <div className="flex items-center gap-2 text-[10px]">
          <button
            type="button"
            onClick={() => setMode("file")}
            className={`px-2 py-0.5 rounded transition ${
              mode === "file" ? "bg-zinc-800 text-amber-400 font-bold" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Upload do Dispositivo
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`px-2 py-0.5 rounded transition ${
              mode === "url" ? "bg-zinc-800 text-amber-400 font-bold" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Link URL
          </button>
        </div>
      </div>

      {preview ? (
        <div className={`relative overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 ${aspectClass}`}>
          <img
            src={preview}
            alt="Preview"
            className="h-full w-full object-cover object-center"
          />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/70 text-zinc-300 hover:text-white hover:bg-rose-600 transition"
            title="Remover imagem"
          >
            <X className="h-4 w-4" />
          </button>
          <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-zinc-300 backdrop-blur-sm">
            Imagem Carregada
          </span>
        </div>
      ) : mode === "file" ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-800 bg-zinc-900/50 p-6 text-center hover:border-amber-500/50 hover:bg-zinc-900 transition cursor-pointer"
        >
          <UploadCloud className="h-8 w-8 text-zinc-500 mb-2" />
          <p className="text-xs font-semibold text-zinc-200">
            Clique para selecionar ou arraste uma foto
          </p>
          <p className="text-[10px] text-zinc-500 mt-0.5">
            PNG, JPG, WEBP até 5MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Cole a URL da imagem (https://...)"
            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-zinc-100 focus:border-amber-500/60 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            className="rounded-xl bg-amber-400 px-3 py-2 text-xs font-bold text-black hover:bg-amber-300 transition"
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
}
