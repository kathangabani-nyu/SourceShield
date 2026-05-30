export const DASHBOARD_SECRET_STORAGE_KEY = "sourceshield_dashboard_secret";

export function getDashboardAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  try {
    const secret = sessionStorage.getItem(DASHBOARD_SECRET_STORAGE_KEY);
    return secret ? { Authorization: `Bearer ${secret}` } : {};
  } catch {
    return {};
  }
}

export function storeDashboardSecret(secret: string): void {
  sessionStorage.setItem(DASHBOARD_SECRET_STORAGE_KEY, secret.trim());
}

export function clearDashboardSecret(): void {
  sessionStorage.removeItem(DASHBOARD_SECRET_STORAGE_KEY);
}
