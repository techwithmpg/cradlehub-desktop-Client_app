import React from 'react';

export interface ModulePaginationProps {
  startRecord: number;
  endRecord: number;
  totalItems: number;
  entityLabel?: string;
  pageSize: number;
  pageSizeOptions?: number[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  prevPageAriaLabel?: string;
  nextPageAriaLabel?: string;
  className?: string;
  testId?: string;
  showPageSizeSelector?: boolean;
}

/**
 * ModulePagination
 *
 * Canonical in-card pagination footer with count summaries, page size selection, and navigation controls.
 */
export const ModulePagination: React.FC<ModulePaginationProps> = ({
  startRecord,
  endRecord,
  totalItems,
  entityLabel = 'records',
  pageSize,
  pageSizeOptions = [10, 25, 50],
  currentPage,
  totalPages,
  onPageChange,
  onPageSizeChange,
  prevPageAriaLabel = 'Previous page',
  nextPageAriaLabel = 'Next page',
  className = '',
  testId = 'module-pagination',
  showPageSizeSelector = true,
}) => {
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages || 1);

  return (
    <div
      className={`bookings-table-footer ${className}`.trim()}
      data-testid={testId}
    >
      <div className="footer-count-text">
        Showing <span className="count-highlight">{startRecord}</span>–
        <span className="count-highlight">{endRecord}</span> of{' '}
        <span className="count-highlight">{totalItems}</span> {entityLabel}
      </div>

      <div className="footer-pagination-controls">
        {showPageSizeSelector && onPageSizeChange && (
          <div className="page-size-selector-wrapper">
            <span className="page-size-label">Rows per page:</span>
            <select
              className="page-size-select"
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              aria-label="Rows per page"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="pagination-buttons">
          <button
            type="button"
            className="pagination-btn"
            onClick={() => onPageChange(Math.max(1, validCurrentPage - 1))}
            disabled={validCurrentPage <= 1}
            aria-label={prevPageAriaLabel}
          >
            &larr; Prev
          </button>

          <span className="pagination-page-indicator">
            Page {validCurrentPage} of {totalPages || 1}
          </span>

          <button
            type="button"
            className="pagination-btn"
            onClick={() =>
              onPageChange(Math.min(totalPages, validCurrentPage + 1))
            }
            disabled={validCurrentPage >= totalPages || totalPages === 0}
            aria-label={nextPageAriaLabel}
          >
            Next &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
