"use client";

import { useState, useEffect, useRef } from "react";
import AppShell from "../components/AppShell";
import ProtectedRoute from "../components/ProtectedRoute";
import { getAuthToken, getUser } from "../utils/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "/backend");

interface TeamMember {
  id: string;
  email: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role?: string;
  roles?: Array<{ name: string; description: string }>;
  status?: string;
  isOwner?: boolean;
  isPartner?: boolean;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteMethod, setInviteMethod] = useState<"existing" | "email" | "phone">("existing");
  const [inviteRole, setInviteRole] = useState<"Staff" | "Partner">("Staff");
  const [inviteStep, setInviteStep] = useState<"select" | "role">("select");
  const [invitedUserEmail, setInvitedUserEmail] = useState("");
  const [invitedUserPhone, setInvitedUserPhone] = useState("");
  const [roles, setRoles] = useState<Array<{ id: string; name: string; description: string | null; permissions: Array<{ name: string; description: string }> }>>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [businessInfo, setBusinessInfo] = useState<{ name: string; ownerId: string } | null>(null);
  const currentUser = getUser();
  const addMemberModalRef = useRef<HTMLDivElement>(null);
  const rolesModalRef = useRef<HTMLDivElement>(null);

  // Load selected business ID from localStorage on mount
  useEffect(() => {
    const businessId = localStorage.getItem("selectedBusinessId");
    setSelectedBusinessId(businessId);
    if (businessId) {
      fetchBusinessInfo(businessId);
    }
  }, []);

  // Listen for business change events
  useEffect(() => {
    const handleBusinessChange = (event: CustomEvent) => {
      const businessId = event.detail?.businessId || localStorage.getItem("selectedBusinessId");
      if (businessId && businessId !== selectedBusinessId) {
        setSelectedBusinessId(businessId);
      }
    };

    window.addEventListener('businessChanged', handleBusinessChange as EventListener);

    return () => {
      window.removeEventListener('businessChanged', handleBusinessChange as EventListener);
    };
  }, [selectedBusinessId]);

  useEffect(() => {
    if (selectedBusinessId) {
      fetchBusinessInfo(selectedBusinessId);
      fetchMembers(selectedBusinessId);
    } else {
      setMembers([]);
      setBusinessInfo(null);
      setLoading(false);
    }
  }, [selectedBusinessId]);

  useEffect(() => {
    filterMembers();
  }, [members, activeTab, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAddMemberModal && addMemberModalRef.current && !addMemberModalRef.current.contains(event.target as Node)) {
        setShowAddMemberModal(false);
      }
      if (showRolesModal && rolesModalRef.current && !rolesModalRef.current.contains(event.target as Node)) {
        setShowRolesModal(false);
      }
    };

    if (showAddMemberModal || showRolesModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAddMemberModal, showRolesModal]);

  const fetchBusinessInfo = async (businessId: string) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_BASE}/api/businesses`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const business = data.businesses?.find((b: any) => b.id === businessId);
        if (business) {
          setBusinessInfo({
            name: business.name,
            ownerId: business.ownerId,
          });
        }
      }
    } catch (err) {
      console.error("Error fetching business info:", err);
    }
  };

  const fetchMembers = async (businessId: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        setError("Not authenticated");
        return;
      }

      if (!businessId) {
        setMembers([]);
        setLoading(false);
        return;
      }

      // Get business info (including owner)
      const businessResponse = await fetch(`${API_BASE}/api/businesses`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      let businessOwnerId: string | null = null;
      if (businessResponse.ok) {
        const businessData = await businessResponse.json();
        const business = businessData.businesses?.find((b: any) => b.id === businessId);
        if (business) {
          businessOwnerId = business.ownerId;
          // Update business info state
          setBusinessInfo({
            name: business.name,
            ownerId: business.ownerId,
          });
        }
      }

      // Fetch all books for this business
      const booksResponse = await fetch(`${API_BASE}/api/books?business_id=${businessId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const booksData = booksResponse.ok ? await booksResponse.json() : { books: [] };
      const books = booksData.books || [];

      // Track book owners (Partners) and book members (Staff)
      const bookOwnerIds = new Set<string>(); // Partners: owners of books in this business
      const bookMemberIds = new Set<string>(); // Staff: members of books (via book_users)

      // Get book owners (Partners) - users who own books in this business
      books.forEach((book: any) => {
        if (book.ownerId && book.ownerId !== businessOwnerId) {
          bookOwnerIds.add(book.ownerId);
        }
      });

      // Get all users from books (Staff) - users added to books via book_users
      for (const book of books) {
        try {
          const bookUsersResponse = await fetch(`${API_BASE}/api/books/${book.id}/users`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (bookUsersResponse.ok) {
            const bookUsersData = await bookUsersResponse.json();
            (bookUsersData.users || []).forEach((user: any) => {
              // Only add if they're not a book owner and not the business owner
              // These are Staff members added to books
              if (user.id !== businessOwnerId && !bookOwnerIds.has(user.id)) {
                bookMemberIds.add(user.id);
              }
            });
          }
        } catch (err) {
          console.error(`Error fetching users for book ${book.id}:`, err);
        }
      }

      // Collect all unique user IDs
      const userIds = new Set<string>();
      if (businessOwnerId) userIds.add(businessOwnerId); // Owner
      bookOwnerIds.forEach(id => userIds.add(id)); // Partners
      bookMemberIds.forEach(id => userIds.add(id)); // Staff

      // Fetch details for all unique users
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
      
      // Filter users to only those in the business team
      const businessUsers = allUsers.filter((user: any) => userIds.has(user.id));

      // Transform users to team members
      const teamMembers: TeamMember[] = businessUsers.map((user: any) => {
        const firstName = user.firstName || user.first_name || null;
        const lastName = user.lastName || user.last_name || null;
        const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || user.email?.split("@")[0] || "Unknown";
        
        // Determine role based on business relationship:
        // Owner: Business owner
        // Partner: Book owners in this business (added/invited at business level)
        // Staff: Book members (added at book level via book_users)
        let displayRole = "Staff";
        let isOwner = false;
        let isPartner = false;

        if (user.id === businessOwnerId) {
          displayRole = "Owner";
          isOwner = true;
        } else if (bookOwnerIds.has(user.id)) {
          // User is owner of a book in this business = Partner
          displayRole = "Partner";
          isPartner = true;
        } else if (bookMemberIds.has(user.id)) {
          // User is member of a book (via book_users) = Staff
          displayRole = "Staff";
        }

        return {
          id: user.id,
          email: user.email,
          name: user.id === currentUser?.id ? "You" : fullName,
          firstName,
          lastName,
          phone: user.phone || null,
          role: displayRole,
          roles: user.roles || [],
          status: user.status,
          isOwner,
          isPartner,
        };
      });

      // Sort: Owner first, then Partners, then Staff, and "You" at the top if exists
      teamMembers.sort((a, b) => {
        if (a.name === "You") return -1;
        if (b.name === "You") return 1;
        if (a.isOwner) return -1;
        if (b.isOwner) return 1;
        if (a.isPartner && !b.isPartner) return -1;
        if (!a.isPartner && b.isPartner) return 1;
        return a.name.localeCompare(b.name);
      });

      setMembers(teamMembers);
    } catch (err) {
      console.error("Error fetching team members:", err);
      setError(err instanceof Error ? err.message : "Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  const filterMembers = () => {
    let filtered = [...members];

    // Filter by tab
    if (activeTab === "Owner/Partner") {
      filtered = filtered.filter(m => m.isPartner || m.role === "Partner" || m.role === "Owner");
    } else if (activeTab === "Staff") {
      filtered = filtered.filter(m => m.role === "Staff");
    } else if (activeTab === "Pending Invites") {
      // For now, pending invites is empty - can be extended later
      filtered = [];
    }
    // If activeTab === "All", show all members (no filter)

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.name.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query) ||
        m.phone?.toLowerCase().includes(query) ||
        m.phone?.replace(/\D/g, "").includes(query.replace(/\D/g, ""))
      );
    }

    setFilteredMembers(filtered);
  };

  const getInitials = (name: string): string => {
    if (name === "You") return currentUser?.email?.charAt(0).toUpperCase() || "Y";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const getAvatarColor = (name: string): string => {
    const colors = [
      "bg-green-500",
      "bg-blue-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-orange-500",
      "bg-teal-500",
      "bg-red-500",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getRoleBadgeColor = (role: string): string => {
    if (role === "Owner") return "bg-green-100 text-green-700";
    if (role === "Partner") return "bg-orange-100 text-orange-700";
    if (role === "Staff") return "bg-blue-100 text-blue-700";
    return "bg-slate-100 text-slate-700";
  };

  const fetchUsersForAdd = async () => {
    try {
      setLoadingUsers(true);
      setError(null);
      const token = getAuthToken();
      if (!token || !selectedBusinessId) {
        throw new Error("Not authenticated or no business selected");
      }

      // Fetch all books for this business
      const booksResponse = await fetch(`${API_BASE}/api/books?business_id=${selectedBusinessId}`, {
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

      // Get business owner
      const businessResponse = await fetch(`${API_BASE}/api/businesses`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      let businessOwnerId: string | null = null;
      if (businessResponse.ok) {
        const businessData = await businessResponse.json();
        const business = businessData.businesses?.find((b: any) => b.id === selectedBusinessId);
        if (business) {
          businessOwnerId = business.ownerId;
        }
      }

      // Get all users from books in this business
      for (const book of books) {
        // Track book owners (Partners)
        if (book.ownerId && book.ownerId !== businessOwnerId) {
          bookOwnerIds.add(book.ownerId);
        }

        try {
          const bookUsersResponse = await fetch(`${API_BASE}/api/books/${book.id}/users`, {
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
              if (user.id !== businessOwnerId && !user.isOwner) {
                bookMemberIds.add(user.id);
              }
            });
          }
        } catch (err) {
          console.error(`Error fetching users for book ${book.id}:`, err);
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

      // Filter to only staff members (book members, not book owners)
      const staffUsers = allUsers.filter((user: any) => bookMemberIds.has(user.id));
      
      console.log("Staff members from books:", {
        bookMemberIds: Array.from(bookMemberIds),
        totalUsers: allUsers.length,
        staffUsersCount: staffUsers.length,
        staffUsers: staffUsers.map(u => ({ 
          id: u.id, 
          email: u.email, 
          name: [u.firstName || u.first_name, u.lastName || u.last_name].filter(Boolean).join(" "),
          phone: u.phone || u.phone
        }))
      });

      // Filter out users who are already team members of this business
      const memberIds = new Set(members.map(m => m.id));
      const available = staffUsers.filter((u: any) => !memberIds.has(u.id));
      
      console.log("Available staff members for dropdown:", {
        memberIds: Array.from(memberIds),
        currentMembersCount: members.length,
        availableCount: available.length,
        availableUsers: available.map(u => ({ id: u.id, email: u.email, name: [u.firstName || u.first_name, u.lastName || u.last_name].filter(Boolean).join(" ") }))
      });
      
      // If no available staff (all are already team members), show all staff anyway
      // This allows viewing staff members even if they're already added
      const usersToShow = available.length > 0 ? available : staffUsers;
      
      setAvailableUsers(usersToShow);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAddMemberClick = () => {
    if (!selectedBusinessId) {
      alert("Please select a business first");
      return;
    }
    setShowAddMemberModal(true);
    setInviteStep("select");
    setInviteMethod("existing"); // Default to existing user selection
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
    if (inviteMethod === "existing" && !selectedUserId) {
      setError("Please select a user");
      return;
    }
    if (inviteMethod === "email" && !inviteEmail.trim()) {
      setError("Please enter an email address");
      return;
    }
    if (inviteMethod === "phone" && !invitePhone.trim()) {
      setError("Please enter a phone number");
      return;
    }

    // Get user info for display
    if (inviteMethod === "existing") {
      const user = availableUsers.find(u => u.id === selectedUserId);
      if (user) {
        setInvitedUserEmail(user.email);
        setInvitedUserPhone(user.phone || "");
      }
    } else if (inviteMethod === "email") {
      setInvitedUserEmail(inviteEmail.trim());
    } else if (inviteMethod === "phone") {
      setInvitedUserPhone(invitePhone.trim());
    }

    setInviteStep("role");
    setError(null);
  };

  const handleInviteSubmit = async () => {
    try {
      setAddingMember(true);
      setError(null);
      const token = getAuthToken();
      if (!token || !selectedBusinessId) {
        throw new Error("Not authenticated or no business selected");
      }

      let response;
      
      if (inviteMethod === "existing" && selectedUserId) {
        // Add existing user to business team
        try {
          response = await fetch(`${API_BASE}/api/businesses/${selectedBusinessId}/members`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: selectedUserId,
              role: inviteRole,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Failed to add user to business");
          }

          const data = await response.json();
          console.log("Added existing user to business team:", data);
          
          // Show success message
          const selectedUser = availableUsers.find(u => u.id === selectedUserId);
          const userName = selectedUser 
            ? [selectedUser.firstName || selectedUser.first_name, selectedUser.lastName || selectedUser.last_name].filter(Boolean).join(" ") || selectedUser.email
            : "User";
          alert(`${userName} has been added to the business as ${inviteRole}.`);
        } catch (err) {
          console.error("Error adding existing user:", err);
          throw err instanceof Error ? err : new Error("Failed to add existing user");
        }
      } else if (inviteMethod === "email" || inviteMethod === "phone") {
        // Send invite email/link to new user (not a CashBook user)
        const inviteData: any = {
          role: inviteRole,
          businessId: selectedBusinessId,
        };

        if (inviteMethod === "email") {
          inviteData.email = inviteEmail.trim();
        } else if (inviteMethod === "phone") {
          inviteData.phone = invitePhone.trim();
        }

        // Send invite email with invite link
        try {
          response = await fetch(`${API_BASE}/api/businesses/${selectedBusinessId}/invites`, {
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
          
          // Show success message
          if (inviteMethod === "email") {
            alert(`Invite email sent successfully to ${inviteEmail}. They will receive an email with a link to join the business as ${inviteRole}.`);
          } else {
            alert(`Invite created for ${invitePhone}. Note: SMS sending is not yet implemented, but the invite has been created.`);
          }
        } catch (err) {
          console.error("Error sending invite:", err);
          throw err instanceof Error ? err : new Error("Failed to send invite");
        }
      } else {
        throw new Error("Invalid invite method");
      }

      // Close modal and refresh
      setShowAddMemberModal(false);
      setInviteStep("select");
      setInviteMethod("existing");
      setInviteEmail("");
      setInvitePhone("");
      setInviteRole("Staff");
      setSelectedUserId("");
      setInvitedUserEmail("");
      setInvitedUserPhone("");
      
      // Refresh team members list
      if (selectedBusinessId) {
        setTimeout(() => {
          fetchMembers(selectedBusinessId);
        }, 1000);
      }
    } catch (err) {
      console.error("Error inviting member:", err);
      setError(err instanceof Error ? err.message : "Failed to invite member");
    } finally {
      setAddingMember(false);
    }
  };

  const handleViewRolesClick = async () => {
    setShowRolesModal(true);
    setLoadingPermissions(true);
    
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE}/api/roles`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      }
    } catch (err) {
      console.error("Error fetching roles:", err);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const groupedMembers = filteredMembers.reduce((acc, member) => {
    const role = member.role || "Other";
    if (!acc[role]) {
      acc[role] = [];
    }
    acc[role].push(member);
    return acc;
  }, {} as Record<string, TeamMember[]>);

  return (
    <ProtectedRoute>
      <AppShell activePath="/team">
        <div className="flex gap-6">
          {/* Main Content Area */}
          <div className="flex-1 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1f2937]">
                Total Members ({members.length})
              </h2>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-10 pr-4 text-sm text-[#1f2937] placeholder-slate-400 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
              />
              <svg
                className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200">
              {["All", "Pending Invites", "Owner/Partner", "Staff"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium transition ${
                    activeTab === tab
                      ? "border-b-2 border-[#2f4bff] text-[#2f4bff]"
                      : "text-slate-500 hover:text-[#1f2937]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Team Members List */}
            {!selectedBusinessId ? (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                <p className="text-sm text-slate-500">Please select a business to view team members</p>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-[#2f4bff]"></div>
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                <p className="text-sm text-slate-500">No team members found for this business</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedMembers).map(([role, roleMembers]) => (
                  <div key={role}>
                    <h3 className="mb-3 text-sm font-semibold text-slate-600">
                      {role} ({roleMembers.length})
                    </h3>
                    <div className="space-y-3">
                      {roleMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-md"
                        >
                          {/* Avatar */}
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-full text-white ${getAvatarColor(member.name)}`}
                          >
                            {getInitials(member.name)}
                          </div>

                          {/* Member Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-[#1f2937]">{member.name}</h4>
                              {member.role && (
                                <span
                                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${getRoleBadgeColor(member.role)}`}
                                >
                                  {member.role}
                                </span>
                              )}
                            </div>
                            <div className="mt-1 space-y-0.5 text-xs text-slate-500">
                              {member.email && <div>{member.email}</div>}
                              {member.phone && (
                                <div>{member.phone.startsWith("+") ? member.phone : `+91 ${member.phone}`}</div>
                              )}
                            </div>
                          </div>

                          {/* Arrow Icon */}
                          <svg
                            className="h-5 w-5 text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="hidden w-80 space-y-6 lg:block">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <button
                onClick={handleViewRolesClick}
                className="mb-4 flex w-full items-center justify-between text-sm font-medium text-[#2f4bff] hover:underline"
              >
                <span>View roles & permissions</span>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <p className="mb-6 text-sm text-slate-600">
                Add your business partners or staffs to this business and manage cashflow together
              </p>
              <button
                onClick={handleAddMemberClick}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2f4bff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2f4bff]/90"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Add team member
              </button>
            </div>
          </div>
        </div>

        {/* Add Team Member Modal */}
        {showAddMemberModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div ref={addMemberModalRef} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
              {inviteStep === "select" ? (
                <>
                  {/* Step 1: Select Method */}
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[#1f2937]">Add team member</h3>
                    <button
                      onClick={() => {
                        setShowAddMemberModal(false);
                        setInviteStep("select");
                        setInviteMethod("existing");
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-[#2f4bff]"></div>
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
                            {availableUsers.length === 0 ? (
                              <option value="" disabled>
                                No staff members available
                              </option>
                            ) : (
                              availableUsers.map((user) => {
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
                              })
                            )}
                          </select>
                          {availableUsers.length === 0 && (
                            <p className="mt-1 text-xs text-slate-500">
                              No staff members found in this business's books
                            </p>
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
                          }}
                          className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleInviteNext}
                          disabled={
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
                </>
              ) : (
                <>
                  {/* Step 2: Choose Role & Invite */}
                  <div className="mb-4 flex items-center justify-between">
                    <button
                      onClick={() => setInviteStep("select")}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h3 className="text-lg font-semibold text-[#1f2937]">Choose Role & Invite</h3>
                    <button
                      onClick={() => {
                        setShowAddMemberModal(false);
                        setInviteStep("select");
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* User Info Display */}
                  {(invitedUserEmail || invitedUserPhone) && (
                    <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                      {inviteMethod === "existing" ? (
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white">
                            {(invitedUserEmail || invitedUserPhone).charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-[#1f2937]">{invitedUserEmail || invitedUserPhone}</p>
                            {invitedUserEmail && <p className="text-xs text-slate-500">{invitedUserEmail}</p>}
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="mb-3 text-sm text-slate-600">
                            {invitedUserEmail || invitedUserPhone} is a new user. Send invite to {invitedUserEmail || invitedUserPhone} to join this business.
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white">
                              {(invitedUserEmail || invitedUserPhone).charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-[#1f2937]">{invitedUserEmail || invitedUserPhone}</p>
                              {invitedUserEmail && <p className="text-xs text-slate-500">{invitedUserEmail}</p>}
                            </div>
                            <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                              Not a CashBook User
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Role Selection */}
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Choose Role</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setInviteRole("Staff")}
                        className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                          inviteRole === "Staff"
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        Staff
                      </button>
                      <button
                        onClick={() => setInviteRole("Partner")}
                        className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                          inviteRole === "Partner"
                            ? "border-orange-500 bg-orange-50 text-orange-700"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        Partner
                      </button>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div className="mb-4">
                    <h4 className="mb-2 text-sm font-semibold text-[#1f2937]">Permissions</h4>
                    <div className="space-y-2">
                      {inviteRole === "Staff" ? (
                        <>
                          <div className="flex items-start gap-2">
                            <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <p className="text-sm text-slate-600">Limited access to selected books</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <p className="text-sm text-slate-600">Owner/Partner can assign Admin, Viewer or Operator role to staff in any book</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start gap-2">
                            <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <p className="text-sm text-slate-600">Full access to all books of this business</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <p className="text-sm text-slate-600">Full access to business settings</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <p className="text-sm text-slate-600">Add/remove members in business</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Restrictions */}
                  <div className="mb-4">
                    <h4 className="mb-2 text-sm font-semibold text-[#1f2937]">Restrictions</h4>
                    <div className="space-y-2">
                      {inviteRole === "Staff" ? (
                        <>
                          <div className="flex items-start gap-2">
                            <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <p className="text-sm text-slate-600">No access to books they are not part of</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <p className="text-sm text-slate-600">No access to business settings</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <p className="text-sm text-slate-600">No option to delete books</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <p className="text-sm text-slate-600">Can't view employee details</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start gap-2">
                            <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <p className="text-sm text-slate-600">Can't delete business</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <p className="text-sm text-slate-600">Can't remove owner from business</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Info Message */}
                  <div className="mb-4 flex items-start gap-2 rounded-lg bg-slate-50 p-3">
                    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-slate-600">You can change this role later</p>
                  </div>

                  {inviteRole === "Partner" && (
                    <div className="mb-4 flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 p-3">
                      <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-xs text-orange-700">Partner will get full access to your business.</p>
                    </div>
                  )}

                  {error && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setInviteStep("select")}
                      className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Change Email
                    </button>
                    <button
                      onClick={handleInviteSubmit}
                      disabled={addingMember}
                      className="flex items-center justify-center gap-2 flex-1 rounded-lg bg-[#2f4bff] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2f4bff]/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Invite as {inviteRole.toLowerCase()}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Roles & Permissions Modal */}
        {showRolesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div ref={rolesModalRef} className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#1f2937]">Roles & Permissions</h3>
                <button
                  onClick={() => setShowRolesModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {loadingPermissions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-[#2f4bff]"></div>
                </div>
              ) : roles.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">No roles available</p>
              ) : (
                <div className="space-y-4">
                  {roles.map((role) => (
                    <div key={role.id} className="rounded-lg border border-slate-200 p-4">
                      <h4 className="font-semibold text-[#1f2937]">{role.name}</h4>
                      {role.description && (
                        <p className="mt-1 text-sm text-slate-600">{role.description}</p>
                      )}
                      {role.permissions && role.permissions.length > 0 && (
                        <div className="mt-3">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Permissions
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {role.permissions.map((permission, idx) => (
                              <span
                                key={idx}
                                className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700"
                              >
                                {permission.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}

