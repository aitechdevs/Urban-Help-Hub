"use client";

import { createContext, useContext, useSyncExternalStore } from "react";
import { getStoredUser } from "@/lib/regions";
import { translate } from "@/lib/i18n";

const LanguageContext = createContext({ language: "en", t: (key: string) => translate("en", key) });

export default function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language = useSyncExternalStore(
    () => () => undefined,
    () => {
      const value = getStoredUser()?.language_code;
      return typeof value === "string" ? value : "en";
    },
    () => "en"
  );

  return (
    <LanguageContext.Provider value={{ language, t: (key) => translate(language, key) }}>
      <div lang={language} dir={language === "ar" ? "rtl" : "ltr"}>{children}</div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
