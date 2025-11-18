import { RingLoader } from "react-spinners";

export default function LoadingOverlay() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300 z-[999999]">
      <RingLoader color="#465fff" size={80} />
    </div>
  );
}
