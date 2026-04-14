import { RouterProvider } from "react-router";
import { router } from "./routes";
import { LanguageProvider } from "../i18n/LanguageContext";

export default function App() {
  return (
    <LanguageProvider>
      <RouterProvider router={router} />
    </LanguageProvider>
  );
}