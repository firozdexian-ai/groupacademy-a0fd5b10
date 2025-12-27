import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";

// Initialize app recovery mechanisms BEFORE React mounts
import { initializeAppRecovery } from "./lib/appRecovery";

console.log("[Boot] App bootstrap starting...");
initializeAppRecovery();

console.log("[Boot] Mounting React app...");
createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <App />
  </ThemeProvider>
);
console.log("[Boot] React app mounted");
