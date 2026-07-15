"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { clsx } from "clsx";

// ── Helpers ───────────────────────────────────────────────
function getPageNumbers(currentPage, totalPages) {
  // Always show max 7 page slots
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [];

  if (currentPage <= 4) {
    // Near start: 1 2 3 4 5 ... last
    pages.push(1, 2, 3, 4, 5, "...", totalPages);
  } else if (currentPage >= totalPages - 3) {
    // Near end: 1 ... last-4 last-3 last-2 last-1 last
    pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
  } else {
    // Middle: 1 ... prev current next ... last
    pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
  }

  return pages;
}

// ── Page button ───────────────────────────────────────────
function PageButton({ children, active, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "min-w-[36px] h-9 px-2 rounded-lg text-sm font-medium transition-all duration-150 flex items-center justify-center",
        active
          ? "text-white shadow-sm"
          : disabled
          ? "text-gray-300 cursor-not-allowed"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      )}
      style={active ? { backgroundColor: "#059669" } : {}}
    >
      {children}
    </button>
  );
}

// ── Nav button (prev/next/first/last) ─────────────────────
function NavButton({ children, disabled, onClick, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={clsx(
        "w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150",
        disabled
          ? "text-gray-300 cursor-not-allowed"
          : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
      )}
    >
      {children}
    </button>
  );
}

// ── Main Pagination component ─────────────────────────────
export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  showSummary = true,
  showFirstLast = true,
}) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-1">

      {/* Summary */}
      {showSummary && (
        <p className="text-sm text-gray-500 flex-shrink-0">
          Showing{" "}
          <span className="font-semibold text-gray-700">{startItem}</span>
          {" "}–{" "}
          <span className="font-semibold text-gray-700">{endItem}</span>
          {" "}of{" "}
          <span className="font-semibold text-gray-700">{totalItems}</span>
          {" "}results
        </p>
      )}

      {/* Controls */}
      <div className="flex items-center gap-1">

        {/* First page */}
        {showFirstLast && (
          <NavButton
            disabled={currentPage === 1}
            onClick={() => onPageChange(1)}
            title="First page"
          >
            <ChevronsLeft size={15} />
          </NavButton>
        )}

        {/* Prev */}
        <NavButton
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          title="Previous page"
        >
          <ChevronLeft size={15} />
        </NavButton>

        {/* Page numbers */}
        <div className="flex items-center gap-0.5">
          {pages.map((page, index) =>
            page === "..." ? (
              <span
                key={`dots-${index}`}
                className="min-w-[36px] h-9 flex items-center justify-center text-sm text-gray-400"
              >
                ···
              </span>
            ) : (
              <PageButton
                key={page}
                active={page === currentPage}
                onClick={() => page !== currentPage && onPageChange(page)}
              >
                {page}
              </PageButton>
            )
          )}
        </div>

        {/* Next */}
        <NavButton
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          title="Next page"
        >
          <ChevronRight size={15} />
        </NavButton>

        {/* Last page */}
        {showFirstLast && (
          <NavButton
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(totalPages)}
            title="Last page"
          >
            <ChevronsRight size={15} />
          </NavButton>
        )}
      </div>
    </div>
  );
}