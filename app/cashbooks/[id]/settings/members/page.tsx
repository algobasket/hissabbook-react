"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import AppShell from "../../../../components/AppShell";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import { getAuthToken, getUser } from "../../../../utils/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "/backend");

interface BookMember {
  id: string;
  email: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  addedAt: string;
  role?: string;
  isOwner?: boolean;
}

interface Book {
  id: string;
  name: string;
  description: string | null;
  currencyCode: string;
  ownerId: string;
}

export default function BookMembersSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const bookId = params?.id as string;

  const [book, setBook] = useState<Book | null>(null);
  const [members, setMembers] = useState<BookMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [roles, setRoles] = useState<Array<{ id: string; name: string; description: string | null; permissions: Array<{ name: string; description: string }> }>>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const currentUser = getUser();

  useEffect(() => {
    if (bookId) {
      fetchBook();
      fetchMembers();
    }
  }, [bookId]);

  const fetchBook = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const response = await fetch(`${API_BASE}/api/books/${bookId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBook(data.book);
      }
    } catch (err) {
      console.error("Error fetching book:", err);
    }
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const response = await fetch(`${API_BASE}/api/books/${bookId}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch members");
      }

      const data = await response.json();
      setMembers(data.users || []);
    } catch (err) {
      console.error("Error fetching members:", err);
      setError(err instanceof Error ? err.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersForAdd = async () => {
    try {
      setLoadingUsers(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      // Fetch all available users
      const allUsersResponse = await fetch(`${API_BASE}/api/users/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!allUsersResponse.ok) {
        throw new Error("Failed to fetch users");
      }

      const allUsersData = await allUsersResponse.json();
      const allUsers = allUsersData.users || [];

      // Filter out users who are already members (including owner)
      const memberIds = new Set(members.map((m) => m.id));
      // Also exclude the owner if they're not already in the members list
      if (book?.ownerId) {
        memberIds.add(book.ownerId);
      }
      const available = allUsers.filter((u: any) => !memberIds.has(u.id));
      setAvailableUsers(available);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAddMemberClick = () => {
    setShowAddMemberModal(true);
    fetchUsersForAdd();
  };

  const fetchRolePermissions = async () => {
    try {
      setLoadingPermissions(true);
      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE}/api/books/role-permissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}: ${response.statusText}` }));
        console.error("Failed to fetch role permissions:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw new Error(errorData.message || `Failed to fetch role permissions: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched roles data:", data);
      setRoles(data.roles || []);
      // Set first role as selected by default
      if (data.roles && data.roles.length > 0) {
        setSelectedRoleId(data.roles[0].id);
      }
    } catch (err) {
      console.error("Error fetching role permissions:", err);
      // Fallback to empty roles if API fails
      setRoles([]);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleViewRolesClick = async () => {
    setShowRolesModal(true);
    // Fetch permissions when opening modal
    await fetchRolePermissions();
  };

  const handleAddMemberSubmit = async () => {
    if (!selectedUserId) return;

    try {
      setAddingMember(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE}/api/books/${bookId}/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUserId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to add member");
      }

      setShowAddMemberModal(false);
      setSelectedUserId("");
      setAvailableUsers([]);
      fetchMembers(); // Refresh members list
    } catch (err) {
      console.error("Error adding member:", err);
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    // Prevent removing the owner
    const member = members.find(m => m.id === userId);
    if (member && (member.isOwner || member.id === book?.ownerId)) {
      alert("Cannot remove the book owner from members");
      return;
    }

    if (!window.confirm("Are you sure you want to remove this member from the book?")) {
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE}/api/books/${bookId}/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to remove member");
      }

      fetchMembers(); // Refresh members list
    } catch (err) {
      console.error("Error removing member:", err);
      setError(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  const getMemberRole = (member: BookMember): string => {
    // Check if member is the owner (using isOwner flag or comparing IDs)
    if ((member as any).isOwner || member.id === book?.ownerId) {
      return "Owner";
    }
    // Check if member is current user
    if (member.id === currentUser?.id) {
      return "Partner";
    }
    // Default role (can be enhanced with role management later)
    return "Partner";
  };

  const getRoleColor = (role: string): string => {
    switch (role.toLowerCase()) {
      case "owner":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "partner":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "admin":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "viewer":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getAvatarColor = (name: string): string => {
    const colors = [
      "bg-gradient-to-br from-blue-500 to-blue-600",
      "bg-gradient-to-br from-purple-500 to-purple-600",
      "bg-gradient-to-br from-pink-500 to-pink-600",
      "bg-gradient-to-br from-red-500 to-red-600",
      "bg-gradient-to-br from-orange-500 to-orange-600",
      "bg-gradient-to-br from-emerald-500 to-emerald-600",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <ProtectedRoute>
      <AppShell activePath="/cashbooks">
        <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/cashbooks")}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#2f4bff] transition"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Settings ({book?.name || "Book"})
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/cashbooks/${bookId}`)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Rename Book
              </button>
              <button
                onClick={() => {
                  // Handle duplicate
                }}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Duplicate Book
              </button>
              <button
                onClick={() => {
                  // Handle delete
                }}
                className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Delete Book
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{error}</div>
          )}

          {/* Members Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-[#1f2937]">Members</h2>
              <p className="mt-1 text-sm text-slate-500">Add, Change role, Remove.</p>
            </div>

            {/* Add Members Section */}
            <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="mb-2 text-base font-semibold text-[#1f2937]">Add Members</h3>
              <p className="mb-4 text-sm text-slate-600">
                Manage your cashflow together with your business partners, family or friends by adding them as members.
              </p>
              <button
                onClick={handleAddMemberClick}
                className="flex items-center gap-2 rounded-xl bg-[#2f4bff] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#2f4bff]/90 transition"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add member
              </button>
            </div>

            {/* Total Members */}
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#1f2937]">Total Members ({members.length})</h3>
              <button 
                onClick={handleViewRolesClick}
                className="text-sm font-medium text-[#2f4bff] hover:underline"
              >
                View roles & permissions &gt;
              </button>
            </div>

            {/* Members List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-[#2f4bff]"></div>
              </div>
            ) : members.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-sm text-slate-500">No members added yet. Click "Add member" to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => {
                  const role = getMemberRole(member);
                  const isCurrentUser = member.id === currentUser?.id;
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 hover:shadow-sm transition"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-full text-white font-semibold ${getAvatarColor(
                            member.name || member.email
                          )}`}
                        >
                          {(member.name || member.email || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-base font-semibold text-[#1f2937]">
                              {isCurrentUser ? "You" : member.name || member.email}
                            </p>
                            {member.phone && (
                              <span className="text-sm text-slate-500">{member.phone}</span>
                            )}
                          </div>
                          {member.email && (
                            <p className="mt-1 text-sm text-slate-500">{member.email}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-lg border px-3 py-1 text-xs font-semibold ${getRoleColor(role)}`}
                        >
                          {role}
                        </span>
                        {!isCurrentUser && !member.isOwner && member.id !== book?.ownerId && (
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600 transition"
                            title="Remove member"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Entry Field Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-1 text-lg font-semibold text-[#1f2937]">
              Entry Field <span className="text-rose-500">*</span>
            </h2>
            <p className="text-sm text-slate-500">Party, Category, Payment mode & Custom Fields.</p>
          </div>

          {/* Edit Data Operator Role Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-1 text-lg font-semibold text-[#1f2937]">Edit Data Operator Role</h2>
            <p className="text-sm text-slate-500">Make changes in role as per your need.</p>
          </div>
        </div>

        {/* Add Member Modal */}
        {showAddMemberModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-[#1f2937]">Add Member to {book?.name}</h2>
                <button
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setSelectedUserId("");
                    setAvailableUsers([]);
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                {loadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-[#2f4bff]"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="select-user" className="block text-sm font-medium text-slate-700 mb-2">
                        Select User to Add <span className="text-rose-500">*</span>
                      </label>
                      {availableUsers.length === 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                          {members.length > 0
                            ? "All available users are already members of this book"
                            : "No users available to add"}
                        </div>
                      ) : (
                        <select
                          id="select-user"
                          value={selectedUserId}
                          onChange={(e) => setSelectedUserId(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                        >
                          <option value="">Select a user...</option>
                          {availableUsers.map((user) => {
                            const displayName =
                              user.name ||
                              (user.firstName || user.lastName
                                ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                                : user.email?.split("@")[0] || "Unknown");
                            return (
                              <option key={user.id} value={user.id}>
                                {displayName} ({user.email})
                              </option>
                            );
                          })}
                        </select>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setSelectedUserId("");
                    setAvailableUsers([]);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  disabled={addingMember}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMemberSubmit}
                  disabled={addingMember || !selectedUserId || availableUsers.length === 0}
                  className="rounded-xl bg-[#2f4bff] px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#2f4bff]/90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {addingMember ? "Adding..." : "Add Member"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Roles & Permissions Modal */}
        {showRolesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-[#1f2937]">Roles & Permissions</h2>
                <button
                  onClick={() => setShowRolesModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                {/* Role Selection */}
                {roles.length === 0 ? (
                  <div className="mb-6 py-4 text-center text-sm text-slate-500">
                    No roles found. Please configure roles in the admin panel.
                  </div>
                ) : (
                  <div className="mb-6 flex flex-wrap gap-2">
                    {roles.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => setSelectedRoleId(role.id)}
                        className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition ${
                          selectedRoleId === role.id
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                        {currentUser?.id === book?.ownerId && role.name === 'managers' ? " (You)" : ""}
                      </button>
                    ))}
                  </div>
                )}

                {/* Permissions List */}
                <div>
                  <h3 className="mb-4 text-base font-semibold text-[#1f2937]">Permissions</h3>
                  {loadingPermissions ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-3 border-slate-300 border-t-[#2f4bff]"></div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(() => {
                        const selectedRole = roles.find(r => r.id === selectedRoleId);
                        console.log("Selected role:", selectedRole);
                        console.log("All roles:", roles);
                        console.log("Selected role ID:", selectedRoleId);
                        
                        if (selectedRole && selectedRole.permissions && selectedRole.permissions.length > 0) {
                          return selectedRole.permissions.map((permission, index) => (
                            <div key={permission.name || `permission-${index}`} className="flex items-start gap-3">
                              <svg
                                className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-sm text-slate-700">
                                {formatPermissionName(permission.description || permission.name)}
                              </span>
                            </div>
                          ));
                        } else {
                          return (
                            <div className="py-4 text-center text-sm text-slate-500">
                              {selectedRole ? "No permissions configured for this role" : "Please select a role"}
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-200 px-6 py-4">
                <button
                  onClick={() => setShowRolesModal(false)}
                  className="rounded-xl bg-[#2f4bff] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#2f4bff]/90 transition"
                >
                  Ok, Got it
                </button>
              </div>
            </div>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}

// Helper function to format permission names for display
function formatPermissionName(permission: string): string {
  // Convert technical permission names to user-friendly descriptions
  const permissionMap: Record<string, string> = {
    "View Cashbooks": "View entries and download reports",
    "Create Cashbooks": "Add Cash In or Cash Out entries",
    "Update Cashbooks": "Edit and delete entries",
    "Delete Cashbooks": "Duplicate and Delete Book",
    "cashbooks.view": "View entries and download reports",
    "cashbooks.create": "Add Cash In or Cash Out entries",
    "cashbooks.update": "Edit and delete entries",
    "cashbooks.delete": "Duplicate and Delete Book",
  };

  // Check if we have a mapping
  if (permissionMap[permission]) {
    return permissionMap[permission];
  }

  // If it's a technical code, convert it to readable text
  if (permission.includes(".")) {
    const parts = permission.split(".");
    const action = parts[1]?.charAt(0).toUpperCase() + parts[1]?.slice(1);
    const resource = parts[0]?.charAt(0).toUpperCase() + parts[0]?.slice(1);
    return `${action} ${resource}`;
  }

  // Return as-is if already readable
  return permission;
}

