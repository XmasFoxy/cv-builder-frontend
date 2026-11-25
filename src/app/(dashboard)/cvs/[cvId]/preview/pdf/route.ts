import { gql } from "@apollo/client";

import { createApolloClient } from "@/lib/apollo-client";
import { authenticatedRequest, isRejected, withMutationSession } from "@/lib/session";

import { loadCvPreviewForExport } from "../../../cv-preview-data";
import { isCvId } from "../../../cvs-url";

const EXPORT_PDF = gql`
  mutation ExportEmployeeCvPdf($pdf: ExportPdfInput!) {
    exportPdf(pdf: $pdf)
  }
`;

const noStore = { "Cache-Control": "private, no-store" };

export async function POST(request: Request, { params }: RouteContext<"/cvs/[cvId]/preview/pdf">) {
  const { cvId } = await params;
  if (!isCvId(cvId)) return new Response(null, { status: 404, headers: noStore });
  let document: string | undefined;

  const result = await withMutationSession(async (token) => {
    const cv = await loadCvPreviewForExport(cvId, token);
    if (cv === "expired" || cv === "unavailable") return cv;
    if (cv === "not-found") return new Response(null, { status: 404, headers: noStore });
    if (cv.status === "empty") return new Response(null, { status: 422, headers: noStore });

    document ??= await request.text();
    if (!document) return new Response(null, { status: 400, headers: noStore });
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body class="cv-preview-print">${document}</body></html>`;
    const auth = authenticatedRequest(token);
    let encoded: string | undefined;
    try {
      const { data } = await createApolloClient().mutate<{ exportPdf: string }>({
        mutation: EXPORT_PDF,
        variables: { pdf: { cvId, html, margin: { top: "14mm", bottom: "14mm", left: "15mm", right: "15mm" } } },
        ...auth,
        context: { ...auth.context, fetchOptions: { ...auth.context.fetchOptions, signal: AbortSignal.timeout(35_000) } },
      });
      encoded = data?.exportPdf;
    } catch (error) {
      if (isRejected(error, "unauthorized")) return "expired";
      if (isRejected(error, "notOwnCv") || isRejected(error, "cvNotFound")) {
        return new Response(null, { status: 404, headers: noStore });
      }
    }
    if (!encoded) return new Response(null, { status: 502, headers: noStore });

    const slug = cv.name.normalize("NFC").toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
    const filename = `${[...slug].slice(0, 120).join("") || "cv"}.pdf`;
    const asciiFilename = /^[a-z0-9.-]+$/.test(filename) ? filename : "cv.pdf";
    return new Response(Uint8Array.from(Buffer.from(encoded, "base64")), {
      headers: {
        ...noStore,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  });

  if (typeof result !== "string") return result;
  return new Response(null, { status: result === "expired" ? 401 : 503, headers: noStore });
}
