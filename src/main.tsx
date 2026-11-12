import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/barlow-condensed/500.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./index.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Only in the built web app: the dev server serves unbundled modules that the
// cache-first strategy would pin in place. The native shell already ships its
// assets locally, so a service worker there would only risk pinning stale files.
const isNativeShell = Boolean((window as any).Capacitor?.isNativePlatform?.());
if (import.meta.env.PROD && !isNativeShell && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline support is a bonus; the game still runs online.
    });
  });
}
