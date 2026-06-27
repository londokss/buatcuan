import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./lib/register-service-worker";

createRoot(document.getElementById("root")!).render(<App />);
registerServiceWorker();
