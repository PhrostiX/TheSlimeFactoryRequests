"use client";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  const showPages = 2; // Show 2 pages before and after current

  // Calculate page range
  let startPage = Math.max(1, currentPage - showPages);
  let endPage = Math.min(totalPages, currentPage + showPages);

  // Add page numbers
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div style={styles.container}>
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        style={styles.button}
        className="pagination-btn"
      >
        First
      </button>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={styles.button}
        className="pagination-btn"
      >
        Previous
      </button>

      <div style={styles.pages}>
        {pages.map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === "number" && onPageChange(page)}
            style={{
              ...styles.pageButton,
              ...(page === currentPage ? styles.pageButtonActive : {}),
            }}
            className="pagination-page-btn"
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={styles.button}
        className="pagination-btn"
      >
        Next
      </button>
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        style={styles.button}
        className="pagination-btn"
      >
        Last
      </button>

      <style jsx>{`
        .pagination-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .pagination-btn:not(:disabled):hover {
          background: var(--accent);
          color: white;
          transform: translateY(-2px);
        }
        .pagination-page-btn:hover {
          background: var(--accent);
          color: white;
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    flexWrap: "wrap",
  },
  button: {
    padding: "10px 16px",
    borderRadius: 8,
    border: "1px solid var(--glass-border)",
    background: "var(--glass-bg)",
    color: "var(--foreground)",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 200ms ease",
  },
  pages: {
    display: "flex",
    gap: 6,
  },
  pageButton: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid var(--glass-border)",
    background: "var(--glass-bg)",
    color: "var(--foreground)",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 200ms ease",
    minWidth: 40,
  },
  pageButtonActive: {
    background: "var(--accent)",
    color: "white",
    fontWeight: 600,
    borderColor: "var(--accent)",
  },
};
