export type Region = {
  countryCode: string;
  country: string;
  currency: string;
  flag: string;
  languages: string[];
};

export const REGIONS: Region[] = [
  { countryCode: "AU", country: "Australia", currency: "AUD", flag: "🇦🇺", languages: ["en"] },
  { countryCode: "CA", country: "Canada", currency: "CAD", flag: "🇨🇦", languages: ["en", "fr"] },
  { countryCode: "GH", country: "Ghana", currency: "GHS", flag: "🇬🇭", languages: ["en"] },
  { countryCode: "IN", country: "India", currency: "INR", flag: "🇮🇳", languages: ["en", "hi"] },
  { countryCode: "IE", country: "Ireland", currency: "EUR", flag: "🇮🇪", languages: ["en", "ga"] },
  { countryCode: "KE", country: "Kenya", currency: "KES", flag: "🇰🇪", languages: ["en", "sw"] },
  { countryCode: "NG", country: "Nigeria", currency: "NGN", flag: "🇳🇬", languages: ["en"] },
  { countryCode: "NZ", country: "New Zealand", currency: "NZD", flag: "🇳🇿", languages: ["en"] },
  { countryCode: "ZA", country: "South Africa", currency: "ZAR", flag: "🇿🇦", languages: ["en"] },
  { countryCode: "AE", country: "United Arab Emirates", currency: "AED", flag: "🇦🇪", languages: ["ar", "en"] },
  { countryCode: "GB", country: "United Kingdom", currency: "GBP", flag: "🇬🇧", languages: ["en"] },
  { countryCode: "US", country: "United States", currency: "USD", flag: "🇺🇸", languages: ["en"] },
];

export function getStoredUser(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem("urbanhelphub_user") || sessionStorage.getItem("urbanhelphub_user");
  if (!value) return null;
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function storedCurrency(fallback = "CAD") {
  const value = getStoredUser()?.currency_code;
  return typeof value === "string" ? value : fallback;
}

export function formatMoney(amount: string | number, currency = "CAD") {
  const value = Number(amount);
  if (!Number.isFinite(value)) return `0.00 ${currency}`;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}
