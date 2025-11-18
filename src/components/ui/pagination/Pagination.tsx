export default function Pagination(props: {
  page: number;        // zero-based
  size: number;
  total: number;
  onPageChange: (p: number) => void;
  onSizeChange?: (s: number) => void;
}) {
  const { page, size, total, onPageChange, onSizeChange } = props;

  const totalPages = Math.max(1, Math.ceil(total / size)); // totalPages tính theo 1-based

  function prev() {
    onPageChange(Math.max(0, page - 1));
  }

  function next() {
    onPageChange(Math.min(totalPages - 1, page + 1));
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button
          onClick={prev}
          className="px-3 py-2 border border-gray-300 rounded-lg text-base hover:bg-gray-50 disabled:opacity-50"
          disabled={page <= 0}
        >
          Prev
        </button>

        <span className="text-base">
          Page {page + 1} / {totalPages}
        </span>

        <button
          onClick={next}
          className="px-3 py-2 border border-gray-300 rounded-lg text-base hover:bg-gray-50 disabled:opacity-50"
          disabled={page >= totalPages - 1}
        >
          Next
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-base">Show</label>
        <select
          value={size}
          onChange={(e) => onSizeChange && onSizeChange(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-base bg-white dark:bg-transparent"
        >
          {[5, 10, 20, 50].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
