"use client";

import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface InspectionReportViewerProps {
  url: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InspectionReportViewer({
  url,
  open,
  onOpenChange,
}: InspectionReportViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages: total }: { numPages: number }) => {
      setNumPages(total);
      setPageNumber(1);
      setLoading(false);
    },
    [],
  );

  function goToPrev() {
    setPageNumber((p) => Math.max(1, p - 1));
  }
  function goToNext() {
    setPageNumber((p) => Math.min(numPages, p + 1));
  }
  function zoomIn() {
    setScale((s) => Math.min(2.0, s + 0.25));
  }
  function zoomOut() {
    setScale((s) => Math.max(0.5, s - 0.25));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-4xl flex-col gap-0 p-0">
        <DialogHeader className="flex flex-row items-center justify-between border-b px-4 py-3">
          <DialogTitle className="text-sm font-semibold">
            성능·상태 점검기록부
          </DialogTitle>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="rounded-lg p-2 transition-colors hover:bg-[var(--chayong-surface)] disabled:opacity-30"
              aria-label="축소"
            >
              <ZoomOut size={16} />
            </button>
            <span
              className="text-xs tabular-nums"
              style={{ color: "var(--chayong-text-sub)" }}
            >
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={zoomIn}
              disabled={scale >= 2.0}
              className="rounded-lg p-2 transition-colors hover:bg-[var(--chayong-surface)] disabled:opacity-30"
              aria-label="확대"
            >
              <ZoomIn size={16} />
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          {loading && (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--chayong-primary)] border-t-transparent" />
            </div>
          )}
          <div className="flex justify-center">
            <Document
              file={url}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={null}
              error={
                <div
                  className="flex h-64 items-center justify-center text-sm"
                  style={{ color: "var(--chayong-text-sub)" }}
                >
                  PDF를 불러올 수 없습니다
                </div>
              }
            >
              <Page pageNumber={pageNumber} scale={scale} className="shadow-lg" />
            </Document>
          </div>
        </div>

        {numPages > 1 && (
          <div
            className="flex items-center justify-center gap-4 border-t px-4 py-3"
            style={{ borderColor: "var(--chayong-divider)" }}
          >
            <button
              type="button"
              onClick={goToPrev}
              disabled={pageNumber <= 1}
              className="rounded-lg p-2 transition-colors hover:bg-[var(--chayong-surface)] disabled:opacity-30"
              aria-label="이전 페이지"
            >
              <ChevronLeft size={18} />
            </button>
            <span
              className="text-sm tabular-nums"
              style={{ color: "var(--chayong-text)" }}
            >
              {pageNumber} / {numPages}
            </span>
            <button
              type="button"
              onClick={goToNext}
              disabled={pageNumber >= numPages}
              className="rounded-lg p-2 transition-colors hover:bg-[var(--chayong-surface)] disabled:opacity-30"
              aria-label="다음 페이지"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
