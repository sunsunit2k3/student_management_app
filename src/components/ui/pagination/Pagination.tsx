export default function Pagination(props: {
  page: number;
  size: number;
  total: number;
  onPageChange: (p: number) => void;
  onSizeChange?: (s: number) => void;
}) {
  const { page, size, total, onPageChange, onSizeChange } = props;

  const totalPages = Math.max(1, Math.ceil(total / size));

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
          className="px-3 py-2 border border-gray-300 rounded-lg text-base text-[var(--color-gray-700)] dark:text-gray-200 hover:bg-gray-50 disabled:opacity-50"
          disabled={page <= 0}
        >
          Prev
        </button>

        {/* MÀU CHỮ ĐÃ CHỈNH */}
        <span className="text-base text-[var(--color-gray-700)] dark:text-gray-200">
          Page {page + 1} / {totalPages}
        </span>

        <button
          onClick={next}
          className="px-3 py-2 border border-gray-300 rounded-lg text-base text-[var(--color-gray-700)] dark:text-gray-200 hover:bg-gray-50 disabled:opacity-50"
          disabled={page >= totalPages - 1}
        >
          Next
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-base text-[var(--color-gray-700)] dark:text-gray-200">Show</label>
        <select
          value={size}
          onChange={(e) => onSizeChange && onSizeChange(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-base bg-white dark:bg-transparent text-[var(--color-gray-700)] dark:text-gray-200"
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
