import { RetryButton } from "@/components/layout/retry-button";

import { CvDetailsFrame } from "./cv-details-frame";
import { CvExportButton } from "./cv-export-button";
import { getCvPreview } from "./cv-preview-data";
import { CvPreviewDocument } from "./cv-preview-document";
import { cvPdfHref, cvPreviewHref, type CvsQuery } from "./cvs-url";

export async function CvPreviewContent({ cvId, query }: { cvId: string; query: CvsQuery }) {
  const cv = await getCvPreview(cvId, cvPreviewHref(cvId, query));
  return (
    <CvDetailsFrame cvId={cvId} query={query} name={cv?.name} tab="Preview">
      {cv?.status === "ready" ? <CvPreviewDocument cv={cv} action={<CvExportButton href={cvPdfHref(cvId, query)} />} /> : (
        <div>
          <CvExportButton />
          {cv ? <p role="status">CV preview is not available.</p> : (
            <>
              <p role="alert">Failed to load CV preview.</p>
              <RetryButton />
            </>
          )}
        </div>
      )}
    </CvDetailsFrame>
  );
}

export function CvPreviewLoading() {
  return (
    <div role="status">
      <CvExportButton />
      <p>Loading CV preview…</p>
      <div aria-hidden="true" className="mt-6 space-y-4 motion-safe:animate-pulse">
        <div className="h-8 w-1/3 bg-muted" />
        <div className="h-32 bg-muted" />
      </div>
    </div>
  );
}
