// Authentication utility functions

export interface User {
  id: string;
  email: string;
  status: string;
  roles?: string[];
  role?: string;
  phone?: string;
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken");
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("authToken", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

export function getUserRole(): string | null {
  const user = getUser();
  return user?.role || user?.roles?.[0] || null;
}

export function hasRole(role: string): boolean {
  const user = getUser();
  if (!user) return false;
  return user.roles?.includes(role) || user.role === role || false;
}

export function isAdmin(): boolean {
  return hasRole("admin");
}

export function isStaff(): boolean {
  return hasRole("staff");
}

export function isAgent(): boolean {
  return hasRole("agents");
}

export function isManager(): boolean {
  return hasRole("managers");
}

export function isAuditor(): boolean {
  return hasRole("auditor");
}

// Check if user can access the regular app (not admin)
export function canAccessApp(): boolean {
  const role = getUserRole();
  // Admin should use admin panel, others can use regular app
  return role !== "admin" && (role === "staff" || role === "agents" || role === "managers" || role === "auditor");
}

// Check if user can access admin panel
export function canAccessAdmin(): boolean {
  return isAdmin();
}

// Permission checking functions
let cachedPermissions: string[] | null = null;
let permissionsCacheTime: number = 0;
const PERMISSIONS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function fetchUserPermissions(): Promise<string[]> {
  const now = Date.now();
  // Return cached permissions if still valid
  if (cachedPermissions && (now - permissionsCacheTime) < PERMISSIONS_CACHE_DURATION) {
    return cachedPermissions || [];
  }

  const token = getAuthToken();
  if (!token) {
    return [];
  }

  const API_BASE =
    process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
    (typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "http://localhost:5000"
      : "/backend");

  try {
    const response = await fetch(`${API_BASE}/api/users/me/permissions`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch user permissions");
      return [];
    }

    const data = await response.json();
    cachedPermissions = data.permissions || [];
    permissionsCacheTime = now;
    return cachedPermissions || [];
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return [];
  }
}

export function clearPermissionsCache(): void {
  cachedPermissions = null;
  permissionsCacheTime = 0;
}

export async function hasPermission(permissionCode: string): Promise<boolean> {
  const permissions = await fetchUserPermissions();
  return permissions.includes(permissionCode);
}

// Synchronous check using cached permissions (may return false if not cached yet)
export function hasPermissionSync(permissionCode: string): boolean {
  if (!cachedPermissions) {
    // If not cached, return false and trigger async fetch
    fetchUserPermissions();
    return false;
  }
  return cachedPermissions.includes(permissionCode);
}







