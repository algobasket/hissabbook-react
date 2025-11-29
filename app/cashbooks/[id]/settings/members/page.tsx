"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import AppShell from "../../../../components/AppShell";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import { getAuthToken, getUser, getUserRole, isAdmin, fetchUserPermissions, hasPermission } from "../../../../utils/auth";

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
  businessId: string | null;
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
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");

  // Check if user is manager or admin (not staff)
  const isManagerOrAdmin = () => {
    const role = getUserRole();
    return role === "managers" || role === "manager" || isAdmin();
  };

  // Check if user has specific permission
  const hasPermissionCheck = (permissionCode: string) => {
    return userPermissions.includes(permissionCode);
  };
  const [inviteMethod, setInviteMethod] = useState<"existing" | "email" | "phone">("existing");
  const [inviteStep, setInviteStep] = useState<"select" | "role">("select");
  const [inviteRole, setInviteRole] = useState<"Staff" | "Partner">("Staff");
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [renameName, setRenameName] = useState("");
  const [duplicateName, setDuplicateName] = useState("");
  const [duplicateOptions, setDuplicateOptions] = useState({
    duplicateMembers: true,
    duplicateCategories: true,
    duplicatePaymentModes: true,
    duplicateParties: true,
    duplicateCustomFields: true,
  });
  const [saving, setSaving] = useState(false);
  const [removeMemberModalOpen, setRemoveMemberModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<BookMember | null>(null);
  const [removingMember, setRemovingMember] = useState(false);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const currentUser = getUser();

  useEffect(() => {
    if (bookId) {
      fetchBook();
      fetchMembers();
    }
    // Fetch user permissions on mount
    fetchUserPermissions().then(setUserPermissions);
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

      // If book has no business, show empty list (users can still invite via email/phone)
      if (!book?.businessId) {
        setAvailableUsers([]);
        return;
      }

      // Get business info to find owner
      const businessResponse = await fetch(`${API_BASE}/api/businesses`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      let businessOwnerId: string | null = null;
      if (businessResponse.ok) {
        const businessData = await businessResponse.json();
        const business = businessData.businesses?.find((b: any) => b.id === book.businessId);
        if (business) {
          businessOwnerId = business.ownerId;
        }
      }

      // Fetch all books for this business
      const booksResponse = await fetch(`${API_BASE}/api/books?business_id=${book.businessId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const booksData = booksResponse.ok ? await booksResponse.json() : { books: [] };
      const books = booksData.books || [];

      // Collect book owner IDs (Partners) and book member IDs (Staff)
      const bookOwnerIds = new Set<string>();
      const bookMemberIds = new Set<string>();

      // Get all users from books in this business
      for (const bookItem of books) {
        // Track book owners (Partners) - users who own books in this business
        if (bookItem.ownerId && bookItem.ownerId !== businessOwnerId) {
          bookOwnerIds.add(bookItem.ownerId);
        }

        try {
          const bookUsersResponse = await fetch(`${API_BASE}/api/books/${bookItem.id}/users`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (bookUsersResponse.ok) {
            const bookUsersData = await bookUsersResponse.json();
            (bookUsersData.users || []).forEach((user: any) => {
              // Only add if they're not a book owner (isOwner flag) and not the business owner
              // These are Staff members (book members via book_users, not owners)
              if (!user.isOwner && user.id !== businessOwnerId && !bookOwnerIds.has(user.id)) {
                bookMemberIds.add(user.id);
              }
            });
          }
        } catch (err) {
          console.error(`Error fetching users for book ${bookItem.id}:`, err);
        }
      }

      // Fetch user details for staff members only
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

      // Filter to only staff members (book members from this business, not owners)
      const staffUsers = allUsers.filter((user: any) => bookMemberIds.has(user.id));

      // Filter out users who are already members of this book (including owner)
      const memberIds = new Set(members.map((m) => m.id));
      if (book?.ownerId) {
        memberIds.add(book.ownerId);
      }
      const available = staffUsers.filter((u: any) => !memberIds.has(u.id));
      
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
    setInviteStep("select");
    setInviteMethod("existing");
    setInviteEmail("");
    setInvitePhone("");
    setInviteRole("Staff");
    setSelectedUserId("");
    setError(null);
    fetchUsersForAdd();
  };

  const handleInviteMethodChange = (method: "existing" | "email" | "phone") => {
    setInviteMethod(method);
    setSelectedUserId("");
    setInviteEmail("");
    setInvitePhone("");
  };

  const handleInviteNext = () => {
    if (
      (inviteMethod === "existing" && !selectedUserId) ||
      (inviteMethod === "email" && !inviteEmail.trim()) ||
      (inviteMethod === "phone" && !invitePhone.trim())
    ) {
      setError("Please fill in all required fields");
      return;
    }
    setInviteStep("role");
    setError(null);
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
    try {
      setAddingMember(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      let response;

      if (inviteMethod === "existing" && selectedUserId) {
        // Add existing user to book (always as Staff for cashbook members)
        response = await fetch(`${API_BASE}/api/books/${bookId}/users`, {
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
      } else if (inviteMethod === "email" || inviteMethod === "phone") {
        // For Staff: add to cashbook directly if possible, or send invite
        // For Partner: send invite to business (requires business)
        if (inviteRole === "Partner") {
          // Partner requires a business
          if (!book?.businessId) {
            throw new Error("This book is not associated with a business. Partners need business access. Please assign the book to a business first.");
          }

          // Send invite to business as Partner
          const inviteData: any = {
            role: "Partner",
            businessId: book.businessId,
          };

          if (inviteMethod === "email") {
            inviteData.email = inviteEmail.trim();
          } else if (inviteMethod === "phone") {
            inviteData.phone = invitePhone.trim();
          }

          response = await fetch(`${API_BASE}/api/businesses/${book.businessId}/invites`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(inviteData),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to send invite");
          }

          const data = await response.json();
          console.log("Invite sent:", data);
          
          if (inviteMethod === "email") {
            alert(`Invite email sent successfully to ${inviteEmail}. They will receive an email with a link to join the business as Partner.`);
          } else {
            alert(`Invite SMS sent successfully to ${invitePhone}. They will receive an SMS with a link to join the business as Partner.`);
          }
        } else {
          // Staff: can be added to cashbook directly or invited
          if (book?.businessId) {
            // Send invite via business invite API
            const inviteData: any = {
              role: "Staff",
              businessId: book.businessId,
              cashbookId: bookId, // Include cashbook ID from URL
            };

            if (inviteMethod === "email") {
              inviteData.email = inviteEmail.trim();
            } else if (inviteMethod === "phone") {
              inviteData.phone = invitePhone.trim();
            }

            response = await fetch(`${API_BASE}/api/businesses/${book.businessId}/invites`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(inviteData),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.message || "Failed to send invite");
            }

            const data = await response.json();
            console.log("Invite sent:", data);
            
            if (inviteMethod === "email") {
              alert(`Invite email sent successfully to ${inviteEmail}. They will receive an email with a link to join as Staff. Once they join, they will be added to this cashbook.`);
            } else {
              alert(`Invite SMS sent successfully to ${invitePhone}. They will receive an SMS with a link to join as Staff. Once they join, they will be added to this cashbook.`);
            }
          } else {
            // No business - can't send invite, but can add existing users
            throw new Error("To invite new users as Staff, this book needs to be associated with a business. You can still add existing users from the dropdown.");
          }
        }
      } else {
        throw new Error("Please select a user or provide email/phone");
      }

      // Close modal and refresh
      setShowAddMemberModal(false);
      setInviteStep("select");
      setInviteMethod("existing");
      setInviteEmail("");
      setInvitePhone("");
      setInviteRole("Staff");
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

  const handleRemoveMemberClick = (member: BookMember) => {
    // Prevent removing the owner
    if (member.isOwner || member.id === book?.ownerId) {
      setError("Cannot remove the book owner from members");
      return;
    }
    setMemberToRemove(member);
    setRemoveMemberModalOpen(true);
  };

  const handleRemoveMemberConfirm = async () => {
    if (!memberToRemove) return;

    try {
      setRemovingMember(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE}/api/books/${bookId}/users/${memberToRemove.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to remove member");
      }

      setRemoveMemberModalOpen(false);
      setMemberToRemove(null);
      fetchMembers(); // Refresh members list
    } catch (err) {
      console.error("Error removing member:", err);
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setRemovingMember(false);
    }
  };

  const getMemberRole = (member: BookMember): string => {
    // Check if member is the owner (using isOwner flag or comparing IDs)
    if ((member as any).isOwner || member.id === book?.ownerId) {
      return "Owner";
    }
    // All other members are Staff
    return "Staff";
  };

  const getRoleColor = (role: string): string => {
    switch (role.toLowerCase()) {
      case "owner":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "staff":
        return "bg-blue-100 text-blue-700 border-blue-200";
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

  const handleRenameSubmit = async () => {
    if (!book || !renameName.trim()) return;

    try {
      setSaving(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE}/api/books/${bookId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: renameName.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to rename book");
      }

      setRenameModalOpen(false);
      setRenameName("");
      fetchBook(); // Refresh book data
    } catch (err) {
      console.error("Error renaming book:", err);
      setError(err instanceof Error ? err.message : "Failed to rename book");
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicateSubmit = async () => {
    if (!book || !duplicateName.trim()) return;

    try {
      setSaving(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE}/api/books/${bookId}/duplicate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newName: duplicateName.trim(),
          ...duplicateOptions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to duplicate book");
      }

      const data = await response.json();
      setDuplicateModalOpen(false);
      setDuplicateName("");
      
      // Redirect to the new duplicated book's members page
      if (data.book?.id) {
        router.push(`/cashbooks/${data.book.id}/settings/members`);
      } else {
        router.push("/cashbooks");
      }
    } catch (err) {
      console.error("Error duplicating book:", err);
      setError(err instanceof Error ? err.message : "Failed to duplicate book");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBook = async () => {
    if (!book) return;

    try {
      setSaving(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE}/api/books/${bookId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete book");
      }

      // Redirect to cashbooks list after deletion
      router.push("/cashbooks");
    } catch (err) {
      console.error("Error deleting book:", err);
      setError(err instanceof Error ? err.message : "Failed to delete book");
    } finally {
      setSaving(false);
    }
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
              {/* Action buttons - Show based on permissions */}
              {(hasPermissionCheck("cashbooks.update") || hasPermissionCheck("cashbooks.delete") || hasPermissionCheck("cashbooks.create")) && (
                <>
                  {hasPermissionCheck("cashbooks.update") && (
                    <button
                      onClick={() => {
                        if (book) {
                          setRenameName(book.name);
                          setRenameModalOpen(true);
                        }
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Rename Book
                    </button>
                  )}
                  {hasPermissionCheck("cashbooks.create") && (
                    <button
                      onClick={() => {
                        if (book) {
                          setDuplicateName(`${book.name} (Copy)`);
                          setDuplicateModalOpen(true);
                        }
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Duplicate Book
                    </button>
                  )}
                  {hasPermissionCheck("cashbooks.delete") && (
                    <button
                      onClick={() => {
                        if (book && window.confirm(`Are you sure you want to delete "${book.name}"? This action cannot be undone.`)) {
                          handleDeleteBook();
                        }
                      }}
                      className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete Book
                    </button>
                  )}
                </>
              )}
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

            {/* Add Members Section - Show based on permissions */}
            {hasPermissionCheck("cashbooks.update") && (
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
            )}

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
                        {!isCurrentUser && !member.isOwner && member.id !== book?.ownerId && hasPermissionCheck("cashbooks.update") && (
                          <button
                            onClick={() => handleRemoveMemberClick(member)}
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

          {/* Entry Field Section - Show based on permissions */}
          {(hasPermissionCheck("cashbooks.update") || hasPermissionCheck("cashbooks.create")) && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="mb-1 text-lg font-semibold text-[#1f2937]">
                Entry Field <span className="text-rose-500">*</span>
              </h2>
              <p className="text-sm text-slate-500">Party, Category, Payment mode & Custom Fields.</p>
            </div>
          )}

          {/* Edit Data Operator Role Section - Show based on permissions */}
          {(hasPermissionCheck("cashbooks.update") || hasPermissionCheck("cashbooks.create")) && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="mb-1 text-lg font-semibold text-[#1f2937]">Edit Data Operator Role</h2>
              <p className="text-sm text-slate-500">Make changes in role as per your need.</p>
            </div>
          )}
        </div>

        {/* Add Member Modal */}
        {showAddMemberModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
              {inviteStep === "select" ? (
                <>
                  {/* Step 1: Select Method */}
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-[#1f2937]">Add Member to {book?.name}</h2>
                    <button
                      onClick={() => {
                        setShowAddMemberModal(false);
                        setInviteStep("select");
                        setInviteMethod("existing");
                        setSelectedUserId("");
                        setAvailableUsers([]);
                        setInviteEmail("");
                        setInvitePhone("");
                        setInviteRole("Staff");
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
                      <>
                        {/* Mobile Number Input */}
                        <div className="mb-4">
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Mobile number
                          </label>
                          <div className="flex gap-2">
                            <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1f2937] focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20">
                              <option value="+91">🇮🇳 +91</option>
                            </select>
                            <input
                              type="tel"
                              placeholder="e.g. 8772321230"
                              value={invitePhone}
                              onChange={(e) => {
                                setInvitePhone(e.target.value);
                                if (e.target.value.trim()) {
                                  setInviteMethod("phone");
                                  setSelectedUserId("");
                                  setInviteEmail("");
                                } else {
                                  setInviteMethod("existing");
                                }
                              }}
                              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1f2937] placeholder-slate-400 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                            />
                          </div>
                        </div>

                        {/* Separator */}
                        <div className="relative my-4">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-slate-500">Or</span>
                          </div>
                        </div>

                        {/* Add via Email Button */}
                        <div className="mb-6">
                          <button
                            onClick={() => handleInviteMethodChange("email")}
                            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Add via Email
                          </button>
                        </div>

                        {/* Email Input (shown when email method selected) */}
                        {inviteMethod === "email" && (
                          <div className="mb-6">
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                              Email address
                            </label>
                            <input
                              type="email"
                              placeholder="e.g. user@example.com"
                              value={inviteEmail}
                              onChange={(e) => {
                                setInviteEmail(e.target.value);
                                if (e.target.value.trim()) {
                                  setInviteMethod("email");
                                  setSelectedUserId("");
                                  setInvitePhone("");
                                } else {
                                  setInviteMethod("existing");
                                }
                              }}
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1f2937] placeholder-slate-400 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                            />
                          </div>
                        )}

                        {/* Existing Users Dropdown (shown when existing method or not email/phone) */}
                        {inviteMethod === "existing" && (
                          <div className="mb-6">
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                              Select User
                            </label>
                            {availableUsers.length === 0 ? (
                              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                                {book?.businessId 
                                  ? "All staff members from this business are already added to this cashbook. Use email or phone to invite someone new."
                                  : "No staff members found. Use email or phone to invite someone."}
                              </div>
                            ) : (
                              <select
                                value={selectedUserId}
                                onChange={(e) => {
                                  setSelectedUserId(e.target.value);
                                  setInviteEmail("");
                                  setInvitePhone("");
                                  setInviteMethod("existing");
                                }}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1f2937] focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                              >
                                <option value="">Choose a user...</option>
                                {availableUsers.map((user) => {
                                  const name = [user.firstName || user.first_name, user.lastName || user.last_name]
                                    .filter(Boolean)
                                    .join(" ")
                                    .trim() || user.email?.split("@")[0] || "Unknown";
                                  const display = user.phone
                                    ? `${name} (${user.email}) - ${user.phone}`
                                    : `${name} (${user.email})`;
                                  return (
                                    <option key={user.id} value={user.id}>
                                      {display}
                                    </option>
                                  );
                                })}
                              </select>
                            )}
                          </div>
                        )}

                        {error && (
                          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                            {error}
                          </div>
                        )}

                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setShowAddMemberModal(false);
                              setInviteStep("select");
                              setInviteMethod("existing");
                              setSelectedUserId("");
                              setAvailableUsers([]);
                              setInviteEmail("");
                              setInvitePhone("");
                              setInviteRole("Staff");
                            }}
                            className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            disabled={addingMember}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleInviteNext}
                            disabled={
                              addingMember ||
                              (inviteMethod === "existing" && !selectedUserId) ||
                              (inviteMethod === "email" && !inviteEmail.trim()) ||
                              (inviteMethod === "phone" && !invitePhone.trim())
                            }
                            className="flex-1 rounded-lg bg-[#2f4bff] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2f4bff]/90 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Step 2: Choose Role & Confirm */}
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <button
                      onClick={() => setInviteStep("select")}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h2 className="text-lg font-semibold text-[#1f2937]">Choose Role</h2>
                    <button
                      onClick={() => {
                        setShowAddMemberModal(false);
                        setInviteStep("select");
                        setInviteMethod("existing");
                        setSelectedUserId("");
                        setAvailableUsers([]);
                        setInviteEmail("");
                        setInvitePhone("");
                        setInviteRole("Staff");
                      }}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-6">
                    {/* Role Selection */}
                    <div className="mb-6">
                      <label className="mb-3 block text-sm font-medium text-slate-700">
                        Select Role
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setInviteRole("Staff")}
                          className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition ${
                            inviteRole === "Staff"
                              ? "border-[#2f4bff] bg-blue-50 text-[#2f4bff]"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <div className="text-base font-semibold mb-1">Staff</div>
                          <div className="text-xs text-slate-500">
                            {inviteMethod === "existing" ? "Add to cashbook" : "Invite to cashbook"}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setInviteRole("Partner")}
                          className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition ${
                            inviteRole === "Partner"
                              ? "border-[#2f4bff] bg-blue-50 text-[#2f4bff]"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <div className="text-base font-semibold mb-1">Partner</div>
                          <div className="text-xs text-slate-500">
                            Invite to business
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Info Box */}
                    <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-medium text-slate-700 mb-2">
                        {inviteRole === "Staff" ? "Adding as Staff" : "Inviting as Partner"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {inviteMethod === "existing" && selectedUserId
                          ? inviteRole === "Staff"
                            ? `Adding existing user to ${book?.name} as Staff member`
                            : `This will invite the user to join the business as Partner`
                          : inviteMethod === "email"
                          ? inviteRole === "Staff"
                            ? `Sending invite to ${inviteEmail} to join as Staff and be added to this cashbook`
                            : `Sending invite to ${inviteEmail} to join the business as Partner`
                          : inviteMethod === "phone"
                          ? inviteRole === "Staff"
                            ? `Sending invite to ${invitePhone} to join as Staff and be added to this cashbook`
                            : `Sending invite to ${invitePhone} to join the business as Partner`
                          : ""}
                      </p>
                    </div>

                    {error && (
                      <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                        {error}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => setInviteStep("select")}
                        className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        disabled={addingMember}
                      >
                        Back
                      </button>
                      <button
                        onClick={handleAddMemberSubmit}
                        disabled={addingMember}
                        className="flex-1 rounded-lg bg-[#2f4bff] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2f4bff]/90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {addingMember 
                          ? "Processing..." 
                          : inviteMethod === "existing" 
                            ? "Add Member" 
                            : "Send Invite"}
                      </button>
                    </div>
                  </div>
                </>
              )}
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
        {/* Rename Book Modal */}
        {renameModalOpen && book && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-[#1f2937]">Rename Book</h2>
                <button
                  onClick={() => {
                    setRenameModalOpen(false);
                    setRenameName("");
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="rename-name" className="block text-sm font-medium text-slate-700 mb-2">
                      Book Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="rename-name"
                      type="text"
                      value={renameName}
                      onChange={(e) => setRenameName(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                      placeholder="Enter book name"
                      autoFocus
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  onClick={() => {
                    setRenameModalOpen(false);
                    setRenameName("");
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRenameSubmit}
                  disabled={saving || !renameName.trim()}
                  className="rounded-xl bg-[#2f4bff] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#2f4bff]/90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Duplicate Book Modal */}
        {duplicateModalOpen && book && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-[#1f2937]">Duplicate {book.name}</h2>
                <button
                  onClick={() => {
                    setDuplicateModalOpen(false);
                    setDuplicateName("");
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4 flex items-start gap-3 rounded-lg bg-blue-50 p-3">
                  <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-blue-800">
                    Create new book with same settings as {book.name}
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="duplicate-name" className="block text-sm font-medium text-slate-700 mb-2">
                      Enter new book name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="duplicate-name"
                      type="text"
                      value={duplicateName}
                      onChange={(e) => setDuplicateName(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                      placeholder="Enter new book name"
                      autoFocus
                    />
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-slate-700">Choose settings to duplicate:</h3>
                    <div className="space-y-2">
                      {[
                        { key: 'duplicateMembers', label: 'Members & Roles' },
                        { key: 'duplicateCategories', label: 'Categories' },
                        { key: 'duplicatePaymentModes', label: 'Payment Modes' },
                        { key: 'duplicateParties', label: 'Party' },
                        { key: 'duplicateCustomFields', label: 'Custom Fields' },
                      ].map((option) => (
                        <label
                          key={option.key}
                          className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={duplicateOptions[option.key as keyof typeof duplicateOptions]}
                            onChange={(e) =>
                              setDuplicateOptions((prev) => ({
                                ...prev,
                                [option.key]: e.target.checked,
                              }))
                            }
                            className="h-4 w-4 rounded border-slate-300 text-[#2f4bff] focus:ring-2 focus:ring-[#2f4bff]"
                          />
                          <span className="text-sm text-slate-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  onClick={() => {
                    setDuplicateModalOpen(false);
                    setDuplicateName("");
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDuplicateSubmit}
                  disabled={saving || !duplicateName.trim()}
                  className="rounded-xl bg-[#2f4bff] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#2f4bff]/90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? "Creating..." : "Add New Book"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Remove Member Confirmation Modal */}
        {removeMemberModalOpen && memberToRemove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-[#1f2937]">Remove Member</h2>
                <button
                  onClick={() => {
                    setRemoveMemberModalOpen(false);
                    setMemberToRemove(null);
                    setError(null);
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  disabled={removingMember}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4 flex items-start gap-3 rounded-lg bg-rose-50 p-3">
                  <svg className="h-5 w-5 text-rose-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm text-rose-800">
                    Are you sure you want to remove <strong>{memberToRemove.name || memberToRemove.email || "this member"}</strong> from the book? This action cannot be undone.
                  </p>
                </div>
                {error && (
                  <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  onClick={() => {
                    setRemoveMemberModalOpen(false);
                    setMemberToRemove(null);
                    setError(null);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  disabled={removingMember}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveMemberConfirm}
                  disabled={removingMember}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {removingMember ? "Removing..." : "Remove"}
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

