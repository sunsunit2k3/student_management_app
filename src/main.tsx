import { createRoot } from "react-dom/client";
import "./index.css";
import "react-toastify/dist/ReactToastify.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { LoadingProvider } from "./provider/loadingProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <AppWrapper>
      <LoadingProvider>
        <App />
      </LoadingProvider>
    </AppWrapper>
  </ThemeProvider>,
);
