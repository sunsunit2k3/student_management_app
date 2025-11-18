import type { ReactNode } from "react";
import { useEffect } from "react";
import LoadingOverlay from "../components/ui/LoadingOverlay";
import { useLoadingStore } from "../stores/useLoadingStore";

export function LoadingProvider({ children }: { children: ReactNode }) {
  // Select the primitive `loading` to avoid subscribing to the whole state object
  // which may cause unnecessary re-renders.
  const loading = useLoadingStore((state) => state.loading);
  
  return (
    <>
      {loading && <LoadingOverlay />}
      {children}
    </>
  );
}
