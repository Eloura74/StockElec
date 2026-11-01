"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyReferenceButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Référence copiée !" : `Copier la référence "${text}"`}
      className={`inline-flex items-center gap-1 font-mono text-[11px] px-1.5 py-0.5 rounded-md transition-all cursor-pointer ${
        copied
          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold scale-105"
          : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
      }`}
    >
      <span>{text}</span>
      {copied ? (
        <Check className="h-3 w-3 text-emerald-500 animate-in zoom-in-50 duration-150" />
      ) : (
        <Copy className="h-2.5 w-2.5 opacity-0 group-hover:opacity-70 transition-opacity" />
      )}
    </button>
  );
}
