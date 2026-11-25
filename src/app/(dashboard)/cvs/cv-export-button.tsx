"use client";

import { useState, type MouseEvent } from "react";

import { Button } from "@/components/ui/button";

export function CvExportButton({ href }: { href?: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function download(event: MouseEvent<HTMLButtonElement>) {
    if (!href || pending) return;
    setPending(true);
    setError("");
    try {
      // Export the same document the employee reviewed, without the interactive controls.
      const article = event.currentTarget.closest("[data-cv-preview-document]");
      if (!article) throw new Error("Missing preview document");
      const copy = article.cloneNode(true) as HTMLElement;
      copy.querySelector("[data-cv-export-controls]")?.remove();
      const response = await fetch(href, { method: "POST", body: copy.outerHTML, cache: "no-store" });
      const filename = response.headers.get("Content-Disposition")?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
      if (!response.ok || response.headers.get("Content-Type") !== "application/pdf" || !filename) {
        throw new Error("PDF download failed");
      }
      const name = decodeURIComponent(filename);
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch {
      setError("Failed to export PDF. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div data-cv-export-controls className="ml-auto text-right">
      <Button variant="outline" disabled={!href || pending} aria-busy={pending} onClick={download}
        className="h-10 min-w-40 rounded-full border-[#b31f24] bg-transparent px-5 text-[#b31f24] uppercase hover:text-[#b31f24]">
        {pending ? "Exporting…" : "Export PDF"}
      </Button>
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
