import { createRoot } from "react-dom/client";
import App from "./App";
import './styles/theme.css';
import './index.css'; // (your tailwind css)


createRoot(document.getElementById("root")!).render(<App />);
