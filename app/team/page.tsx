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

interface Invite {
  id: string;
  businessId: string;
  email: string | null;
  phone: string | null;
  role: string;
  inviteToken: string;
  status: string;
  invitedBy: string;
  inviterEmail: string | null;
  expiresAt: string;
  createdAt: string;
  shortUrl?: string | null;
  updatedAt: string;
  acceptedAt: string | null;
  acceptedBy: string | null;
  acceptedUserEmail?: string | null;
  userInviteStatus?: string | null;
  cashbookId?: string | null;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [filteredInvites, setFilteredInvites] = useState<Invite[]>([]);
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
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [checkingUser, setCheckingUser] = useState(false);
  const [selectedCashbookId, setSelectedCashbookId] = useState<string | null>(null);
  const [cashbooksForInvite, setCashbooksForInvite] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingCashbooks, setLoadingCashbooks] = useState(false);
  const [selectedBusinessForPartner, setSelectedBusinessForPartner] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<Array<{ id: string; name: string }>>([]);
  const [roles, setRoles] = useState<Array<{ id: string; name: string; description: string | null; permissions: Array<{ name: string; description: string }> }>>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [businessInfo, setBusinessInfo] = useState<{ name: string; ownerId: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<ReturnType<typeof getUser> | null>(null);
  const [mounted, setMounted] = useState(false);
  const [deletingInviteId, setDeletingInviteId] = useState<string | null>(null);
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null);
  const addMemberModalRef = useRef<HTMLDivElement>(null);
  const rolesModalRef = useRef<HTMLDivElement>(null);

  // Set mounted state and load user data on client side only
  useEffect(() => {
    setMounted(true);
    setCurrentUser(getUser());
    
    // Load selected business ID from localStorage on mount
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
      fetchInvites(selectedBusinessId);
    } else {
      setMembers([]);
      setInvites([]);
      setBusinessInfo(null);
      setLoading(false);
    }
  }, [selectedBusinessId]);

  useEffect(() => {
    filterMembers();
    filterInvites();
  }, [members, invites, activeTab, searchQuery]);

  const fetchInvites = async (businessId: string) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_BASE}/api/businesses/${businessId}/invites`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInvites(data.invites || []);
      } else {
        console.error("Failed to fetch invites");
      }
    } catch (err) {
      console.error("Error fetching invites:", err);
    }
  };

  const filterInvites = () => {
    let filtered = [...invites];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (invite) =>
          invite.email?.toLowerCase().includes(query) ||
          invite.phone?.toLowerCase().includes(query) ||
          invite.inviterEmail?.toLowerCase().includes(query)
      );
    }

    setFilteredInvites(filtered);
  };

  const handleResendInvite = async (invite: Invite) => {
    if (!selectedBusinessId) return;

    try {
      const token = getAuthToken();
      if (!token) {
        alert("Not authenticated");
        return;
      }

      setResendingInviteId(invite.id);

      const response = await fetch(
        `${API_BASE}/api/businesses/${selectedBusinessId}/invites/${invite.id}/resend`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to resend invite");
      }

      const data = await response.json();
      alert(data.message || "Invite resent successfully!");
    } catch (err) {
      console.error("Error resending invite:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to resend invite. Please try again."
      );
    } finally {
      setResendingInviteId(null);
    }
  };

  const handleDeleteInvite = async (invite: Invite) => {
    if (!selectedBusinessId) return;

    if (!window.confirm("Are you sure you want to delete this invite?")) {
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        alert("Not authenticated");
        return;
      }

      setDeletingInviteId(invite.id);

      const response = await fetch(
        `${API_BASE}/api/businesses/${selectedBusinessId}/invites/${invite.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete invite");
      }

      // Remove invite from state
      setInvites((prev) => prev.filter((i) => i.id !== invite.id));
      setFilteredInvites((prev) => prev.filter((i) => i.id !== invite.id));
    } catch (err) {
      console.error("Error deleting invite:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to delete invite. Please try again."
      );
    } finally {
      setDeletingInviteId(null);
    }
  };

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

  const fetchBusinesses = async () => {
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
        setBusinesses(data.businesses || []);
      }
    } catch (err) {
      console.error("Error fetching businesses:", err);
      setBusinesses([]);
    }
  };

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
      // Pending invites are handled separately in the render
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

  const fetchCashbooksForInvite = async (businessId: string) => {
    try {
      setLoadingCashbooks(true);
      const token = getAuthToken();
      if (!token) {
        return;
      }

      const response = await fetch(`${API_BASE}/api/books?business_id=${businessId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch cashbooks");
      }

      const data = await response.json();
      setCashbooksForInvite(data.books || []);
      
      // Auto-select first cashbook if available
      if (data.books && data.books.length > 0) {
        setSelectedCashbookId(data.books[0].id);
      } else {
        setSelectedCashbookId(null);
      }
    } catch (err) {
      console.error("Error fetching cashbooks:", err);
      setCashbooksForInvite([]);
      setSelectedCashbookId(null);
    } finally {
      setLoadingCashbooks(false);
    }
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
        staffUsers: staffUsers.map((u: any) => ({ 
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
        availableUsers: available.map((u: any) => ({ id: u.id, email: u.email, name: [u.firstName || u.first_name, u.lastName || u.last_name].filter(Boolean).join(" ") }))
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

  const handleAddMemberClick = async () => {
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
    setSelectedCashbookId(null);
    setSelectedBusinessForPartner(null);
    setError(null);
    await fetchBusinesses(); // Fetch businesses for Partner selection
    await fetchUsersForAdd();
    // Fetch cashbooks for Staff role
    await fetchCashbooksForInvite(selectedBusinessId);
  };

  const handleInviteMethodChange = (method: "existing" | "email" | "phone") => {
    setInviteMethod(method);
    setSelectedUserId("");
    setInviteEmail("");
    setInvitePhone("");
    setIsExistingUser(false);
    setCheckingUser(false);
  };

  const checkUserExists = async (email: string | null, phone: string | null) => {
    if (!email && !phone) {
      setIsExistingUser(false);
      return;
    }

    try {
      setCheckingUser(true);
      const token = getAuthToken();
      if (!token) {
        setIsExistingUser(false);
        return;
      }

      const params = new URLSearchParams();
      if (email) params.append("email", email);
      if (phone) params.append("phone", phone);

      const response = await fetch(`${API_BASE}/api/users/check?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsExistingUser(data.exists || false);
      } else {
        setIsExistingUser(false);
      }
    } catch (err) {
      console.error("Error checking user existence:", err);
      setIsExistingUser(false);
    } finally {
      setCheckingUser(false);
    }
  };

  const handleInviteNext = async () => {
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
        setIsExistingUser(true);
      }
    } else if (inviteMethod === "email") {
      setInvitedUserEmail(inviteEmail.trim());
      // Check if user exists
      await checkUserExists(inviteEmail.trim(), null);
    } else if (inviteMethod === "phone") {
      setInvitedUserPhone(invitePhone.trim());
      // Check if user exists
      await checkUserExists(null, invitePhone.trim());
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
        // Validate selections based on role
        if (inviteRole === "Staff" && !selectedCashbookId) {
          throw new Error("Please select a cashbook for Staff role");
        }
        if (inviteRole === "Partner" && !selectedBusinessForPartner) {
          throw new Error("Please select a business for Partner role");
        }

        // Add existing user to business team
        const targetBusinessId = inviteRole === "Partner" ? selectedBusinessForPartner : selectedBusinessId;
        try {
          response = await fetch(`${API_BASE}/api/businesses/${targetBusinessId}/members`, {
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
          
          // If Staff, also add to selected cashbook
          if (inviteRole === "Staff" && selectedCashbookId) {
            const addToBookResponse = await fetch(`${API_BASE}/api/books/${selectedCashbookId}/users`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: selectedUserId,
              }),
            });

            if (!addToBookResponse.ok) {
              console.warn("User added to business but failed to add to cashbook");
            }
          }
          
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
        // Validate selections based on role
        if (inviteRole === "Staff" && !selectedCashbookId) {
          throw new Error("Please select a cashbook for Staff role");
        }
        if (inviteRole === "Partner" && !selectedBusinessForPartner) {
          throw new Error("Please select a business for Partner role");
        }

        // Send invite email/link to new user (not a CashBook user)
        const targetBusinessId = inviteRole === "Partner" ? selectedBusinessForPartner : selectedBusinessId;
        const inviteData: any = {
          role: inviteRole,
          businessId: targetBusinessId,
        };

        if (inviteMethod === "email") {
          inviteData.email = inviteEmail.trim();
        } else if (inviteMethod === "phone") {
          inviteData.phone = invitePhone.trim();
        }

        // For Staff, include cashbook ID in invite data
        if (inviteRole === "Staff" && selectedCashbookId) {
          inviteData.cashbookId = selectedCashbookId;
        }

        // Send invite email with invite link
        try {
          response = await fetch(`${API_BASE}/api/businesses/${targetBusinessId}/invites`, {
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
            alert(`Invite SMS sent successfully to ${invitePhone}. They will receive an SMS with a link to join the business as ${inviteRole}.`);
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
      
      // Refresh team members list and invites
      if (selectedBusinessId) {
        setTimeout(() => {
          fetchMembers(selectedBusinessId);
          fetchInvites(selectedBusinessId);
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

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <ProtectedRoute>
        <AppShell activePath="/team">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-[#2f4bff]"></div>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

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

            {/* Team Members List / Invites List */}
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
            ) : activeTab === "Pending Invites" ? (
              // Show Invites
              filteredInvites.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                  <p className="text-sm text-slate-500">No pending invites found for this business</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredInvites
                    .filter((invite) => invite.status === "pending")
                    .map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center gap-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4 transition hover:shadow-md"
                      >
                        {/* Avatar */}
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>

                        {/* Invite Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-[#1f2937]">
                              {invite.email || invite.phone || "Unknown"}
                            </h4>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${getRoleBadgeColor(invite.role)}`}
                            >
                              {invite.role}
                            </span>
                            {invite.status === "pending" && !invite.acceptedUserEmail ? (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-600">
                                Pending
                              </span>
                            ) : invite.acceptedUserEmail ? (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-600">
                                Accepted
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                {invite.status === "accepted" ? "Accepted" : invite.status}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 space-y-0.5 text-xs text-slate-500">
                            {invite.email && <div>{invite.email}</div>}
                            {invite.phone && (
                              <div>{invite.phone.startsWith("+") ? invite.phone : `+91 ${invite.phone}`}</div>
                            )}
                            {invite.inviterEmail && (
                              <div className="text-slate-400">Invited by: {invite.inviterEmail}</div>
                            )}
                            {invite.acceptedUserEmail && (
                              <div className="text-emerald-600 font-medium">
                                ✓ Accepted by: {invite.acceptedUserEmail}
                              </div>
                            )}
                            {invite.acceptedAt && (
                              <div className="text-slate-400">
                                Accepted: {new Date(invite.acceptedAt).toLocaleDateString()}
                              </div>
                            )}
                            {invite.expiresAt && !invite.acceptedUserEmail && (
                              <div className="text-slate-400">
                                Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                              </div>
                            )}
                            {invite.status === "pending" && !invite.acceptedUserEmail && (
                              <div className="mt-2 pt-2 border-t border-amber-200">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-slate-600">Invite Link:</span>
                                    <button
                                      onClick={() => {
                                        const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
                                        const identifier = invite.email || invite.phone || "";
                                        const paramName = invite.email ? "email" : "phone";
                                        let inviteLink = `${baseUrl}/invite?token=${invite.inviteToken}&business=${invite.businessId}&${paramName}=${encodeURIComponent(identifier)}&role=${invite.role}`;
                                        // Add cashbook ID if present
                                        if (invite.cashbookId) {
                                          inviteLink += `&cashbook=${invite.cashbookId}`;
                                        }
                                        navigator.clipboard.writeText(inviteLink).then(() => {
                                          alert("Invite link copied to clipboard!");
                                        }).catch(() => {
                                          // Fallback: select text
                                          const textArea = document.createElement("textarea");
                                          textArea.value = inviteLink;
                                          document.body.appendChild(textArea);
                                          textArea.select();
                                          document.execCommand("copy");
                                          document.body.removeChild(textArea);
                                          alert("Invite link copied to clipboard!");
                                        });
                                      }}
                                      className="flex items-center gap-1 text-xs text-[#2357FF] hover:text-[#1a46d9] font-medium underline"
                                    >
                                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                      Copy Link
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleResendInvite(invite)}
                                      disabled={resendingInviteId === invite.id}
                                      className="inline-flex items-center rounded-md border border-blue-200 bg-white px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {resendingInviteId === invite.id ? "Resending..." : "Resend Invite"}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteInvite(invite)}
                                      disabled={deletingInviteId === invite.id}
                                      className="inline-flex items-center rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {deletingInviteId === invite.id ? "Deleting..." : "Delete"}
                                    </button>
                                  </div>
                                </div>
                                <div className="mt-2 space-y-1">
                                  {invite.shortUrl && (
                                    <div className="text-xs">
                                      <span className="font-medium text-slate-600">Short URL (for SMS):</span>
                                      <div className="mt-1 text-slate-400 break-all font-mono bg-blue-50 p-1 rounded border border-blue-200">
                                        {invite.shortUrl}
                                      </div>
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(invite.shortUrl || "").then(() => {
                                            alert("Short URL copied to clipboard!");
                                          }).catch(() => {
                                            const textArea = document.createElement("textarea");
                                            textArea.value = invite.shortUrl || "";
                                            document.body.appendChild(textArea);
                                            textArea.select();
                                            document.execCommand("copy");
                                            document.body.removeChild(textArea);
                                            alert("Short URL copied to clipboard!");
                                          });
                                        }}
                                        className="mt-1 flex items-center gap-1 text-xs text-[#2357FF] hover:text-[#1a46d9] font-medium underline"
                                      >
                                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        Copy Short URL
                                      </button>
                                    </div>
                                  )}
                                  <div className="text-xs">
                                    <span className="font-medium text-slate-600">Full Invite Link:</span>
                                    <div className="mt-1 text-xs text-slate-400 break-all font-mono bg-white/50 p-1 rounded border border-amber-200">
                                      {(() => {
                                        const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
                                        const identifier = invite.email || invite.phone || "";
                                        const paramName = invite.email ? "email" : "phone";
                                        let inviteLink = `${baseUrl}/invite?token=${invite.inviteToken}&business=${invite.businessId}&${paramName}=${encodeURIComponent(identifier)}&role=${invite.role}`;
                                        // Add cashbook ID if present
                                        if (invite.cashbookId) {
                                          inviteLink += `&cashbook=${invite.cashbookId}`;
                                        }
                                        return inviteLink;
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </div>
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
              )
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
                              const value = e.target.value.trim();
                              setInvitePhone(e.target.value);
                              if (value) {
                                setInviteMethod("phone");
                                setSelectedUserId("");
                                setInviteEmail("");
                                // Debounce: check user existence after a short delay
                                setTimeout(() => {
                                  checkUserExists(null, value);
                                }, 500);
                              } else {
                                setInviteMethod("existing");
                                setIsExistingUser(false);
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
                              const value = e.target.value.trim();
                              setInviteEmail(e.target.value);
                              if (value) {
                                setInviteMethod("email");
                                setSelectedUserId("");
                                setInvitePhone("");
                                // Debounce: check user existence after a short delay
                                setTimeout(() => {
                                  checkUserExists(value, null);
                                }, 500);
                              } else {
                                setInviteMethod("existing");
                                setIsExistingUser(false);
                              }
                            }}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1f2937] placeholder-slate-400 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                          />
                          {checkingUser && (
                            <p className="mt-1 text-xs text-slate-500">Checking if user exists...</p>
                          )}
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
                            {isExistingUser 
                              ? `${invitedUserEmail || invitedUserPhone} is an existing CashBook user. Send invite to ${invitedUserEmail || invitedUserPhone} to join this business.`
                              : `${invitedUserEmail || invitedUserPhone} is a new user. Send invite to ${invitedUserEmail || invitedUserPhone} to join this business.`
                            }
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white">
                              {(invitedUserEmail || invitedUserPhone).charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-[#1f2937]">{invitedUserEmail || invitedUserPhone}</p>
                              {invitedUserEmail && <p className="text-xs text-slate-500">{invitedUserEmail}</p>}
                            </div>
                            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${
                              isExistingUser 
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                : "border-slate-300 bg-white text-slate-600"
                            }`}>
                              {isExistingUser ? "CashBook User" : "Not a CashBook User"}
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
                        onClick={async () => {
                          setInviteRole("Staff");
                          setSelectedBusinessForPartner(null);
                          // Fetch cashbooks for the selected business when Staff is selected
                          if (selectedBusinessId) {
                            await fetchCashbooksForInvite(selectedBusinessId);
                          }
                        }}
                        className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                          inviteRole === "Staff"
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        Staff
                      </button>
                      <button
                        onClick={async () => {
                          setInviteRole("Partner");
                          setSelectedCashbookId(null);
                          setCashbooksForInvite([]);
                          // Fetch businesses if not already loaded
                          if (businesses.length === 0) {
                            await fetchBusinesses();
                          }
                          // Auto-select the current business for partner
                          setSelectedBusinessForPartner(selectedBusinessId);
                        }}
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

                  {/* Cashbook Selection (for Staff) */}
                  {inviteRole === "Staff" && selectedBusinessId && (
                    <div className="mb-4">
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Select Cashbook <span className="text-red-500">*</span>
                      </label>
                      {loadingCashbooks ? (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#2f4bff]"></div>
                          Loading cashbooks...
                        </div>
                      ) : (
                        <select
                          value={selectedCashbookId || ""}
                          onChange={(e) => setSelectedCashbookId(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1f2937] focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                          required
                        >
                          <option value="">Select a cashbook...</option>
                          {cashbooksForInvite.map((cashbook) => (
                            <option key={cashbook.id} value={cashbook.id}>
                              {cashbook.name}
                            </option>
                          ))}
                        </select>
                      )}
                      {!loadingCashbooks && cashbooksForInvite.length === 0 && (
                        <p className="mt-1 text-xs text-amber-600">
                          No cashbooks found for this business. Please create a cashbook first.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Business Selection (for Partner) */}
                  {inviteRole === "Partner" && (
                    <div className="mb-4">
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Select Business <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedBusinessForPartner || ""}
                        onChange={(e) => setSelectedBusinessForPartner(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1f2937] focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                        required
                      >
                        <option value="">Select a business...</option>
                        {businesses.map((business) => (
                          <option key={business.id} value={business.id}>
                            {business.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

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
                      disabled={
                        addingMember ||
                        (inviteRole === "Staff" && !selectedCashbookId) ||
                        (inviteRole === "Partner" && !selectedBusinessForPartner)
                      }
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

