/** Numbered pagination links; `hrefFor` builds each page's URL so the
 *  component stays query-param agnostic. */
export default function PaginationNav({ page, pageCount, hrefFor }: { page: number; pageCount: number; hrefFor: (page: number) => string }) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);
  return (
    <nav aria-label="Pagination" className="pagination-nav flex items-center gap-1">
      {page > 1 && (
        <a href={hrefFor(page - 1)} className="pagination-prev rounded-lg px-3 py-1.5 text-sm hover:bg-mist">
          ‹ Prev
        </a>
      )}
      {pages.map((pageNumber) =>
        pageNumber === page ? (
          <span key={pageNumber} aria-current="page" className="pagination-item pagination-item-current rounded-lg bg-ink px-3 py-1.5 text-sm font-semibold text-white">
            {pageNumber}
          </span>
        ) : (
          <a key={pageNumber} href={hrefFor(pageNumber)} className="pagination-item rounded-lg px-3 py-1.5 text-sm hover:bg-mist">
            {pageNumber}
          </a>
        ),
      )}
      {page < pageCount && (
        <a href={hrefFor(page + 1)} className="pagination-next rounded-lg px-3 py-1.5 text-sm hover:bg-mist">
          Next ›
        </a>
      )}
    </nav>
  );
}
