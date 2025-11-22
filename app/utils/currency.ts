// Utility functions for currency handling

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "/backend");

let cachedCurrency: string | null = null;
let currencyPromise: Promise<string> | null = null;

/**
 * Get the payment currency setting from the backend
 * Uses caching to avoid multiple API calls
 */
export async function getPaymentCurrency(): Promise<string> {
  // Return cached value if available
  if (cachedCurrency) {
    return cachedCurrency;
  }

  // Return existing promise if already fetching
  if (currencyPromise) {
    return currencyPromise;
  }

  // Fetch currency from backend
  currencyPromise = (async (): Promise<string> => {
    try {
      const response = await fetch(`${API_BASE}/api/settings/payment-currency/public`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const currency = data.currency || "INR";
        cachedCurrency = currency;
        return currency;
      } else {
        // Default to INR on error
        cachedCurrency = "INR";
        return "INR";
      }
    } catch (error) {
      console.error("Error fetching payment currency:", error);
      // Default to INR on error
      cachedCurrency = "INR";
      return "INR";
    } finally {
      currencyPromise = null;
    }
  })();

  return currencyPromise;
}

/**
 * Clear the cached currency (useful after updating settings)
 */
export function clearCurrencyCache(): void {
  cachedCurrency = null;
  currencyPromise = null;
}

/**
 * Get currency name for display
 */
export function getCurrencyName(code: string): string {
  const currencyNames: Record<string, string> = {
    INR: "INR (Indian Rupee)",
    USD: "USD (US Dollar)",
    EUR: "EUR (Euro)",
    GBP: "GBP (British Pound)",
  };
  return currencyNames[code] || code;
}

/**
 * Format amount with currency
 */
export function formatCurrency(amount: number, currencyCode: string = "INR"): string {
  const localeMap: Record<string, string> = {
    INR: "en-IN",
    USD: "en-US",
    EUR: "en-GB",
    GBP: "en-GB",
  };

  const locale = localeMap[currencyCode] || "en-IN";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

