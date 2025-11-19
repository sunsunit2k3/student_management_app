import { RingLoader } from "react-spinners";

export default function LoadingOverlay() {
  return (
    <div
      className="
        fixed inset-0 flex items-center justify-center 
        z-[999999] transition-all duration-300

        /* Background theo theme */
        bg-[var(--color-gray-50)]/80 
        dark:bg-[var(--color-gray-900)]/80
      "
    >
      <RingLoader color="var(--color-brand-500)" size={80} />
    </div>
  );
}
