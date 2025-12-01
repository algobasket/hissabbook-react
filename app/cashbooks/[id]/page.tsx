"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import AppShell from "../../components/AppShell";
import ProtectedRoute from "../../components/ProtectedRoute";
import { getAuthToken, getUserRole, isAdmin, fetchUserPermissions } from "../../utils/auth";
import jsPDF from "jspdf";

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "/backend");

interface Book {
  id: string;
  name: string;
  description: string | null;
  currencyCode: string;
  ownerId: string;
  totalBalance: number;
  masterWalletBalance: number;
}

export default function BookDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bookId = params?.id as string;

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [duration, setDuration] = useState("all");
  const [types, setTypes] = useState("all");
  const [parties, setParties] = useState("all");
  const [members, setMembers] = useState("all");
  const [paymentModes, setPaymentModes] = useState<string[]>([]);
  const [categories, setCategories] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Dropdown open states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState("");

  // Modal states
  const [showCashEntryModal, setShowCashEntryModal] = useState(false);
  const [entryType, setEntryType] = useState<"cash_in" | "cash_out">("cash_in");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showHourDropdown, setShowHourDropdown] = useState(false);
  const [showMinuteDropdown, setShowMinuteDropdown] = useState(false);
  const [showAmPmDropdown, setShowAmPmDropdown] = useState(false);
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [partySearch, setPartySearch] = useState("");
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showPaymentModeDropdown, setShowPaymentModeDropdown] = useState(false);
  const [paymentModeSearch, setPaymentModeSearch] = useState("");
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddPaymentModeModal, setShowAddPaymentModeModal] = useState(false);
  const [showAddPartyModal, setShowAddPartyModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newPaymentModeName, setNewPaymentModeName] = useState("");
  const [newPartyName, setNewPartyName] = useState("");
  const [newPartyMobile, setNewPartyMobile] = useState("");
  const [newPartyType, setNewPartyType] = useState<"Customer" | "Supplier">("Customer");
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingPaymentMode, setSavingPaymentMode] = useState(false);
  const [savingParty, setSavingParty] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [calculatedAmount, setCalculatedAmount] = useState<number | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<Array<{ id: string; file: File; preview: string; uploaded?: boolean; attachmentId?: string }>>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
    amount: "",
    partyName: "",
    remarks: "",
    category: "",
    paymentMode: "Cash",
  });

  // Calculate amount from expression
  const calculateAmount = (expression: string) => {
    if (!expression.trim()) {
      setCalculatedAmount(null);
      return;
    }

    try {
      // Remove any characters that aren't numbers, operators, spaces, or parentheses
      const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, "");
      if (!sanitized) {
        setCalculatedAmount(null);
        return;
      }

      // Use Function constructor instead of eval for better security
      const result = Function(`"use strict"; return (${sanitized})`)();
      if (typeof result === "number" && !isNaN(result) && isFinite(result)) {
        setCalculatedAmount(result);
      } else {
        setCalculatedAmount(null);
      }
    } catch (error) {
      setCalculatedAmount(null);
    }
  };

  // Close modal handler
  const handleCloseModal = () => {
    setShowCashEntryModal(false);
    setEditingEntry(null);
    // Reset form
    setFormData({
      date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
      amount: "",
      partyName: "",
      remarks: "",
      category: "",
      paymentMode: "Cash",
    });
    setAttachedFiles([]);
  };

  const [bookMembers, setBookMembers] = useState<Array<{ id: string; name: string; email?: string }>>([]);
  const [paymentModesList] = useState([{ id: "1", name: "Cash" }, { id: "2", name: "Online" }]);
  const [partiesList, setPartiesList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [suggestionsList, setSuggestionsList] = useState<any[]>([]);
  const [loadingParties, setLoadingParties] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [entries, setEntries] = useState<any[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(50);
  const [showPageSelector, setShowPageSelector] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  const [showMoreActionsModal, setShowMoreActionsModal] = useState(false);
  const [booksList, setBooksList] = useState<any[]>([]);
  const [selectedTargetBook, setSelectedTargetBook] = useState<string | null>(null);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<any | null>(null);
  const [showReportsDropdown, setShowReportsDropdown] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFilterType, setExportFilterType] = useState<"all" | "day" | "party" | "category" | "payment_mode">("all");
  const [reportData, setReportData] = useState<any>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showPdfSettings, setShowPdfSettings] = useState(false);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [pdfSettings, setPdfSettings] = useState({
    columns: {
      date: true,
      time: true,
      balance: true,
      paymentModes: true,
      cashIn: true,
      cashOut: true,
      category: false,
      remark: true,
      members: false,
      party: false,
    },
    includeUserNameAndNumber: false,
    includeAppliedFilters: false,
  });

  useEffect(() => {
    if (bookId) {
      fetchBook();
      fetchParties();
      fetchCategories();
      fetchEntries();
      fetchBooksList();
      fetchBookMembers();
    }
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [bookId, duration, types, parties, members, paymentModes, categories, searchQuery]);

  // Fetch user permissions on mount
  useEffect(() => {
    fetchUserPermissions().then(setUserPermissions);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showReportsDropdown && !(event.target as Element).closest('.relative')) {
        setShowReportsDropdown(false);
      }
      // Close page selector dropdown
      const pageButton = (event.target as Element).closest('[data-page-selector-button]');
      if (!pageButton) {
        setShowPageSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showReportsDropdown]);

  // Generate report preview when filter type changes
  useEffect(() => {
    if (showExportModal && exportFilterType) {
      generateReportPreview("pdf");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportFilterType, showExportModal]);

  // Load PDF settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('pdfSettings');
    if (savedSettings) {
      try {
        setPdfSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to load PDF settings:', error);
      }
    }
  }, []);

  const fetchBooksList = async () => {
    try {
      setLoadingBooks(true);
      const token = getAuthToken();
      if (!token) {
        return;
      }

      const response = await fetch(`${API_BASE}/api/books`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch books");
        return;
      }

      const data = await response.json();
      // Filter out current book from the list
      setBooksList((data.books || []).filter((b: any) => b.id !== bookId));
    } catch (err) {
      console.error("Error fetching books:", err);
    } finally {
      setLoadingBooks(false);
    }
  };

  const fetchBookMembers = async () => {
    try {
      const token = getAuthToken();
      if (!token || !bookId) {
        return;
      }

      const response = await fetch(`${API_BASE}/api/books/${bookId}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch book members");
        return;
      }

      const data = await response.json();
      // Transform the members data to match the expected format
      const membersList = (data.users || []).map((user: any) => ({
        id: user.id,
        name: user.name || user.firstName || user.email?.split("@")[0] || "Unknown",
        email: user.email,
      }));
      setBookMembers(membersList);
    } catch (err) {
      console.error("Error fetching book members:", err);
    }
  };

  const fetchEntryWithAttachments = async (entryId: string) => {
    try {
      const token = getAuthToken();
      if (!token) {
        return null;
      }

      // First, try to get the entry from current entries state (faster)
      let entry = entries.find((e: any) => e.id === entryId);
      
      // If not found in state, fetch from API
      if (!entry) {
        const entriesResponse = await fetch(`${API_BASE}/api/books/${bookId}/entries`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (entriesResponse.ok) {
          const entriesData = await entriesResponse.json();
          entry = (entriesData.entries || []).find((e: any) => e.id === entryId);
        }
      }

      if (!entry) {
        console.error("Entry not found");
        return null;
      }

      // Now fetch attachments for this entry
      try {
        const attachmentsResponse = await fetch(`${API_BASE}/api/books/${bookId}/entries/${entryId}/attachments`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (attachmentsResponse.ok) {
          const attachmentsData = await attachmentsResponse.json();
          entry.attachments = attachmentsData.attachments || [];
          console.log("Attachments fetched:", entry.attachments);
        } else {
          // If 404, it means no attachments found (which is fine)
          if (attachmentsResponse.status === 404) {
            entry.attachments = [];
          } else {
            console.log("Error fetching attachments:", attachmentsResponse.status);
            entry.attachments = entry.attachments || [];
          }
        }
      } catch (attachErr) {
        console.error("Error fetching attachments:", attachErr);
        entry.attachments = entry.attachments || [];
      }

      return entry;
    } catch (err) {
      console.error("Error fetching entry with attachments:", err);
      return null;
    }
  };

  const handleMoveEntry = async (entryId: string, targetBookId: string) => {
    try {
      const token = getAuthToken();
      if (!token) {
        alert("Not authenticated");
        return;
      }

      // First, get the entry details
      const entryResponse = await fetch(`${API_BASE}/api/books/${bookId}/entries/${entryId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!entryResponse.ok) {
        throw new Error("Failed to fetch entry details");
      }

      const entryData = await entryResponse.json();
      const entry = entryData.entry || entryData;

      // Create the entry in the target book
      const createResponse = await fetch(`${API_BASE}/api/books/${targetBookId}/entries`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entryType: entry.entry_type,
          amount: entry.amount,
          partyId: entry.party_id || null,
          partyName: entry.party_name || null,
          categoryId: entry.category_id || null,
          categoryName: entry.category_name || null,
          paymentMode: entry.payment_mode || null,
          remarks: entry.remarks || null,
          entryDate: entry.entry_date,
          entryTime: entry.entry_time || null,
          attachmentIds: entry.attachments?.map((a: any) => a.id) || [],
        }),
      });

      if (!createResponse.ok) {
        throw new Error("Failed to create entry in target book");
      }

      // Delete the entry from the current book
      const deleteResponse = await fetch(`${API_BASE}/api/books/${bookId}/entries/${entryId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!deleteResponse.ok) {
        throw new Error("Failed to delete entry from source book");
      }

      alert("Entry moved successfully!");
      setShowMoreActionsModal(false);
      setSelectedEntry(null);
      setSelectedTargetBook(null);
      await fetchEntries();
    } catch (err) {
      console.error("Error moving entry:", err);
      alert(err instanceof Error ? err.message : "Failed to move entry");
    }
  };

  const handleCopyEntry = async (entryId: string, targetBookId: string, opposite: boolean) => {
    try {
      const token = getAuthToken();
      if (!token) {
        alert("Not authenticated");
        return;
      }

      // Get the entry details
      const entryResponse = await fetch(`${API_BASE}/api/books/${bookId}/entries/${entryId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!entryResponse.ok) {
        throw new Error("Failed to fetch entry details");
      }

      const entryData = await entryResponse.json();
      const entry = entryData.entry || entryData;

      // Determine entry type (opposite if requested)
      let entryType = entry.entry_type;
      if (opposite) {
        entryType = entry.entry_type === "cash_in" ? "cash_out" : "cash_in";
      }

      // Create the entry in the target book
      const createResponse = await fetch(`${API_BASE}/api/books/${targetBookId}/entries`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entryType: entryType,
          amount: entry.amount,
          partyId: entry.party_id || null,
          partyName: entry.party_name || null,
          categoryId: entry.category_id || null,
          categoryName: entry.category_name || null,
          paymentMode: entry.payment_mode || null,
          remarks: entry.remarks || null,
          entryDate: entry.entry_date,
          entryTime: entry.entry_time || null,
          attachmentIds: entry.attachments?.map((a: any) => a.id) || [],
        }),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || `HTTP ${createResponse.status}` };
        }
        throw new Error(errorData.message || "Failed to copy entry");
      }

      alert(`Entry ${opposite ? "copied as opposite" : "copied"} successfully!`);
      setShowMoreActionsModal(false);
      setSelectedEntry(null);
      setSelectedTargetBook(null);
    } catch (err) {
      console.error("Error copying entry:", err);
      alert(err instanceof Error ? err.message : "Failed to copy entry");
    }
  };

  const generateReportPreview = async (format: "pdf" | "excel") => {
    try {
      setGeneratingReport(true);
      const token = getAuthToken();
      if (!token) {
        alert("Not authenticated");
        return;
      }

      // Build query parameters based on current filters
      const params = new URLSearchParams();
      if (duration !== "all") params.append("duration", duration);
      if (types !== "all") params.append("types", types);
      if (parties !== "all") params.append("parties", parties);
      if (members !== "all") params.append("members", members);
      if (paymentModes.length > 0) params.append("paymentModes", paymentModes.join(","));
      if (categories !== "all") params.append("categories", categories);
      if (searchQuery) params.append("search", searchQuery);
      params.append("filterType", exportFilterType);
      params.append("format", format);

      const response = await fetch(`${API_BASE}/api/books/${bookId}/reports/preview?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to generate report preview");
      }

      const data = await response.json();
      setReportData(data);
    } catch (err) {
      console.error("Error generating report preview:", err);
      alert(err instanceof Error ? err.message : "Failed to generate report preview");
    } finally {
      setGeneratingReport(false);
    }
  };

  const generatePDF = async (data: any) => {
    // Dynamically import jspdf-autotable on client side only
    const { default: autoTable } = await import("jspdf-autotable");
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Fetch small logo from site settings (try public endpoint first, then authenticated)
    let smallLogoBase64: string | null = null;
    try {
      // Try public endpoint first
      let logoFilename: string | null = null;
      try {
        const publicResponse = await fetch(`${API_BASE}/api/settings/site/public`);
        if (publicResponse.ok) {
          const publicSettings = await publicResponse.json();
          logoFilename = publicSettings.smallLogoUrl || null;
        }
      } catch (publicErr) {
        // If public endpoint fails, try authenticated endpoint
        const token = getAuthToken();
        if (token) {
          const response = await fetch(`${API_BASE}/api/settings/site`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const siteSettings = await response.json();
            logoFilename = siteSettings.smallLogoUrl || null;
          }
        }
      }

      if (logoFilename) {
        const logoUrl = logoFilename.startsWith('http') 
          ? logoFilename 
          : `${API_BASE}/uploads/${logoFilename}`;
        
        console.log("Fetching logo from:", logoUrl);
        
        // Fetch image and convert to base64 using Image object for better compatibility
        try {
          // Use Image object to load and then convert to canvas for base64
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          let resolved = false;
          smallLogoBase64 = await new Promise<string | null>((resolve) => {
            const timeout = setTimeout(() => {
              if (!resolved) {
                resolved = true;
                console.warn("Logo loading timeout");
                resolve(null);
              }
            }, 3000);
            
            img.onload = () => {
              if (resolved) return;
              try {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(img, 0, 0);
                  const base64 = canvas.toDataURL('image/png');
                  console.log("Logo converted to base64, length:", base64.length);
                  resolved = true;
                  clearTimeout(timeout);
                  resolve(base64);
                } else {
                  resolved = true;
                  clearTimeout(timeout);
                  resolve(null);
                }
              } catch (err) {
                console.warn("Error converting logo to base64:", err);
                resolved = true;
                clearTimeout(timeout);
                resolve(null);
              }
            };
            img.onerror = () => {
              if (resolved) return;
              console.warn("Failed to load logo image");
              resolved = true;
              clearTimeout(timeout);
              resolve(null);
            };
            img.src = logoUrl;
          });
        } catch (imgErr) {
          console.warn("Failed to load logo image:", imgErr);
        }
      } else {
        console.warn("No small logo filename found in site settings");
      }
    } catch (err) {
      console.warn("Failed to fetch site logo:", err);
      // Continue without logo if fetch fails
    }

    // Header with title - improved design
    doc.setFillColor(0, 51, 104); // #003368
    doc.rect(0, 0, pageWidth, 35, "F");
    
    // Add small logo if available (on left side)
    let logoWidth = 0;
    let logoHeight = 0;
    if (smallLogoBase64) {
      try {
        // Load image to get actual dimensions for aspect ratio
        const img = new Image();
        img.src = smallLogoBase64;
        
        await new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
          } else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(() => resolve(), 1000); // Timeout after 1 second
          }
        });
        
        if (img.width && img.height) {
          // Calculate dimensions maintaining aspect ratio
          // Max height is 25px to fit in header (35px height with some padding)
          const maxHeight = 25;
          const aspectRatio = img.width / img.height;
          
          logoHeight = maxHeight;
          logoWidth = maxHeight * aspectRatio;
          
          // Ensure logo doesn't get too wide (max 60px width)
          if (logoWidth > 60) {
            logoWidth = 60;
            logoHeight = 60 / aspectRatio;
          }
          
          // Position logo on the left side of header
          const logoX = 18;
          const logoY = (35 - logoHeight) / 2; // Center vertically in header
          
          // Since we convert to canvas, it will always be PNG format
          // Extract base64 data (remove data URL prefix)
          const base64Data = smallLogoBase64.split(',')[1];
          
          if (base64Data) {
            doc.addImage(base64Data, 'PNG', logoX, logoY, logoWidth, logoHeight);
            console.log("Logo added to PDF successfully at", logoX, logoY, "size:", logoWidth, "x", logoHeight, "aspect ratio:", aspectRatio);
          } else {
            console.warn("Failed to extract base64 data from logo");
          }
        } else {
          console.warn("Failed to get image dimensions");
        }
      } catch (err) {
        console.error("Failed to add logo to PDF:", err);
        // Continue without logo
      }
    } else {
      console.warn("No logo available to add to PDF");
    }
    
    // Report title - on left side (after logo if present)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    const titleX = logoWidth > 0 ? 18 + logoWidth + 10 : 18; // Add spacing after logo
    doc.text("HissabBook Report", titleX, 24);

    yPosition = 45;

    // Generated info - improved styling
    doc.setTextColor(71, 85, 105); // slate-600
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const generatedDate = new Date().toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    doc.text(`Generated On - ${generatedDate}`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 12;

    // Book title - improved styling
    doc.setTextColor(31, 41, 55); // slate-800
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    const filterTypeLabel = data.filterType === "day" ? "Day-wise" : 
                           data.filterType === "party" ? "Party-wise" : 
                           data.filterType === "category" ? "Category-wise" : 
                           data.filterType === "payment_mode" ? "Payment Mode-wise" : "";
    const bookTitle = data.book?.name || "Cashbook";
    const fullTitle = filterTypeLabel ? `${bookTitle} (${filterTypeLabel} Summary)` : bookTitle;
    doc.text(fullTitle, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 18;

    // Summary box - improved design with individual borders for each section
    const boxHeight = 30;
    const boxWidth = (pageWidth - 40 - 20) / 3; // Divide available width by 3, with spacing
    const boxSpacing = 10;
    const startX = 20;
    
    // Draw three separate boxes with borders
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(203, 213, 225); // slate-300 for border
    doc.setLineWidth(0.5);
    
    // Box 1: Total Cash In
    doc.rect(startX, yPosition - 5, boxWidth, boxHeight, "FD");
    
    // Box 2: Total Cash Out
    doc.rect(startX + boxWidth + boxSpacing, yPosition - 5, boxWidth, boxHeight, "FD");
    
    // Box 3: Final Balance
    doc.rect(startX + (boxWidth + boxSpacing) * 2, yPosition - 5, boxWidth, boxHeight, "FD");
    
    // Labels
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text("Total Cash In", startX + boxWidth / 2, yPosition + 4, { align: "center" });
    doc.text("Total Cash Out", startX + boxWidth + boxSpacing + boxWidth / 2, yPosition + 4, { align: "center" });
    const balanceLabel = data.filterType && data.filterType !== "all" ? "Net Balance" : "Final Balance";
    doc.text(balanceLabel, startX + (boxWidth + boxSpacing) * 2 + boxWidth / 2, yPosition + 4, { align: "center" });
    
    // Values
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 163, 74); // green-600
    const totalCashIn = parseFloat(data.summary?.totalCashIn || 0);
    doc.text(totalCashIn.toFixed(2), startX + boxWidth / 2, yPosition + 15, { align: "center" });
    doc.setTextColor(220, 38, 38); // red-600
    const totalCashOut = parseFloat(data.summary?.totalCashOut || 0);
    doc.text(totalCashOut.toFixed(2), startX + boxWidth + boxSpacing + boxWidth / 2, yPosition + 15, { align: "center" });
    // Final Balance color based on value
    const finalBalance = parseFloat(data.summary?.finalBalance || 0);
    doc.setTextColor(finalBalance >= 0 ? 22 : 220, finalBalance >= 0 ? 163 : 38, finalBalance >= 0 ? 74 : 38);
    doc.text(finalBalance.toFixed(2), startX + (boxWidth + boxSpacing) * 2 + boxWidth / 2, yPosition + 15, { align: "center" });
    
    yPosition += 32;

    // Total entries - improved styling
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(`Total No. of entries: ${data.totalEntries || 0}`, 20, yPosition);
    yPosition += 12;

    // Table headers based on filter type and PDF settings
    const headers: string[] = [];
    const isSummary = data.filterType && data.filterType !== "all";
    
    if (isSummary) {
      // Summary view - show only relevant columns
      if (data.filterType === "day" && pdfSettings.columns.date) headers.push("Date");
      if (data.filterType === "party" && pdfSettings.columns.party) headers.push("Party");
      if (data.filterType === "category" && pdfSettings.columns.category) headers.push("Category");
      if (data.filterType === "payment_mode" && pdfSettings.columns.paymentModes) headers.push("Mode");
      if (pdfSettings.columns.cashIn) headers.push("Cash In");
      if (pdfSettings.columns.cashOut) headers.push("Cash Out");
      if (pdfSettings.columns.balance) headers.push("Balance");
    } else {
      // All entries view
      if (pdfSettings.columns.date) headers.push("Date");
      if (pdfSettings.columns.remark) headers.push("Remark");
      if (pdfSettings.columns.party) headers.push("Party");
      if (pdfSettings.columns.category) headers.push("Category");
      if (pdfSettings.columns.paymentModes) headers.push("Mode");
      if (pdfSettings.columns.cashIn) headers.push("Cash In");
      if (pdfSettings.columns.cashOut) headers.push("Cash Out");
      if (pdfSettings.columns.members) headers.push("Entry By");
      if (pdfSettings.columns.balance) headers.push("Balance");
    }

    // Table rows
    const rows: any[] = [];
    if (data.entries && data.entries.length > 0) {
      data.entries.forEach((entry: any) => {
        const row: any[] = [];
        
        if (entry.isSummary) {
          // Summary row
          if (data.filterType === "day" && pdfSettings.columns.date) {
            const date = new Date(entry.entry_date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "2-digit",
            });
            row.push(date);
          }
          if (data.filterType === "party" && pdfSettings.columns.party) {
            const partyDisplay = entry.party_name && entry.party_name.startsWith("phone_") 
              ? "via phone" 
              : (entry.party_name || "-");
            row.push(partyDisplay);
          }
          if (data.filterType === "category" && pdfSettings.columns.category) {
            row.push(entry.category_name || "-");
          }
          if (data.filterType === "payment_mode" && pdfSettings.columns.paymentModes) {
            row.push(entry.payment_mode || "-");
          }
          if (pdfSettings.columns.cashIn) {
            row.push(entry.cash_in || 0);
          }
          if (pdfSettings.columns.cashOut) {
            row.push(entry.cash_out || 0);
          }
          if (pdfSettings.columns.balance) {
            row.push(entry.balance || 0);
          }
        } else {
          // Regular entry row
          if (pdfSettings.columns.date) {
            const date = new Date(entry.entry_date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "2-digit",
            });
            // Add time if available
            const timeStr = entry.entry_time 
              ? new Date(`2000-01-01T${entry.entry_time}`).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })
              : "";
            const dateTimeStr = timeStr ? `${date}, ${timeStr}` : date;
            row.push(dateTimeStr);
          }
          if (pdfSettings.columns.remark) {
            const remarks = entry.remarks || "-";
            // Show full remark text in PDF (no truncation)
            row.push(remarks);
          }
          if (pdfSettings.columns.party) {
            const partyDisplay = entry.party_name && entry.party_name.startsWith("phone_") 
              ? "via phone" 
              : (entry.party_name || "-");
            row.push(partyDisplay);
          }
          if (pdfSettings.columns.category) {
            row.push(entry.category_name || "-");
          }
          if (pdfSettings.columns.paymentModes) {
            row.push(entry.payment_mode || "-");
          }
          if (pdfSettings.columns.cashIn) {
            row.push(entry.entry_type === "cash_in" ? entry.amount : "");
          }
          if (pdfSettings.columns.cashOut) {
            row.push(entry.entry_type === "cash_out" ? entry.amount : "");
          }
          if (pdfSettings.columns.members) {
            row.push(entry.created_by_name || "-");
          }
          if (pdfSettings.columns.balance) {
            row.push(entry.balance || 0);
          }
        }
        rows.push(row);
      });

      // Final balance row - only for "all entries" view
      if (data.summary && !isSummary) {
        const finalRow: any[] = [];
        if (pdfSettings.columns.date) {
          finalRow.push(new Date().toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "2-digit",
          }));
        }
        if (pdfSettings.columns.remark) {
          finalRow.push("Final Balance");
        }
        if (pdfSettings.columns.party) {
          finalRow.push("");
        }
        if (pdfSettings.columns.category) {
          finalRow.push("");
        }
        if (pdfSettings.columns.paymentModes) {
          finalRow.push("");
        }
        if (pdfSettings.columns.cashIn) {
          finalRow.push(data.summary.totalCashIn || 0);
        }
        if (pdfSettings.columns.cashOut) {
          finalRow.push(data.summary.totalCashOut || 0);
        }
        if (pdfSettings.columns.members) {
          finalRow.push("");
        }
        if (pdfSettings.columns.balance) {
          finalRow.push(data.summary.finalBalance || 0);
        }
        rows.push(finalRow);
      }
    }

    const tableMargin = 20;
    const shadowOffset = 3;
    const cornerRadius = 5;

    // Generate table - improved styling with borders
    autoTable(doc, {
      startY: yPosition,
      head: [headers],
      body: rows,
      theme: "striped",
      margin: { left: tableMargin, right: tableMargin },
      headStyles: {
        fillColor: [0, 51, 104], // #003368
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
        halign: "center",
        lineColor: [0, 51, 104], // Match header color for border
        lineWidth: 0.5,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251], // slate-50
        lineColor: [203, 213, 225], // slate-300
        lineWidth: 0.3,
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
        lineColor: [203, 213, 225], // slate-300 for better visibility
        lineWidth: 0.5,
        textColor: [31, 41, 55], // slate-800
      },
      columnStyles: {
        0: { cellWidth: 30, halign: "left" },
      },
      didParseCell: function(data: any) {
        // Color code balance values
        if (data.column.index === headers.length - 1 && headers[headers.length - 1] === "Balance") {
          const value = parseFloat(data.cell.text[0] || 0);
          if (value < 0) {
            data.cell.styles.textColor = [220, 38, 38]; // red-600
          } else if (value > 0) {
            data.cell.styles.textColor = [22, 163, 74]; // green-600
          }
        }
        // Color code Cash In values
        const cashInIndex = headers.indexOf("Cash In");
        if (cashInIndex !== -1 && data.column.index === cashInIndex && data.cell.text[0] && parseFloat(data.cell.text[0]) > 0) {
          data.cell.styles.textColor = [22, 163, 74]; // green-600
        }
        // Color code Cash Out values
        const cashOutIndex = headers.indexOf("Cash Out");
        if (cashOutIndex !== -1 && data.column.index === cashOutIndex && data.cell.text[0] && parseFloat(data.cell.text[0]) > 0) {
          data.cell.styles.textColor = [220, 38, 38]; // red-600
        }
      },
      didDrawPage: function(data: any) {
        // Draw shadow and border after table is drawn
        const table = (data as any).table;
        if (table && table.finalY) {
          const tableStartY = yPosition - 5;
          const tableEndY = table.finalY + 5;
          const tableWidth = pageWidth - (tableMargin * 2);
          const tableHeight = tableEndY - tableStartY;

          // Draw shadow behind table (offset to bottom-right for depth effect)
          doc.setFillColor(0, 0, 0, 0.1); // Semi-transparent black for shadow
          doc.rect(tableMargin + shadowOffset, tableStartY + shadowOffset, tableWidth, tableHeight, "F");

          // Draw outer border with proper outline
          doc.setDrawColor(148, 163, 184); // slate-400 for border
          doc.setLineWidth(1.5);
          
          // Draw complete border rectangle around the table
          doc.rect(tableMargin, tableStartY, tableWidth, tableHeight, "S");
        }
      },
    });

    // Footer - improved design
    const finalY = (doc as any).lastAutoTable?.finalY || yPosition + 50;
    const footerY = pageHeight - 25;
    if (finalY < footerY) {
      doc.setFillColor(0, 51, 104); // #003368
      doc.rect(0, footerY, pageWidth, 25, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Generated by HissabBook App. Install Now", pageWidth / 2, footerY + 12, { align: "center" });
    }

    return doc;
  };

  const downloadReport = async (format: "pdf" | "excel") => {
    try {
      setGeneratingReport(true);
      const token = getAuthToken();
      if (!token) {
        alert("Not authenticated");
        return;
      }

      // Build query parameters based on current filters
      const params = new URLSearchParams();
      if (duration !== "all") params.append("duration", duration);
      if (types !== "all") params.append("types", types);
      if (parties !== "all") params.append("parties", parties);
      if (members !== "all") params.append("members", members);
      if (paymentModes.length > 0) params.append("paymentModes", paymentModes.join(","));
      if (categories !== "all") params.append("categories", categories);
      if (searchQuery) params.append("search", searchQuery);
      params.append("filterType", exportFilterType);

      const response = await fetch(`${API_BASE}/api/books/${bookId}/reports/preview?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to download report");
      }

      const data = await response.json();
      
      if (format === "pdf") {
        // Generate and download PDF
        const doc = await generatePDF(data);
        const fileName = `${book?.name || "report"}-${new Date().toISOString().split("T")[0]}@HissabBook.pdf`;
        doc.save(fileName);
      } else {
        // For Excel, download as JSON for now (can be implemented later with exceljs)
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${book?.name || "report"}-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Error downloading report:", err);
      alert(err instanceof Error ? err.message : "Failed to download report");
    } finally {
      setGeneratingReport(false);
    }
  };

  const fetchParties = async () => {
    try {
      setLoadingParties(true);
      const token = getAuthToken();
      if (!token) {
        return;
      }

      const response = await fetch(`${API_BASE}/api/books/${bookId}/parties`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch parties");
        return;
      }

      const data = await response.json();
      setPartiesList(data.parties || []);
    } catch (err) {
      console.error("Error fetching parties:", err);
    } finally {
      setLoadingParties(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const token = getAuthToken();
      if (!token) {
        return;
      }

      const response = await fetch(`${API_BASE}/api/books/${bookId}/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch categories");
        return;
      }

      const data = await response.json();
      setCategoriesList(data.bookCategories || []);
      setSuggestionsList(data.suggestions || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchEntries = async () => {
    if (!bookId) return;
    
    try {
      setLoadingEntries(true);
      const token = getAuthToken();
      if (!token) {
        return;
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (types !== "all") params.append("entryType", types);
      if (parties !== "all") params.append("partyId", parties);
      if (categories !== "all") params.append("categoryId", categories);
      if (paymentModes.length > 0 && !paymentModes.includes("all")) {
        // Handle multiple payment modes - for now, just use first one
        params.append("paymentMode", paymentModes[0]);
      }
      if (members !== "all") params.append("memberId", members);
      if (searchQuery) params.append("search", searchQuery);

      // Handle duration filter
      if (duration !== "all") {
        const today = new Date();
        let startDate: Date;
        
        switch (duration) {
          case "today":
            startDate = new Date(today.setHours(0, 0, 0, 0));
            break;
          case "week":
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 7);
            break;
          case "month":
            startDate = new Date(today);
            startDate.setMonth(today.getMonth() - 1);
            break;
          case "year":
            startDate = new Date(today);
            startDate.setFullYear(today.getFullYear() - 1);
            break;
          default:
            startDate = new Date(0); // All time
        }
        
        if (duration !== "all") {
          params.append("startDate", startDate.toISOString().split('T')[0]);
        }
      }

      const entriesUrl = `${API_BASE}/api/books/${bookId}/entries?${params.toString()}`;
      console.log("Fetching entries from:", entriesUrl);

      const response = await fetch(entriesUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Entries response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch entries:", response.status, errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.message || `Failed to fetch entries: ${response.status}`);
      }

      const data = await response.json();
      console.log("Entries fetched successfully:", data.entries?.length || 0, "entries");
      setEntries(data.entries || []);
    } catch (err) {
      console.error("Error fetching entries:", err);
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        console.error("Network error: Cannot reach server. Check if backend is running.");
      }
      setEntries([]); // Set empty array on error
    } finally {
      setLoadingEntries(false);
    }
  };

  const fetchBook = async () => {
    try {
      setLoading(true);
      setError(null);
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

      if (!response.ok) {
        throw new Error("Failed to fetch book");
      }

      const data = await response.json();
      setBook(data.book);
    } catch (err) {
      console.error("Error fetching book:", err);
      setError(err instanceof Error ? err.message : "Failed to load book");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell activePath="/cashbooks">
          <div className="flex min-h-screen items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-[#2f4bff]"></div>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  if (error || !book) {
    return (
      <ProtectedRoute>
        <AppShell activePath="/cashbooks">
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <p className="text-red-600">{error || "Book not found"}</p>
              <button
                onClick={() => router.push("/cashbooks")}
                className="mt-4 rounded-lg bg-[#2f4bff] px-4 py-2 text-white"
              >
                Back to Cashbooks
              </button>
            </div>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell activePath="/cashbooks">
        <div className="min-h-screen bg-slate-50">
          {/* Header */}
          <div className="border-b border-slate-200 bg-white">
            <div className="w-full px-2 py-4 sm:px-3 lg:px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => router.push("/cashbooks")}
                    className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h1 className="text-xl font-semibold text-[#1f2937]">{book.name}</h1>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => router.push(`/cashbooks/${bookId}/settings/members`)}
                    className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                    title="Settings"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => router.push(`/cashbooks/${bookId}/settings/members`)}
                    className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                    title="Members"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </button>
                  {/* Add Bulk Entries - Only show for managers/admins */}
                  {(getUserRole() === "managers" || getUserRole() === "manager" || isAdmin()) && (
                    <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Add Bulk Entries
                    </button>
                  )}
                  <div className="relative">
                    <button 
                      onClick={() => setShowReportsDropdown(!showReportsDropdown)}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Reports
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showReportsDropdown && (
                      <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-lg z-50">
                        <button
                          onClick={() => {
                            setShowReportsDropdown(false);
                            setShowExportModal(true);
                            setExportFilterType("all");
                            generateReportPreview("pdf");
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-t-lg"
                        >
                          PDF Report
                        </button>
                        <button
                          onClick={() => {
                            setShowReportsDropdown(false);
                            downloadReport("excel");
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-b-lg"
                        >
                          Excel Report
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="border-b border-slate-200 bg-white">
            <div className="w-full px-2 py-4 sm:px-3 lg:px-4">
              {/* Filter Dropdowns */}
              <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {/* Duration Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === "duration" ? null : "duration")}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                  >
                    Duration: {duration === "all" ? "All Time" : duration === "today" ? "Today" : duration === "yesterday" ? "Yesterday" : duration === "this_month" ? "This Month" : duration === "last_month" ? "Last Month" : "Custom"}
                  </button>
                  {openDropdown === "duration" && (
                    <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                      <div className="p-2">
                        {["all", "today", "yesterday", "this_month", "last_month", "custom"].map((option) => (
                          <label key={option} className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 hover:bg-slate-50">
                            <input
                              type="radio"
                              name="duration"
                              value={option}
                              checked={duration === option}
                              onChange={(e) => setDuration(e.target.value)}
                              className="h-4 w-4 text-[#2f4bff] focus:ring-[#2f4bff]"
                            />
                            <span className="text-sm text-slate-700">
                              {option === "all" ? "All Time" : option === "today" ? "Today" : option === "yesterday" ? "Yesterday" : option === "this_month" ? "This Month" : option === "last_month" ? "Last Month" : "Custom"}
                            </span>
                          </label>
                        ))}
                      </div>
                      <div className="flex justify-end gap-2 border-t border-slate-200 p-2">
                        <button
                          onClick={() => {
                            setDuration("all");
                            setOpenDropdown(null);
                          }}
                          className="px-3 py-1 text-sm text-slate-600 hover:text-slate-800"
                        >
                          Clear
                        </button>
                        <button
                          onClick={() => setOpenDropdown(null)}
                          className="rounded bg-[#2f4bff] px-3 py-1 text-sm text-white hover:bg-[#2f4bff]/90"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Types Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === "types" ? null : "types")}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                  >
                    Types: {types === "all" ? "All" : types === "cash_in" ? "Cash In" : "Cash Out"}
                  </button>
                  {openDropdown === "types" && (
                    <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                      <div className="p-2">
                        {["all", "cash_in", "cash_out"].map((option) => (
                          <label key={option} className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 hover:bg-slate-50">
                            <input
                              type="radio"
                              name="types"
                              value={option}
                              checked={types === option}
                              onChange={(e) => setTypes(e.target.value)}
                              className="h-4 w-4 text-[#2f4bff] focus:ring-[#2f4bff]"
                            />
                            <span className="text-sm text-slate-700">
                              {option === "all" ? "All" : option === "cash_in" ? "Cash In" : "Cash Out"}
                            </span>
                          </label>
                        ))}
                      </div>
                      <div className="flex justify-end gap-2 border-t border-slate-200 p-2">
                        <button
                          onClick={() => {
                            setTypes("all");
                            setOpenDropdown(null);
                          }}
                          className="px-3 py-1 text-sm text-slate-600 hover:text-slate-800"
                        >
                          Clear
                        </button>
                        <button
                          onClick={() => setOpenDropdown(null)}
                          className="rounded bg-[#2f4bff] px-3 py-1 text-sm text-white hover:bg-[#2f4bff]/90"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Parties Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      if (partiesList.length === 0) {
                        setOpenDropdown("parties-empty");
                      } else {
                        setOpenDropdown(openDropdown === "parties" ? null : "parties");
                      }
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                  >
                    Parties: All
                  </button>
                  {openDropdown === "parties-empty" && (
                    <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
                      <h3 className="mb-2 font-semibold text-slate-900">No Party Added!</h3>
                      <p className="mb-4 text-sm text-slate-600">
                        You can add Parties for this book from book settings page{" "}
                        <button
                          onClick={() => router.push(`/cashbooks/${bookId}/settings/members`)}
                          className="text-[#2f4bff] hover:underline"
                        >
                          ⚙️
                        </button>
                        .
                      </p>
                      <button
                        onClick={() => setOpenDropdown(null)}
                        className="w-full rounded-lg bg-[#2f4bff] px-4 py-2 text-sm font-medium text-white hover:bg-[#2f4bff]/90"
                      >
                        Ok, Got it
                      </button>
                    </div>
                  )}
                </div>

                {/* Members Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === "members" ? null : "members")}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                  >
                    Members: {members === "all" ? "All" : bookMembers.find(m => m.id === members)?.name || "All"}
                  </button>
                  {openDropdown === "members" && (
                    <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                      <div className="p-2">
                        <input
                          type="text"
                          placeholder="Search Members"
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                          className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                        />
                        <label className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 hover:bg-slate-50">
                          <input
                            type="radio"
                            name="members"
                            value="all"
                            checked={members === "all"}
                            onChange={(e) => setMembers(e.target.value)}
                            className="h-4 w-4 text-[#2f4bff] focus:ring-[#2f4bff]"
                          />
                          <span className="text-sm text-slate-700">All</span>
                        </label>
                        {bookMembers
                          .filter((member) => member.name.toLowerCase().includes(memberSearch.toLowerCase()))
                          .map((member) => (
                            <label key={member.id} className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 hover:bg-slate-50">
                              <input
                                type="radio"
                                name="members"
                                value={member.id}
                                checked={members === member.id}
                                onChange={(e) => setMembers(e.target.value)}
                                className="h-4 w-4 text-[#2f4bff] focus:ring-[#2f4bff]"
                              />
                              <span className="text-sm text-slate-700">{member.name}</span>
                            </label>
                          ))}
                      </div>
                      <div className="flex justify-end gap-2 border-t border-slate-200 p-2">
                        <button
                          onClick={() => {
                            setMembers("all");
                            setOpenDropdown(null);
                          }}
                          className="px-3 py-1 text-sm text-slate-600 hover:text-slate-800"
                        >
                          Clear
                        </button>
                        <button
                          onClick={() => setOpenDropdown(null)}
                          className="rounded bg-[#2f4bff] px-3 py-1 text-sm text-white hover:bg-[#2f4bff]/90"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Modes Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === "paymentModes" ? null : "paymentModes")}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                  >
                    Payment Modes: {paymentModes.length === 0 ? "All" : `${paymentModes.length} selected`}
                  </button>
                  {openDropdown === "paymentModes" && (
                    <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                      <div className="p-2">
                        <input
                          type="text"
                          placeholder="Search Payment Modes..."
                          value={paymentModeSearch}
                          onChange={(e) => setPaymentModeSearch(e.target.value)}
                          className="mb-2 w-full rounded-lg border border-[#2f4bff] px-3 py-2 text-sm focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                        />
                        {paymentModesList
                          .filter((mode) => mode.name.toLowerCase().includes(paymentModeSearch.toLowerCase()))
                          .map((mode) => (
                            <label key={mode.id} className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 hover:bg-slate-50">
                              <input
                                type="checkbox"
                                checked={paymentModes.includes(mode.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setPaymentModes([...paymentModes, mode.id]);
                                  } else {
                                    setPaymentModes(paymentModes.filter((id) => id !== mode.id));
                                  }
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-[#2f4bff] focus:ring-[#2f4bff]"
                              />
                              <span className="text-sm text-slate-700">{mode.name}</span>
                            </label>
                          ))}
                      </div>
                      <div className="flex justify-end gap-2 border-t border-slate-200 p-2">
                        <button
                          onClick={() => {
                            setPaymentModes([]);
                            setOpenDropdown(null);
                          }}
                          className="px-3 py-1 text-sm text-slate-600 hover:text-slate-800"
                        >
                          Clear
                        </button>
                        <button
                          onClick={() => setOpenDropdown(null)}
                          className="rounded bg-[#2f4bff] px-3 py-1 text-sm text-white hover:bg-[#2f4bff]/90"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Categories Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      if (categoriesList.length === 0) {
                        setOpenDropdown("categories-empty");
                      } else {
                        setOpenDropdown(openDropdown === "categories" ? null : "categories");
                      }
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                  >
                    Categories: All
                  </button>
                  {openDropdown === "categories-empty" && (
                    <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
                      <h3 className="mb-2 font-semibold text-slate-900">No Categories Added!</h3>
                      <p className="mb-4 text-sm text-slate-600">
                        You can create categories for this book from book settings page{" "}
                        <button
                          onClick={() => router.push(`/cashbooks/${bookId}/settings/members`)}
                          className="text-[#2f4bff] hover:underline"
                        >
                          ⚙️
                        </button>
                        .
                      </p>
                      <button
                        onClick={() => setOpenDropdown(null)}
                        className="w-full rounded-lg bg-[#2f4bff] px-4 py-2 text-sm font-medium text-white hover:bg-[#2f4bff]/90"
                      >
                        Ok, Got it
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Search and Action Buttons */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by remark or amount..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 pl-10 pr-4 text-sm text-slate-700 placeholder-slate-400 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                    />
                    <svg
                      className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setEntryType("cash_in");
                      setShowCashEntryModal(true);
                    }}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Cash In
                  </button>
                  <button
                    onClick={() => {
                      setEntryType("cash_out");
                      setShowCashEntryModal(true);
                    }}
                    className="flex items-center gap-2 rounded-lg bg-red-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                    </svg>
                    Cash Out
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="w-full px-2 sm:px-3 lg:px-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Cash In Card */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                    <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600">Cash In</p>
                    <p className="text-2xl font-bold text-green-600">
                      {entries
                        .filter((e) => e.entry_type === "cash_in")
                        .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
                        .toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cash Out Card */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600">Cash Out</p>
                    <p className="text-2xl font-bold text-red-600">
                      {entries
                        .filter((e) => e.entry_type === "cash_out")
                        .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
                        .toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Net Balance Card */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600">Net Balance</p>
                    {(() => {
                      const netBalance = (
                        entries
                          .filter((e) => e.entry_type === "cash_in")
                          .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0) -
                        entries
                          .filter((e) => e.entry_type === "cash_out")
                          .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
                      );
                      return (
                        <p className={`text-2xl font-bold ${
                          netBalance >= 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {netBalance.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full px-2 py-8 sm:px-3 lg:px-4">
            {loadingEntries ? (
              <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-slate-200 bg-white p-12">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#2f4bff]"></div>
                  <p className="text-sm text-slate-600">Loading entries...</p>
                </div>
              </div>
            ) : entries.length === 0 ? (
              <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-slate-200 bg-white p-12">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                    <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-[#1f2937]">No entries added Yet!</h3>
                  <p className="flex items-center justify-center gap-1 text-sm text-slate-600">
                    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Use <span className="font-medium text-emerald-600">Cash In</span> or{" "}
                    <span className="font-medium text-red-600">Cash Out</span> to add entries
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                {/* Pagination */}
                {(() => {
                  const totalEntries = entries.length;
                  const totalPages = Math.ceil(totalEntries / entriesPerPage);
                  const startIndex = (currentPage - 1) * entriesPerPage;
                  const endIndex = Math.min(startIndex + entriesPerPage, totalEntries);
                  const startEntry = totalEntries > 0 ? startIndex + 1 : 0;
                  const endEntry = endIndex;
                  
                  return totalPages > 0 ? (
                    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
                      <div className="flex flex-1 justify-between sm:hidden">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium ${
                            currentPage === 1
                              ? "text-slate-300 cursor-not-allowed"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className={`relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium ${
                            currentPage === totalPages
                              ? "text-slate-300 cursor-not-allowed"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          Next
                        </button>
                      </div>
                      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-slate-600">
                            Showing <span className="font-medium">{startEntry}</span> - <span className="font-medium">{endEntry}</span> of{" "}
                            <span className="font-medium">{totalEntries}</span> entries
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <button
                              data-page-selector-button
                              onClick={() => setShowPageSelector(!showPageSelector)}
                              className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#2f4bff] focus:ring-offset-2"
                            >
                              Page {currentPage}
                              <svg className="ml-2 h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {showPageSelector && (
                              <div className="absolute top-full left-0 mt-2 w-32 rounded-md border border-slate-200 bg-white shadow-lg z-10 max-h-60 overflow-auto">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                  <button
                                    key={page}
                                    onClick={() => {
                                      setCurrentPage(page);
                                      setShowPageSelector(false);
                                    }}
                                    className={`block w-full text-left px-4 py-2 text-sm ${
                                      currentPage === page
                                        ? "bg-[#2f4bff] text-white"
                                        : "text-slate-700 hover:bg-slate-50"
                                    }`}
                                  >
                                    Page {page}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-slate-600">of {totalPages}</span>
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className={`relative inline-flex items-center rounded-md border border-slate-300 bg-white p-2 text-sm font-medium ${
                              currentPage === 1
                                ? "text-slate-300 cursor-not-allowed"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className={`relative inline-flex items-center rounded-md border border-slate-300 bg-white p-2 text-sm font-medium ${
                              currentPage === totalPages
                                ? "text-slate-300 cursor-not-allowed"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <input
                            type="checkbox"
                            checked={(() => {
                              const totalEntries = entries.length;
                              const totalPages = Math.ceil(totalEntries / entriesPerPage);
                              const startIndex = (currentPage - 1) * entriesPerPage;
                              const endIndex = startIndex + entriesPerPage;
                              const paginatedEntries = entries.slice(startIndex, endIndex);
                              return paginatedEntries.length > 0 && paginatedEntries.every((e: any) => selectedEntries.has(e.id));
                            })()}
                            onChange={(e) => {
                              const totalEntries = entries.length;
                              const totalPages = Math.ceil(totalEntries / entriesPerPage);
                              const startIndex = (currentPage - 1) * entriesPerPage;
                              const endIndex = startIndex + entriesPerPage;
                              const paginatedEntries = entries.slice(startIndex, endIndex);
                              
                              if (e.target.checked) {
                                const newSelected = new Set(selectedEntries);
                                paginatedEntries.forEach((entry: any) => newSelected.add(entry.id));
                                setSelectedEntries(newSelected);
                              } else {
                                const newSelected = new Set(selectedEntries);
                                paginatedEntries.forEach((entry: any) => newSelected.delete(entry.id));
                                setSelectedEntries(newSelected);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 rounded border-slate-300 text-[#2f4bff] focus:ring-2 focus:ring-[#2f4bff] focus:ring-offset-2"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date & Time</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Remarks</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Party</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Payment Mode</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Balance</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {(() => {
                        const totalEntries = entries.length;
                        const startIndex = (currentPage - 1) * entriesPerPage;
                        const endIndex = startIndex + entriesPerPage;
                        const paginatedEntries = entries.slice(startIndex, endIndex);

                        return paginatedEntries.map((entry: any) => {
                        const entryDate = new Date(entry.entry_date);
                        const day = entryDate.getDate();
                        const month = entryDate.toLocaleDateString("en-GB", { month: "short" });
                        const year = entryDate.getFullYear();
                        const formattedDate = `${day} ${month}, ${year}`;
                        // Format time as "HH:MM AM/PM"
                        let formattedTime = "";
                        if (entry.entry_time) {
                          const timeStr = entry.entry_time.substring(0, 5); // Get HH:MM
                          const [hours, minutes] = timeStr.split(':');
                          const hour24 = parseInt(hours);
                          const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                          const ampm = hour24 >= 12 ? 'PM' : 'AM';
                          formattedTime = `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
                        }

                        // Determine attribution text shown under remarks
                        let attributionLabel = "by";
                        let attributionValue: string | null = null;

                        if (entry.created_by_first_name || entry.created_by_last_name) {
                          attributionValue = `${entry.created_by_first_name || ""} ${entry.created_by_last_name || ""}`.trim();
                        } else if (entry.created_by_email) {
                          const emailName = entry.created_by_email.split("@")[0] || "";
                          // For phone-based temp emails (phone_918800580884@...), show the cashbook name instead
                          if (emailName.startsWith("phone_") && book?.name) {
                            attributionLabel = "for";
                            attributionValue = book.name;
                          } else {
                            attributionValue = emailName || "Unknown";
                          }
                        } else if (book?.name) {
                          // Fallback: show cashbook name if available
                          attributionLabel = "for";
                          attributionValue = book.name;
                        }

                        return (
                          <tr 
                            key={entry.id} 
                            className="hover:bg-slate-50 cursor-pointer"
                            onClick={() => {
                              // Fetch entry details with attachments
                              fetchEntryWithAttachments(entry.id).then((entryWithAttachments) => {
                                setSelectedEntry(entryWithAttachments || entry);
                              }).catch((err) => {
                                console.error("Error loading entry details:", err);
                                setSelectedEntry(entry);
                              });
                            }}
                          >
                            <td className="whitespace-nowrap px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedEntries.has(entry.id)}
                                onChange={(e) => {
                                  const newSelected = new Set(selectedEntries);
                                  if (e.target.checked) {
                                    newSelected.add(entry.id);
                                  } else {
                                    newSelected.delete(entry.id);
                                  }
                                  setSelectedEntries(newSelected);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="h-4 w-4 rounded border-slate-300 text-[#2f4bff] focus:ring-2 focus:ring-[#2f4bff] focus:ring-offset-2"
                              />
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                              <div className="font-semibold text-slate-900">{formattedDate}</div>
                              {formattedTime && <div className="text-xs text-slate-500">{formattedTime}</div>}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              <div className="max-w-xs truncate" title={entry.remarks || ""}>
                                {entry.remarks || "-"}
                              </div>
                              {attributionValue && (
                                <div className="text-xs text-slate-400">
                                  {attributionLabel} {attributionValue}
                                </div>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                  entry.entry_type === "cash_in"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {entry.entry_type === "cash_in" ? "Cash In" : "Cash Out"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {entry.party_name && entry.party_name.startsWith("phone_") 
                                ? "via phone" 
                                : (entry.party_name || "-")}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">{entry.category_name || "-"}</td>
                            <td className="px-4 py-3 text-sm text-slate-600">{entry.payment_mode || "-"}</td>
                            <td
                              className={`whitespace-nowrap px-4 py-3 text-right text-sm font-semibold ${
                                entry.entry_type === "cash_in" ? "text-emerald-600" : "text-red-600"
                              }`}
                            >
                              {entry.entry_type === "cash_in" ? "+" : "-"}
                              {parseFloat(entry.amount).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className={`whitespace-nowrap px-4 py-3 text-right text-sm font-semibold ${(entry.balance || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {(entry.balance || 0).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                              {userPermissions.includes("cashbooks.delete") && (
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!confirm("Are you sure you want to delete this entry?")) return;
                                    try {
                                      const token = getAuthToken();
                                      if (!token) {
                                        alert("Not authenticated");
                                        return;
                                      }
                                      const response = await fetch(`${API_BASE}/api/books/${bookId}/entries/${entry.id}`, {
                                        method: "DELETE",
                                        headers: {
                                          Authorization: `Bearer ${token}`,
                                        },
                                      });
                                      
                                      if (!response.ok) {
                                        const errorText = await response.text();
                                        let errorData;
                                        try {
                                          errorData = JSON.parse(errorText);
                                        } catch {
                                          errorData = { message: errorText || `HTTP ${response.status}` };
                                        }
                                        throw new Error(errorData.message || "Failed to delete entry");
                                      }
                                      
                                      const result = await response.json();
                                      await fetchEntries();
                                      alert(result.message || "Entry deleted successfully!");
                                    } catch (err) {
                                      console.error("Error deleting entry:", err);
                                      alert(err instanceof Error ? err.message : "Failed to delete entry");
                                    }
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
                                  title="Delete entry"
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Click outside to close dropdowns and pickers */}
        {(openDropdown || showDatePicker || showTimePicker || showHourDropdown || showMinuteDropdown || showAmPmDropdown || showPartyDropdown || showCategoryDropdown || showPaymentModeDropdown) && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setOpenDropdown(null);
              setShowDatePicker(false);
              setShowTimePicker(false);
              setShowHourDropdown(false);
              setShowMinuteDropdown(false);
              setShowAmPmDropdown(false);
              setShowPartyDropdown(false);
              setShowCategoryDropdown(false);
              setShowPaymentModeDropdown(false);
            }}
          />
        )}

        {/* Add Cash Entry Modal */}
        {showCashEntryModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 p-4"
            onClick={handleCloseModal}
          >
              <div 
                className="h-full w-full max-w-lg overflow-y-auto rounded-l-2xl bg-white shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                  <h2 className="text-lg font-semibold text-[#1f2937]">
                    {editingEntry ? "Edit Entry" : `Add ${entryType === "cash_in" ? "Cash In" : "Cash Out"} Entry`}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Entry Type Tabs */}
                <div className="flex border-b border-slate-200 px-6">
                  <button
                    onClick={() => setEntryType("cash_in")}
                    className={`flex-1 border-b-2 px-4 py-3 text-sm font-medium transition ${
                      entryType === "cash_in"
                        ? "border-emerald-600 text-emerald-600"
                        : "border-transparent text-emerald-500 hover:text-emerald-700"
                    }`}
                  >
                    Cash In
                  </button>
                  <button
                    onClick={() => setEntryType("cash_out")}
                    className={`flex-1 border-b-2 px-4 py-3 text-sm font-medium transition ${
                      entryType === "cash_out"
                        ? "border-red-600 text-red-600"
                        : "border-transparent text-red-500 hover:text-red-700"
                    }`}
                  >
                    Cash Out
                  </button>
                </div>

                {/* Modal Content */}
                <div className="px-6 py-6">
                  <div className="space-y-4">
                    {/* Date and Time Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          Date <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={formData.date}
                            readOnly
                            onClick={() => setShowDatePicker(!showDatePicker)}
                            className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm text-slate-700 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                          />
                          <svg
                            className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        {showDatePicker && (
                          <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
                            <div className="mb-4 flex items-center justify-between">
                              <button
                                onClick={() => {
                                  const newDate = new Date(selectedDate);
                                  newDate.setMonth(newDate.getMonth() - 1);
                                  setSelectedDate(newDate);
                                }}
                                className="rounded-lg p-1 hover:bg-slate-100"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                              <h3 className="text-sm font-semibold text-slate-900">
                                {selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                              </h3>
                              <button
                                onClick={() => {
                                  const newDate = new Date(selectedDate);
                                  newDate.setMonth(newDate.getMonth() + 1);
                                  setSelectedDate(newDate);
                                }}
                                className="rounded-lg p-1 hover:bg-slate-100"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
                              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                                <div key={day} className="py-2">
                                  {day}
                                </div>
                              ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                              {(() => {
                                const year = selectedDate.getFullYear();
                                const month = selectedDate.getMonth();
                                const firstDay = new Date(year, month, 1).getDay();
                                const daysInMonth = new Date(year, month + 1, 0).getDate();
                                const days = [];

                                // Empty cells for days before the first day of the month
                                for (let i = 0; i < firstDay; i++) {
                                  days.push(<div key={`empty-${i}`} className="py-2"></div>);
                                }

                                // Days of the month
                                for (let day = 1; day <= daysInMonth; day++) {
                                  const date = new Date(year, month, day);
                                  const isSelected =
                                    date.getDate() === selectedDate.getDate() &&
                                    date.getMonth() === selectedDate.getMonth() &&
                                    date.getFullYear() === selectedDate.getFullYear();
                                  const isToday =
                                    date.getDate() === new Date().getDate() &&
                                    date.getMonth() === new Date().getMonth() &&
                                    date.getFullYear() === new Date().getFullYear();

                                  days.push(
                                    <button
                                      key={day}
                                      onClick={() => {
                                        setSelectedDate(date);
                                        setFormData({
                                          ...formData,
                                          date: date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
                                        });
                                        setShowDatePicker(false);
                                      }}
                                      className={`py-2 text-sm transition ${
                                        isSelected
                                          ? "rounded-full bg-[#2f4bff] text-white"
                                          : isToday
                                          ? "rounded-full bg-slate-100 text-[#2f4bff] font-semibold"
                                          : "text-slate-700 hover:bg-slate-100"
                                      }`}
                                    >
                                      {day}
                                    </button>
                                  );
                                }

                                return days;
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="relative">
                        <label className="mb-1 block text-sm font-medium text-slate-700">Time</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={formData.time}
                            readOnly
                            onClick={() => setShowTimePicker(!showTimePicker)}
                            className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm text-slate-700 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                          />
                          <svg
                            className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        {showTimePicker && (
                          <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
                            <div className="flex gap-3">
                              {/* Hour Dropdown */}
                              <div className="flex-1">
                                <label className="mb-2 block text-sm font-medium text-slate-700">Hour</label>
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowHourDropdown(!showHourDropdown);
                                      setShowMinuteDropdown(false);
                                      setShowAmPmDropdown(false);
                                    }}
                                    className={`w-full rounded-lg border bg-white px-4 py-2.5 pr-10 text-left text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20 ${
                                      showHourDropdown ? "border-[#2f4bff]" : "border-slate-200"
                                    }`}
                                  >
                                    {String(selectedTime.getHours() % 12 || 12)}
                                  </button>
                                  <svg
                                    className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                  </svg>
                                  {showHourDropdown && (
                                    <div className="absolute left-0 top-full z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                                      {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => {
                                        const isSelected = (selectedTime.getHours() % 12 || 12) === hour;
                                        return (
                                          <button
                                            key={hour}
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const newTime = new Date(selectedTime);
                                              newTime.setHours((selectedTime.getHours() >= 12 ? 12 : 0) + hour);
                                              setSelectedTime(newTime);
                                              setFormData({
                                                ...formData,
                                                time: newTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
                                              });
                                              setShowHourDropdown(false);
                                            }}
                                            className={`w-full px-4 py-2 text-left text-sm transition ${
                                              isSelected
                                                ? "bg-slate-100 text-slate-900 font-medium"
                                                : "text-slate-700 hover:bg-slate-50"
                                            }`}
                                          >
                                            {hour}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Minute Dropdown */}
                              <div className="flex-1">
                                <label className="mb-2 block text-sm font-medium text-slate-700">Minute</label>
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowMinuteDropdown(!showMinuteDropdown);
                                      setShowHourDropdown(false);
                                      setShowAmPmDropdown(false);
                                    }}
                                    className={`w-full rounded-lg border bg-white px-4 py-2.5 pr-10 text-left text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20 ${
                                      showMinuteDropdown ? "border-[#2f4bff]" : "border-slate-200"
                                    }`}
                                  >
                                    {String(selectedTime.getMinutes()).padStart(2, "0")}
                                  </button>
                                  <svg
                                    className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                  </svg>
                                  {showMinuteDropdown && (
                                    <div className="absolute left-0 top-full z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                                      {Array.from({ length: 60 }, (_, i) => i).map((minute) => {
                                        const isSelected = selectedTime.getMinutes() === minute;
                                        return (
                                          <button
                                            key={minute}
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const newTime = new Date(selectedTime);
                                              newTime.setMinutes(minute);
                                              setSelectedTime(newTime);
                                              setFormData({
                                                ...formData,
                                                time: newTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
                                              });
                                              setShowMinuteDropdown(false);
                                            }}
                                            className={`w-full px-4 py-2 text-left text-sm transition ${
                                              isSelected
                                                ? "bg-slate-100 text-slate-900 font-medium"
                                                : "text-slate-700 hover:bg-slate-50"
                                            }`}
                                          >
                                            {String(minute).padStart(2, "0")}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* AM/PM Dropdown */}
                              <div className="flex-1">
                                <label className="mb-2 block text-sm font-medium text-slate-700">AM/PM</label>
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowAmPmDropdown(!showAmPmDropdown);
                                      setShowHourDropdown(false);
                                      setShowMinuteDropdown(false);
                                    }}
                                    className={`w-full rounded-lg border bg-white px-4 py-2.5 pr-10 text-left text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20 ${
                                      showAmPmDropdown ? "border-[#2f4bff]" : "border-slate-200"
                                    }`}
                                  >
                                    {selectedTime.getHours() >= 12 ? "PM" : "AM"}
                                  </button>
                                  <svg
                                    className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                  </svg>
                                  {showAmPmDropdown && (
                                    <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                                      {["AM", "PM"].map((period) => {
                                        const isSelected = (selectedTime.getHours() >= 12) === (period === "PM");
                                        return (
                                          <button
                                            key={period}
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const newTime = new Date(selectedTime);
                                              const currentHour = newTime.getHours();
                                              if (period === "PM" && currentHour < 12) {
                                                newTime.setHours(currentHour + 12);
                                              } else if (period === "AM" && currentHour >= 12) {
                                                newTime.setHours(currentHour - 12);
                                              }
                                              setSelectedTime(newTime);
                                              setFormData({
                                                ...formData,
                                                time: newTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
                                              });
                                              setShowAmPmDropdown(false);
                                            }}
                                            className={`w-full px-4 py-2 text-left text-sm transition ${
                                              isSelected
                                                ? "bg-slate-100 text-slate-900 font-medium"
                                                : "text-slate-700 hover:bg-slate-50"
                                            }`}
                                          >
                                            {period}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setShowTimePicker(false);
                                setShowHourDropdown(false);
                                setShowMinuteDropdown(false);
                                setShowAmPmDropdown(false);
                              }}
                              className="mt-4 w-full rounded-lg bg-[#2f4bff] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2f4bff]/90 transition"
                            >
                              Done
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="mb-1 flex items-center gap-1 text-sm font-medium text-slate-700">
                        Amount <span className="text-red-500">*</span>
                        <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </label>
                      <input
                        type="text"
                        placeholder="eg. 890 or 100 + 200*3"
                        value={formData.amount}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({ ...formData, amount: value });
                          calculateAmount(value);
                        }}
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                      />
                      {calculatedAmount !== null && (
                        <div className="mt-2 text-lg font-semibold text-slate-900">
                          {calculatedAmount.toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Party Name */}
                    <div>
                      <label className="mb-1 flex items-center gap-1 text-sm font-medium text-slate-700">
                        Party Name (Contact)
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/cashbooks/${bookId}/settings/members`);
                          }}
                          className="text-slate-400 hover:text-[#2f4bff]"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search or Select"
                          value={partySearch}
                          onChange={(e) => {
                            setPartySearch(e.target.value);
                            setShowPartyDropdown(true);
                          }}
                          onFocus={() => setShowPartyDropdown(true)}
                          className={`w-full rounded-lg border bg-white px-4 py-2.5 pr-10 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20 ${
                            showPartyDropdown ? "border-[#2f4bff]" : "border-slate-200"
                          }`}
                        />
                        <svg
                          className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                        {showPartyDropdown && (
                          <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                            <div className="max-h-64 overflow-y-auto p-2">
                              {loadingParties ? (
                                <div className="flex items-center justify-center py-4">
                                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-[#2f4bff]"></div>
                                </div>
                              ) : partiesList.length === 0 ? (
                                <div className="py-4 text-center text-sm text-slate-500">No parties found</div>
                              ) : (
                                partiesList
                                  .filter((party) =>
                                    party.name.toLowerCase().includes(partySearch.toLowerCase())
                                  )
                                  .map((party) => (
                                  <label
                                    key={party.id}
                                    className="flex cursor-pointer items-center gap-2 rounded px-3 py-2 hover:bg-slate-50"
                                  >
                                    <input
                                      type="radio"
                                      name="party"
                                      value={party.id}
                                      checked={selectedParty === party.id}
                                      onChange={() => {
                                        setSelectedParty(party.id);
                                        setFormData({ ...formData, partyName: party.name });
                                        setShowPartyDropdown(false);
                                        setPartySearch(party.name);
                                      }}
                                      className="h-4 w-4 text-[#2f4bff] focus:ring-[#2f4bff]"
                                    />
                                    <span className="text-sm text-slate-700">{party.name}</span>
                                  </label>
                                  ))
                              )}
                            </div>
                            <div className="border-t border-slate-200 p-2 space-y-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowPartyDropdown(false);
                                  setShowAddPartyModal(true);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg bg-[#2f4bff] px-4 py-2 text-sm font-medium text-white hover:bg-[#2f4bff]/90 transition"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Add New Party
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // TODO: Open CSV import modal
                                  setShowPartyDropdown(false);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                Import Bulk parties from CSV
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Remarks */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Remarks</label>
                      <textarea
                        placeholder="e.g. Enter Details (Name, Bill No, Item Name, Quantity etc)"
                        value={formData.remarks}
                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                        rows={3}
                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="mb-1 flex items-center gap-1 text-sm font-medium text-slate-700">
                        Category
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/cashbooks/${bookId}/settings/members`);
                          }}
                          className="text-slate-400 hover:text-[#2f4bff]"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search or Select"
                          value={categorySearch}
                          onChange={(e) => {
                            setCategorySearch(e.target.value);
                            setShowCategoryDropdown(true);
                          }}
                          onFocus={() => setShowCategoryDropdown(true)}
                          className={`w-full rounded-lg border bg-white px-4 py-2.5 pr-10 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20 ${
                            showCategoryDropdown ? "border-[#2f4bff]" : "border-slate-200"
                          }`}
                        />
                        <svg
                          className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                        {showCategoryDropdown && (
                          <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                            <div className="max-h-64 overflow-y-auto p-2">
                              {loadingCategories ? (
                                <div className="flex items-center justify-center py-4">
                                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-[#2f4bff]"></div>
                                </div>
                              ) : (
                                <>
                                  {/* In This Book Section */}
                                  {categoriesList.length > 0 && (
                                    <>
                                      <div className="mb-2 px-2 text-xs font-semibold uppercase text-slate-500">In This Book</div>
                                      {categoriesList
                                        .filter((category) =>
                                          category.name.toLowerCase().includes(categorySearch.toLowerCase())
                                        )
                                        .map((category) => {
                                          const isSelected = selectedCategory === category.id;
                                          return (
                                            <label
                                              key={category.id}
                                              className={`flex cursor-pointer items-center gap-2 rounded px-3 py-2 ${
                                                isSelected ? "bg-purple-50" : "hover:bg-slate-50"
                                              }`}
                                            >
                                              <input
                                                type="radio"
                                                name="category"
                                                value={category.id}
                                                checked={isSelected}
                                                onChange={() => {
                                                  setSelectedCategory(category.id);
                                                  setFormData({ ...formData, category: category.name });
                                                  setShowCategoryDropdown(false);
                                                  setCategorySearch(category.name);
                                                }}
                                                className="h-4 w-4 text-purple-600 focus:ring-purple-600"
                                              />
                                              <span className={`text-sm ${isSelected ? "font-medium text-purple-700" : "text-slate-700"}`}>
                                                {category.name}
                                              </span>
                                            </label>
                                          );
                                        })}
                                    </>
                                  )}

                                  {/* Suggestions Section */}
                                  {suggestionsList.length > 0 && (
                                    <>
                                      <div className={`mb-2 px-2 text-xs font-semibold uppercase text-slate-500 ${categoriesList.length > 0 ? "mt-3" : ""}`}>
                                        Suggestions
                                      </div>
                                      {suggestionsList
                                        .filter((category) =>
                                          category.name.toLowerCase().includes(categorySearch.toLowerCase())
                                        )
                                        .map((category) => {
                                          const isSelected = selectedCategory === category.id;
                                          return (
                                            <label
                                              key={category.id}
                                              className={`flex cursor-pointer items-center gap-2 rounded px-3 py-2 ${
                                                isSelected ? "bg-purple-50" : "hover:bg-slate-50"
                                              }`}
                                            >
                                              <input
                                                type="radio"
                                                name="category"
                                                value={category.id}
                                                checked={isSelected}
                                                onChange={() => {
                                                  setSelectedCategory(category.id);
                                                  setFormData({ ...formData, category: category.name });
                                                  setShowCategoryDropdown(false);
                                                  setCategorySearch(category.name);
                                                }}
                                                className="h-4 w-4 text-purple-600 focus:ring-purple-600"
                                              />
                                              <span className={`text-sm ${isSelected ? "font-medium text-purple-700" : "text-slate-700"}`}>
                                                {category.name}
                                              </span>
                                            </label>
                                          );
                                        })}
                                    </>
                                  )}

                                  {categoriesList.length === 0 && suggestionsList.length === 0 && (
                                    <div className="py-4 text-center text-sm text-slate-500">No categories found</div>
                                  )}
                                </>
                              )}
                            </div>
                            <div className="border-t border-slate-200 p-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowCategoryDropdown(false);
                                  setShowAddCategoryModal(true);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                              >
                                <svg className="h-4 w-4 text-[#2f4bff]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Add New Category
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payment Mode */}
                    <div>
                      <label className="mb-1 flex items-center gap-1 text-sm font-medium text-slate-700">
                        Payment Mode
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/cashbooks/${bookId}/settings/members`);
                          }}
                          className="text-slate-400 hover:text-[#2f4bff]"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search or Select"
                          value={formData.paymentMode || ""}
                          onChange={(e) => {
                            setPaymentModeSearch(e.target.value);
                            setShowPaymentModeDropdown(true);
                          }}
                          onFocus={() => setShowPaymentModeDropdown(true)}
                          className={`w-full rounded-lg border bg-white px-4 py-2.5 pr-20 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20 ${
                            showPaymentModeDropdown ? "border-[#2f4bff]" : "border-slate-200"
                          }`}
                        />
                        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
                          {formData.paymentMode && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFormData({ ...formData, paymentMode: "" });
                                setPaymentModeSearch("");
                              }}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                          <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        {showPaymentModeDropdown && (
                          <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                            <div className="max-h-64 overflow-y-auto p-2">
                              <div className="mb-2 px-2 text-xs font-semibold uppercase text-slate-500">In This Book</div>
                              {/* Mock payment modes for this book - replace with actual API call */}
                              {[
                                { id: "1", name: "Cash" },
                                { id: "2", name: "Online" },
                              ]
                                .filter((mode) =>
                                  mode.name.toLowerCase().includes(paymentModeSearch.toLowerCase())
                                )
                                .map((mode) => {
                                  const isSelected = formData.paymentMode === mode.name;
                                  return (
                                    <label
                                      key={mode.id}
                                      className={`flex cursor-pointer items-center gap-2 rounded px-3 py-2 ${
                                        isSelected ? "bg-purple-50" : "hover:bg-slate-50"
                                      }`}
                                    >
                                      <input
                                        type="radio"
                                        name="paymentMode"
                                        value={mode.name}
                                        checked={isSelected}
                                        onChange={() => {
                                          setFormData({ ...formData, paymentMode: mode.name });
                                          setShowPaymentModeDropdown(false);
                                          setPaymentModeSearch(mode.name);
                                        }}
                                        className="h-4 w-4 text-purple-600 focus:ring-purple-600"
                                      />
                                      <span className={`text-sm ${isSelected ? "font-medium text-purple-700" : "text-slate-700"}`}>
                                        {mode.name}
                                      </span>
                                    </label>
                                  );
                                })}
                              <div className="mb-2 mt-3 px-2 text-xs font-semibold uppercase text-slate-500">Suggestions</div>
                              {/* Mock suggested payment modes - replace with actual API call */}
                              {[
                                { id: "3", name: "PhonePe" },
                                { id: "4", name: "Paytm" },
                              ]
                                .filter((mode) =>
                                  mode.name.toLowerCase().includes(paymentModeSearch.toLowerCase())
                                )
                                .map((mode) => {
                                  const isSelected = formData.paymentMode === mode.name;
                                  return (
                                    <label
                                      key={mode.id}
                                      className={`flex cursor-pointer items-center gap-2 rounded px-3 py-2 ${
                                        isSelected ? "bg-purple-50" : "hover:bg-slate-50"
                                      }`}
                                    >
                                      <input
                                        type="radio"
                                        name="paymentMode"
                                        value={mode.name}
                                        checked={isSelected}
                                        onChange={() => {
                                          setFormData({ ...formData, paymentMode: mode.name });
                                          setShowPaymentModeDropdown(false);
                                          setPaymentModeSearch(mode.name);
                                        }}
                                        className="h-4 w-4 text-purple-600 focus:ring-purple-600"
                                      />
                                      <span className={`text-sm ${isSelected ? "font-medium text-purple-700" : "text-slate-700"}`}>
                                        {mode.name}
                                      </span>
                                    </label>
                                  );
                                })}
                            </div>
                            <div className="border-t border-slate-200 p-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowPaymentModeDropdown(false);
                                  setShowAddPaymentModeModal(true);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                              >
                                <svg className="h-4 w-4 text-[#2f4bff]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Add New Payment Mode
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Attach Bills */}
                    <div>
                      <input
                        type="file"
                        id="file-upload"
                        accept="image/*,.pdf"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length + attachedFiles.length > 4) {
                            alert("You can only attach up to 4 files");
                            return;
                          }

                          files.forEach((file) => {
                            // Validate file type
                            const isValidImage = file.type.startsWith('image/');
                            const isValidPdf = file.type === 'application/pdf';
                            if (!isValidImage && !isValidPdf) {
                              alert(`${file.name} is not a valid image or PDF file`);
                              return;
                            }

                            // Validate file size (max 10MB)
                            if (file.size > 10 * 1024 * 1024) {
                              alert(`${file.name} is too large. Maximum size is 10MB`);
                              return;
                            }

                            const reader = new FileReader();
                            reader.onload = (e) => {
                              const preview = e.target?.result as string;
                              setAttachedFiles((prev) => [
                                ...prev,
                                {
                                  id: `${Date.now()}-${Math.random()}`,
                                  file,
                                  preview,
                                  uploaded: false,
                                },
                              ]);
                            };
                            reader.readAsDataURL(file);
                          });

                          // Reset input
                          e.target.value = '';
                        }}
                      />
                      <label
                        htmlFor="file-upload"
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#2f4bff] hover:bg-slate-100"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        Attach Bills
                      </label>
                      <p className="mt-2 text-xs text-slate-500">
                        Attach up to 4 images or PDF files ({attachedFiles.length}/4)
                      </p>

                      {/* Display attached files */}
                      {attachedFiles.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {attachedFiles.map((attachment) => (
                            <div
                              key={attachment.id}
                              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3"
                            >
                              {attachment.file.type.startsWith('image/') ? (
                                <img
                                  src={attachment.preview}
                                  alt={attachment.file.name}
                                  className="h-12 w-12 rounded object-cover"
                                />
                              ) : (
                                <div className="flex h-12 w-12 items-center justify-center rounded bg-red-50">
                                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="truncate text-sm font-medium text-slate-700">{attachment.file.name}</p>
                                <p className="text-xs text-slate-500">
                                  {(attachment.file.size / 1024).toFixed(1)} KB
                                  {attachment.uploaded && <span className="ml-2 text-emerald-600">✓ Uploaded</span>}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setAttachedFiles((prev) => prev.filter((f) => f.id !== attachment.id));
                                }}
                                className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Additional Fields */}
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <span className="text-sm font-medium text-slate-700">Add more fields</span>
                      <button className="rounded-lg bg-[#2f4bff] px-4 py-2 text-sm font-medium text-white hover:bg-[#2f4bff]/90">
                        Configure
                      </button>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="sticky bottom-0 flex gap-3 border-t border-slate-200 bg-white px-6 py-4">
                  <button
                    type="button"
                    onClick={async () => {
                      // Upload files first
                      if (attachedFiles.length > 0) {
                        setUploadingFiles(true);
                        try {
                          const token = getAuthToken();
                          if (!token) {
                            throw new Error("Not authenticated");
                          }

                          // Upload each file that hasn't been uploaded yet
                          for (const attachment of attachedFiles) {
                            if (!attachment.uploaded) {
                              const uploadUrl = `${API_BASE}/api/books/${bookId}/attachments`;
                              console.log("Uploading file to:", uploadUrl);
                              console.log("File size:", attachment.file.size, "bytes");
                              console.log("Preview length:", attachment.preview.length);

                              try {
                                const response = await fetch(uploadUrl, {
                                  method: "POST",
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    file: attachment.preview, // Base64 data URL
                                  }),
                                });

                                console.log("Upload response status:", response.status, response.statusText);

                                if (!response.ok) {
                                  const errorText = await response.text();
                                  console.error("Upload error response:", errorText);
                                  let errorData;
                                  try {
                                    errorData = JSON.parse(errorText);
                                  } catch {
                                    errorData = { message: errorText || `HTTP ${response.status}: ${response.statusText}` };
                                  }
                                  throw new Error(errorData.message || `Failed to upload file: ${response.status} ${response.statusText}`);
                                }

                                const data = await response.json();
                                console.log("Upload successful:", data);
                                // Mark as uploaded
                                setAttachedFiles((prev) =>
                                  prev.map((f) =>
                                    f.id === attachment.id
                                      ? { ...f, uploaded: true, attachmentId: data.attachment.id }
                                      : f
                                  )
                                );
                              } catch (fetchError) {
                                console.error("Fetch error:", fetchError);
                                // Re-throw with more context
                                if (fetchError instanceof TypeError && fetchError.message === "Failed to fetch") {
                                  throw new Error(`Network error: Cannot reach server at ${uploadUrl}. Please check:\n1. Backend server is running on port 5000\n2. CORS is configured correctly\n3. API_BASE is set correctly (current: ${API_BASE})`);
                                }
                                throw fetchError;
                              }
                            }
                          }
                        } catch (err) {
                          console.error("Error uploading files:", err);
                          const errorMessage = err instanceof Error ? err.message : "Failed to upload files";
                          console.error("Upload error details:", {
                            error: err,
                            bookId,
                            fileCount: attachedFiles.length,
                            API_BASE,
                          });
                          alert(`Error: ${errorMessage}\n\nPlease check:\n1. Backend server is running\n2. Database migration is run\n3. File size is under 10MB`);
                          setUploadingFiles(false);
                          return;
                        }
                        setUploadingFiles(false);
                      }

                      // Save the entry with all form data and attachment IDs
                      const attachmentIds = attachedFiles
                        .filter((f) => f.uploaded && f.attachmentId)
                        .map((f) => f.attachmentId!);

                      // Parse date and time
                      const dateStr = selectedDate.toISOString().split('T')[0];
                      const hours = selectedTime.getHours().toString().padStart(2, '0');
                      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
                      const timeStr = `${hours}:${minutes}`;

                      // Get party and category IDs
                      const partyId = selectedParty || null;
                      const categoryId = selectedCategory || null;

                      // Get amount (use calculated amount if available, otherwise use form amount)
                      const finalAmount = calculatedAmount !== null ? calculatedAmount : parseFloat(formData.amount) || 0;

                      if (finalAmount <= 0) {
                        alert("Please enter a valid amount");
                        setUploadingFiles(false);
                        return;
                      }

                      try {
                        const saveResponse = await fetch(`${API_BASE}/api/books/${bookId}/entries`, {
                          method: "POST",
                          headers: {
                            Authorization: `Bearer ${getAuthToken()}`,
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            entryType: entryType,
                            amount: finalAmount,
                            partyId: partyId,
                            partyName: formData.partyName || null,
                            categoryId: categoryId,
                            categoryName: formData.category || null,
                            paymentMode: formData.paymentMode || null,
                            remarks: formData.remarks || null,
                            entryDate: dateStr,
                            entryTime: timeStr,
                            attachmentIds: attachmentIds,
                          }),
                        });

                        if (!saveResponse.ok) {
                          const errorText = await saveResponse.text();
                          let errorData;
                          try {
                            errorData = JSON.parse(errorText);
                          } catch {
                            errorData = { message: errorText || `HTTP ${saveResponse.status}` };
                          }
                          throw new Error(errorData.message || "Failed to save entry");
                        }

                        alert("Entry saved successfully!");
                        // Refresh entries list
                        await fetchEntries();
                        // Reset form
                        setFormData({
                          date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
                          time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
                          amount: "",
                          partyName: "",
                          remarks: "",
                          category: "",
                          paymentMode: "Cash",
                        });
                        setAttachedFiles([]);
                        setSelectedDate(new Date());
                        setSelectedTime(new Date());
                        setSelectedParty(null);
                        setSelectedCategory(null);
                        setCalculatedAmount(null);
                        setPartySearch("");
                        setCategorySearch("");
                        // Keep modal open for "Save & Add New"
                      } catch (saveError) {
                        console.error("Error saving entry:", saveError);
                        alert(saveError instanceof Error ? saveError.message : "Failed to save entry");
                        setUploadingFiles(false);
                        return;
                      }
                    }}
                    disabled={uploadingFiles}
                    className="flex-1 rounded-lg bg-[#2f4bff] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#2f4bff]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingFiles ? "Uploading..." : "Save & Add New"}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      // Upload files first
                      if (attachedFiles.length > 0) {
                        setUploadingFiles(true);
                        try {
                          const token = getAuthToken();
                          if (!token) {
                            throw new Error("Not authenticated");
                          }

                          // Upload each file that hasn't been uploaded yet
                          for (const attachment of attachedFiles) {
                            if (!attachment.uploaded) {
                              const uploadUrl = `${API_BASE}/api/books/${bookId}/attachments`;
                              console.log("Uploading file to:", uploadUrl);
                              console.log("File size:", attachment.file.size, "bytes");
                              console.log("Preview length:", attachment.preview.length);

                              try {
                                const response = await fetch(uploadUrl, {
                                  method: "POST",
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    file: attachment.preview, // Base64 data URL
                                  }),
                                });

                                console.log("Upload response status:", response.status, response.statusText);

                                if (!response.ok) {
                                  const errorText = await response.text();
                                  console.error("Upload error response:", errorText);
                                  let errorData;
                                  try {
                                    errorData = JSON.parse(errorText);
                                  } catch {
                                    errorData = { message: errorText || `HTTP ${response.status}: ${response.statusText}` };
                                  }
                                  throw new Error(errorData.message || `Failed to upload file: ${response.status} ${response.statusText}`);
                                }

                                const data = await response.json();
                                console.log("Upload successful:", data);
                                // Mark as uploaded
                                setAttachedFiles((prev) =>
                                  prev.map((f) =>
                                    f.id === attachment.id
                                      ? { ...f, uploaded: true, attachmentId: data.attachment.id }
                                      : f
                                  )
                                );
                              } catch (fetchError) {
                                console.error("Fetch error:", fetchError);
                                // Re-throw with more context
                                if (fetchError instanceof TypeError && fetchError.message === "Failed to fetch") {
                                  throw new Error(`Network error: Cannot reach server at ${uploadUrl}. Please check:\n1. Backend server is running on port 5000\n2. CORS is configured correctly\n3. API_BASE is set correctly (current: ${API_BASE})`);
                                }
                                throw fetchError;
                              }
                            }
                          }
                        } catch (err) {
                          console.error("Error uploading files:", err);
                          const errorMessage = err instanceof Error ? err.message : "Failed to upload files";
                          console.error("Upload error details:", {
                            error: err,
                            bookId,
                            fileCount: attachedFiles.length,
                            API_BASE,
                          });
                          alert(`Error: ${errorMessage}\n\nPlease check:\n1. Backend server is running\n2. Database migration is run\n3. File size is under 10MB`);
                          setUploadingFiles(false);
                          return;
                        }
                        setUploadingFiles(false);
                      }

                      // Save the entry with all form data and attachment IDs
                      const attachmentIds = attachedFiles
                        .filter((f) => f.uploaded && f.attachmentId)
                        .map((f) => f.attachmentId!);

                      console.log("Saving entry with attachmentIds:", attachmentIds);
                      console.log("Attached files:", attachedFiles);

                      // Parse date and time
                      const dateStr = selectedDate.toISOString().split('T')[0];
                      const hours = selectedTime.getHours().toString().padStart(2, '0');
                      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
                      const timeStr = `${hours}:${minutes}`;

                      // Get party and category IDs
                      const partyId = selectedParty || null;
                      const categoryId = selectedCategory || null;

                      // Get amount (use calculated amount if available, otherwise use form amount)
                      const finalAmount = calculatedAmount !== null ? calculatedAmount : parseFloat(formData.amount) || 0;

                      if (finalAmount <= 0) {
                        alert("Please enter a valid amount");
                        setUploadingFiles(false);
                        return;
                      }

                      try {
                        const url = editingEntry 
                          ? `${API_BASE}/api/books/${bookId}/entries/${editingEntry.id}`
                          : `${API_BASE}/api/books/${bookId}/entries`;
                        const method = editingEntry ? "PUT" : "POST";
                        
                        const requestBody = {
                          entryType: entryType,
                          amount: finalAmount,
                          partyId: partyId,
                          partyName: formData.partyName || null,
                          categoryId: categoryId,
                          categoryName: formData.category || null,
                          paymentMode: formData.paymentMode || null,
                          remarks: formData.remarks || null,
                          entryDate: dateStr,
                          entryTime: timeStr,
                          attachmentIds: attachmentIds.length > 0 ? attachmentIds : [],
                        };
                        
                        console.log("Sending request to:", url);
                        console.log("Request body:", requestBody);
                        
                        const saveResponse = await fetch(url, {
                          method: method,
                          headers: {
                            Authorization: `Bearer ${getAuthToken()}`,
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify(requestBody),
                        });

                        if (!saveResponse.ok) {
                          const errorText = await saveResponse.text();
                          let errorData;
                          try {
                            errorData = JSON.parse(errorText);
                          } catch {
                            errorData = { message: errorText || `HTTP ${saveResponse.status}` };
                          }
                          throw new Error(errorData.message || `Failed to ${editingEntry ? "update" : "save"} entry`);
                        }

                        alert(`Entry ${editingEntry ? "updated" : "saved"} successfully!`);
                        // Refresh entries list
                        await fetchEntries();
                        // Reset form and close modal
                        setFormData({
                          date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
                          time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
                          amount: "",
                          partyName: "",
                          remarks: "",
                          category: "",
                          paymentMode: "Cash",
                        });
                        setAttachedFiles([]);
                        setSelectedDate(new Date());
                        setSelectedTime(new Date());
                        setSelectedParty(null);
                        setSelectedCategory(null);
                        setCalculatedAmount(null);
                        setPartySearch("");
                        setCategorySearch("");
                        setEditingEntry(null);
                        setShowCashEntryModal(false);
                      } catch (saveError) {
                        console.error("Error saving entry:", saveError);
                        alert(saveError instanceof Error ? saveError.message : `Failed to ${editingEntry ? "update" : "save"} entry`);
                        setUploadingFiles(false);
                        return;
                      }
                    }}
                    disabled={uploadingFiles}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingFiles ? "Uploading..." : editingEntry ? "Update" : "Save"}
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* Add New Party Modal */}
        {showAddPartyModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                  <h2 className="text-lg font-semibold text-[#1f2937]">Add New Party</h2>
                  <button
                    onClick={() => {
                      setShowAddPartyModal(false);
                      setNewPartyName("");
                      setNewPartyMobile("");
                      setNewPartyType("Customer");
                    }}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="px-6 py-6">
                  {/* Import CSV Banner */}
                  <button
                    type="button"
                    onClick={() => {
                      // TODO: Open CSV import modal
                    }}
                    className="mb-6 flex w-full items-center justify-between rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition"
                  >
                    <span>Import all parties in bulk via CSV</span>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Party Name */}
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Party Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh, Vivek, Saif, John"
                      value={newPartyName}
                      onChange={(e) => setNewPartyName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                      autoFocus
                    />
                  </div>

                  {/* Mobile Number */}
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Mobile Number(Optional)</label>
                    <div className="flex gap-2">
                      <div className="relative w-24">
                        <select className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-8 text-sm text-slate-700 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20">
                          <option value="+91">🇮🇳 +91</option>
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+44">🇬🇧 +44</option>
                        </select>
                        <svg
                          className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      <input
                        type="tel"
                        placeholder="e.g. 8772321230"
                        value={newPartyMobile}
                        onChange={(e) => setNewPartyMobile(e.target.value)}
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                      />
                    </div>
                  </div>

                  {/* Party Type */}
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Party Type</label>
                    <div className="flex gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
                      <button
                        type="button"
                        onClick={() => setNewPartyType("Customer")}
                        className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
                          newPartyType === "Customer"
                            ? "bg-[#2f4bff] text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Customer
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewPartyType("Supplier")}
                        className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
                          newPartyType === "Supplier"
                            ? "bg-[#2f4bff] text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Supplier
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                  <button
                    onClick={() => {
                      setShowAddPartyModal(false);
                      setNewPartyName("");
                      setNewPartyMobile("");
                      setNewPartyType("Customer");
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!newPartyName.trim()) return;
                      setSavingParty(true);
                      try {
                        const token = getAuthToken();
                        if (!token) {
                          throw new Error("Not authenticated");
                        }

                        const response = await fetch(`${API_BASE}/api/books/${bookId}/parties`, {
                          method: "POST",
                          headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            name: newPartyName.trim(),
                            mobile: newPartyMobile.trim() || undefined,
                            partyType: newPartyType,
                          }),
                        });

                        if (!response.ok) {
                          const errorData = await response.json().catch(() => ({}));
                          throw new Error(errorData.message || "Failed to create party");
                        }

                        const data = await response.json();
                        setFormData({ ...formData, partyName: data.party.name });
                        setPartySearch(data.party.name);
                        await fetchParties(); // Refresh parties list
                        setShowAddPartyModal(false);
                        setNewPartyName("");
                        setNewPartyMobile("");
                        setNewPartyType("Customer");
                      } catch (err) {
                        console.error("Error creating party:", err);
                        alert(err instanceof Error ? err.message : "Failed to create party");
                      } finally {
                        setSavingParty(false);
                      }
                    }}
                    disabled={!newPartyName.trim() || savingParty}
                    className="rounded-lg bg-[#2f4bff] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2f4bff]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingParty ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* Add New Category Modal */}
        {showAddCategoryModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                  <h2 className="text-lg font-semibold text-[#1f2937]">Add New Category</h2>
                  <button
                    onClick={() => {
                      setShowAddCategoryModal(false);
                      setNewCategoryName("");
                    }}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="px-6 py-6">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Category Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Salary, EMI, Food, Travel"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                  <button
                    onClick={() => {
                      setShowAddCategoryModal(false);
                      setNewCategoryName("");
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!newCategoryName.trim()) return;
                      setSavingCategory(true);
                      try {
                        const token = getAuthToken();
                        if (!token) {
                          throw new Error("Not authenticated");
                        }

                        const response = await fetch(`${API_BASE}/api/books/${bookId}/categories`, {
                          method: "POST",
                          headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            name: newCategoryName.trim(),
                          }),
                        });

                        if (!response.ok) {
                          const errorData = await response.json().catch(() => ({}));
                          throw new Error(errorData.message || "Failed to create category");
                        }

                        const data = await response.json();
                        setFormData({ ...formData, category: data.category.name });
                        setCategorySearch(data.category.name);
                        await fetchCategories(); // Refresh categories list
                        setShowAddCategoryModal(false);
                        setNewCategoryName("");
                      } catch (err) {
                        console.error("Error creating category:", err);
                        alert(err instanceof Error ? err.message : "Failed to create category");
                      } finally {
                        setSavingCategory(false);
                      }
                    }}
                    disabled={!newCategoryName.trim() || savingCategory}
                    className="rounded-lg bg-[#2f4bff] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2f4bff]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingCategory ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
          </div>
        )}

        {/* Add New Payment Mode Modal */}
        {showAddPaymentModeModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-[#1f2937]">Add New Payment Mode</h2>
                <button
                  onClick={() => {
                    setShowAddPaymentModeModal(false);
                    setNewPaymentModeName("");
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="px-6 py-6">
                <label className="mb-2 block text-sm font-medium text-slate-700">Payment Mode Name</label>
                <input
                  type="text"
                  placeholder="e.g. Net Banking, Credit Card"
                  value={newPaymentModeName}
                  onChange={(e) => setNewPaymentModeName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  onClick={() => {
                    setShowAddPaymentModeModal(false);
                    setNewPaymentModeName("");
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!newPaymentModeName.trim()) return;
                    setSavingPaymentMode(true);
                    // TODO: Save payment mode via API
                    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call
                    setFormData({ ...formData, paymentMode: newPaymentModeName });
                    setPaymentModeSearch(newPaymentModeName);
                    setSavingPaymentMode(false);
                    setShowAddPaymentModeModal(false);
                    setNewPaymentModeName("");
                  }}
                  disabled={!newPaymentModeName.trim() || savingPaymentMode}
                  className="rounded-lg bg-[#2f4bff] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2f4bff]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingPaymentMode ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
          )}

        {/* Entry Details Sidebar */}
        {selectedEntry && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/30"
              onClick={() => setSelectedEntry(null)}
            />
            {/* Sidebar */}
            <div className="relative w-full max-w-lg bg-white shadow-2xl overflow-y-auto h-full">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-lg font-semibold text-[#1f2937]">Entry Details</h2>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Entry Type and Amount */}
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    {selectedEntry.entry_type === "cash_in" ? (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                        <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                        <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-[#1f2937]">
                        {selectedEntry.entry_type === "cash_in" ? "Cash In" : "Cash Out"}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span>
                          On {new Date(selectedEntry.entry_date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                          {selectedEntry.entry_time && `, ${selectedEntry.entry_time.substring(0, 5)}`}
                        </span>
                        {selectedEntry.entry_type === "cash_in" ? (
                          <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className={`text-3xl font-bold mt-4 ${
                    selectedEntry.entry_type === "cash_in" ? "text-emerald-600" : "text-red-600"
                  }`}>
                    {selectedEntry.entry_type === "cash_in" ? "+" : "-"}
                    {parseFloat(selectedEntry.amount).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>

                {/* Party Name */}
                {selectedEntry.party_name && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Party Name</label>
                    <p className="text-base text-[#1f2937]">
                      {selectedEntry.party_name}
                      {selectedEntry.party_type && (
                        <span className="ml-2 text-sm text-slate-500">({selectedEntry.party_type.toLowerCase()})</span>
                      )}
                    </p>
                  </div>
                )}

                {/* Remark */}
                {selectedEntry.remarks && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Remark</label>
                    <p className="text-base text-[#1f2937]">{selectedEntry.remarks}</p>
                  </div>
                )}

                {/* Attachment */}
                {selectedEntry.attachments && selectedEntry.attachments.length > 0 ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Attachment</label>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedEntry.attachments.map((attachment: any, index: number) => {
                        // Handle different possible attachment data structures
                        const fileName = attachment.file_name || attachment.name || attachment.filename || `Attachment ${index + 1}`;
                        const filePath = attachment.file_path || attachment.path || attachment.url;
                        const fileType = attachment.mime_type || attachment.file_type || attachment.type || '';
                        const attachmentId = attachment.id;
                        
                        // Construct URL - handle both absolute URLs and relative paths
                        let attachmentUrl = attachment.url;
                        if (!attachmentUrl && filePath) {
                          // If path starts with /, it's already a full path
                          if (filePath.startsWith('/')) {
                            // Remove any existing /backend/ prefix to avoid duplication
                            let cleanPath = filePath;
                            if (cleanPath.startsWith('/backend/')) {
                              cleanPath = cleanPath.replace(/^\/backend/, '');
                            }
                            attachmentUrl = `${API_BASE}${cleanPath}`;
                          } else if (filePath.startsWith('http')) {
                            attachmentUrl = filePath;
                          } else {
                            attachmentUrl = `${API_BASE}/${filePath}`;
                          }
                        } else if (attachmentUrl && attachmentUrl.startsWith('/')) {
                          // Remove any existing /backend/ prefix to avoid duplication
                          let cleanUrl = attachmentUrl;
                          if (cleanUrl.startsWith('/backend/')) {
                            cleanUrl = cleanUrl.replace(/^\/backend/, '');
                          }
                          // If URL is relative (starts with /), prepend API_BASE
                          attachmentUrl = `${API_BASE}${cleanUrl}`;
                        } else if (attachmentUrl && !attachmentUrl.startsWith('http')) {
                          // Handle case where URL might already have /backend/ prefix
                          if (attachmentUrl.startsWith('/backend/')) {
                            attachmentUrl = attachmentUrl; // Already correct
                          }
                        }
                        
                        // Determine if it's an image
                        const isImage = fileType.startsWith('image/') || 
                                       fileName.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i) ||
                                       (attachmentUrl && attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i));
                        
                        return (
                          <div key={attachmentId || index} className="relative group">
                            {isImage && attachmentUrl ? (
                              <img
                                src={attachmentUrl}
                                alt={fileName}
                                className="w-full h-32 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 transition"
                                onClick={() => setPreviewAttachment({...attachment, url: attachmentUrl, file_name: fileName})}
                                onError={(e) => {
                                  // If image fails to load, show file icon instead
                                  e.currentTarget.style.display = 'none';
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    const fallback = parent.querySelector('.image-fallback');
                                    if (fallback) fallback.classList.remove('hidden');
                                  }
                                }}
                              />
                            ) : null}
                            {(!isImage || !attachmentUrl) && (
                              <div 
                                className={`w-full h-32 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition ${isImage && attachmentUrl ? 'hidden image-fallback' : ''}`}
                                onClick={() => setPreviewAttachment({...attachment, url: attachmentUrl, file_name: fileName})}
                              >
                                <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                            )}
                            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
                              {fileName}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  // Show placeholder if no attachments but entry might have them
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Attachment</label>
                    <div className="text-sm text-slate-500 italic">No attachments</div>
                  </div>
                )}

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedEntry.category_name && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {selectedEntry.category_name}
                      </span>
                    )}
                    {selectedEntry.payment_mode && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {selectedEntry.payment_mode}
                      </span>
                    )}
                  </div>
                </div>

                {/* Activities */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">Activities</label>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 mt-0.5">
                        <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#1f2937]">Created by {selectedEntry.created_by_first_name || selectedEntry.created_by_last_name
                          ? `${selectedEntry.created_by_first_name || ""} ${selectedEntry.created_by_last_name || ""}`.trim()
                          : selectedEntry.created_by_email?.split("@")[0] || "You"}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          On {new Date(selectedEntry.created_at || selectedEntry.entry_date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                          {selectedEntry.entry_time && `, ${selectedEntry.entry_time.substring(0, 5)}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex gap-3">
                {userPermissions.includes("cashbooks.delete") && (
                  <button
                    onClick={async () => {
                      if (!confirm("Are you sure you want to delete this entry?")) return;
                      try {
                        const token = getAuthToken();
                        if (!token) {
                          alert("Not authenticated");
                          return;
                        }
                        const response = await fetch(`${API_BASE}/api/books/${bookId}/entries/${selectedEntry.id}`, {
                          method: "DELETE",
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                        });
                        
                        if (!response.ok) {
                          const errorText = await response.text();
                          let errorData;
                          try {
                            errorData = JSON.parse(errorText);
                          } catch {
                            errorData = { message: errorText || `HTTP ${response.status}` };
                          }
                          throw new Error(errorData.message || "Failed to delete entry");
                        }
                        
                        const result = await response.json();
                        setSelectedEntry(null);
                        await fetchEntries();
                        alert(result.message || "Entry deleted successfully!");
                      } catch (err) {
                        console.error("Error deleting entry:", err);
                        alert(err instanceof Error ? err.message : "Failed to delete entry");
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 transition"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                )}
                {(userPermissions.includes("cashbooks.update") || userPermissions.includes("cashbooks.delete")) && (
                  <button
                    onClick={() => {
                      setShowMoreActionsModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                    More Actions
                  </button>
                )}
                {userPermissions.includes("cashbooks.update") && (
                  <button
                    onClick={() => {
                      setEditingEntry(selectedEntry);
                      setEntryType(selectedEntry.entry_type);
                      // Pre-fill form with entry data
                      const entryDate = new Date(selectedEntry.entry_date);
                      const entryTime = selectedEntry.entry_time ? selectedEntry.entry_time.split(':') : ['00', '00'];
                      setSelectedDate(entryDate);
                      setSelectedTime(new Date(entryDate.setHours(parseInt(entryTime[0]), parseInt(entryTime[1]))));
                      setFormData({
                        date: entryDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
                        time: selectedEntry.entry_time ? `${entryTime[0]}:${entryTime[1]}` : new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
                        amount: selectedEntry.amount || "",
                        partyName: selectedEntry.party_name || "",
                        remarks: selectedEntry.remarks || "",
                        category: selectedEntry.category_name || "",
                        paymentMode: selectedEntry.payment_mode || "Cash",
                      });
                      setPartySearch(selectedEntry.party_name || "");
                      setCategorySearch(selectedEntry.category_name || "");
                      setPaymentModeSearch(selectedEntry.payment_mode || "Cash");
                      setSelectedParty(selectedEntry.party_id || null);
                      setSelectedCategory(selectedEntry.category_id || null);
                      // Load attachments if any
                      if (selectedEntry.attachments && selectedEntry.attachments.length > 0) {
                        // TODO: Load existing attachments
                      }
                      setShowCashEntryModal(true);
                      setSelectedEntry(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#2f4bff] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2f4bff]/90 transition"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* More Actions Modal */}
        {showMoreActionsModal && selectedEntry && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-[#1f2937]">More Actions</h2>
                <button
                  onClick={() => {
                    setShowMoreActionsModal(false);
                    setSelectedTargetBook(null);
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-6 space-y-4">
                {/* Book Selector */}
                {booksList.length > 0 ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Target Book</label>
                    <select
                      value={selectedTargetBook || ""}
                      onChange={(e) => setSelectedTargetBook(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                    >
                      <option value="">Select target book...</option>
                      {booksList.map((book) => (
                        <option key={book.id} value={book.id}>
                          {book.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 text-center py-4">
                    No other books available
                  </div>
                )}

                {/* Transfer Entry - Disabled */}
                <button
                  disabled
                  className="w-full flex items-start gap-4 p-4 rounded-lg border border-slate-200 bg-slate-50 text-left opacity-50 cursor-not-allowed"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-700">Transfer Entry</h3>
                    <p className="text-xs text-slate-500 mt-1">Coming soon</p>
                  </div>
                </button>

                {/* Move Entry */}
                <button
                  onClick={() => {
                    if (!selectedTargetBook) {
                      alert("Please select a target book");
                      return;
                    }
                    handleMoveEntry(selectedEntry.id, selectedTargetBook);
                  }}
                  disabled={!selectedTargetBook || booksList.length === 0}
                  className="w-full flex items-start gap-4 p-4 rounded-lg border border-slate-200 bg-white text-left hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-700">Move Entry</h3>
                    <p className="text-xs text-slate-500 mt-1">Entry will be moved to the other selected book</p>
                  </div>
                </button>

                {/* Copy Entry */}
                <button
                  onClick={() => {
                    if (!selectedTargetBook) {
                      alert("Please select a target book");
                      return;
                    }
                    handleCopyEntry(selectedEntry.id, selectedTargetBook, false);
                  }}
                  disabled={!selectedTargetBook || booksList.length === 0}
                  className="w-full flex items-start gap-4 p-4 rounded-lg border border-slate-200 bg-white text-left hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-700">Copy Entry</h3>
                    <p className="text-xs text-slate-500 mt-1">Entry will stay in both books</p>
                  </div>
                </button>

                {/* Copy Opposite Entry */}
                <button
                  onClick={() => {
                    if (!selectedTargetBook) {
                      alert("Please select a target book");
                      return;
                    }
                    handleCopyEntry(selectedEntry.id, selectedTargetBook, true);
                  }}
                  disabled={!selectedTargetBook || booksList.length === 0}
                  className="w-full flex items-start gap-4 p-4 rounded-lg border border-slate-200 bg-white text-left hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-700">Copy Opposite Entry</h3>
                    <p className="text-xs text-slate-500 mt-1">Cash In entry will be added as Cash Out entry in other book and vice versa</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Export Transactions Modal */}
        {showExportModal && (
          <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-white">
                <h2 className="text-lg font-semibold text-[#1f2937]">Export Transactions</h2>
                <button
                  onClick={() => {
                    setShowExportModal(false);
                    setReportData(null);
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="border-b border-slate-200 px-6 bg-white">
                <div className="flex gap-1 -mb-px">
                  {[
                    { id: "all", label: "All Entries" },
                    { id: "day", label: "Day-wise" },
                    { id: "party", label: "Party-wise" },
                    { id: "category", label: "Category-wise" },
                    { id: "payment_mode", label: "Payment Mode-wise" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setExportFilterType(tab.id as any)}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                        exportFilterType === tab.id
                          ? "border-[#2f4bff] text-[#2f4bff]"
                          : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview Section */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                <div className="bg-white rounded-lg shadow-sm p-6 min-h-full">
                  {generatingReport ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2f4bff] mb-4"></div>
                        <p className="text-sm text-slate-600">Generating report preview...</p>
                      </div>
                    </div>
                  ) : reportData ? (
                    <div className="space-y-6">
                      {/* Report Header */}
                      <div className="text-center border-b border-slate-200 pb-4">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-[#2f4bff] flex items-center justify-center">
                            <span className="text-white font-bold text-lg">C</span>
                          </div>
                          <h1 className="text-2xl font-bold text-[#1f2937]">HissabBook Report</h1>
                        </div>
                        <p className="text-sm text-slate-600 mt-2">
                          Generated On - {new Date().toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}. Generated by - {reportData.generatedBy || "User"}
                        </p>
                      </div>

                      {/* Book Title */}
                      <div className="text-center">
                        <h2 className="text-xl font-semibold text-[#1f2937]">
                          {book?.name || "Cashbook"}
                          {exportFilterType !== "all" && (
                            <span className="text-base font-normal text-slate-600">
                              {" "}({exportFilterType === "day" ? "Day-wise" : exportFilterType === "party" ? "Party-wise" : exportFilterType === "category" ? "Category-wise" : "Payment Mode-wise"} Summary)
                            </span>
                          )}
                        </h2>
                      </div>

                      {/* Summary */}
                      <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
                        <div>
                          <p className="text-sm text-slate-600">Total Cash In</p>
                          <p className="text-lg font-semibold text-green-600">{reportData.summary?.totalCashIn || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Total Cash Out</p>
                          <p className="text-lg font-semibold text-red-600">{reportData.summary?.totalCashOut || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">{exportFilterType !== "all" ? "Net Balance" : "Final Balance"}</p>
                          <p className={`text-lg font-semibold ${
                            parseFloat(reportData.summary?.finalBalance || 0) >= 0 ? "text-green-600" : "text-red-600"
                          }`}>{reportData.summary?.finalBalance || 0}</p>
                        </div>
                      </div>

                      {/* Entry Count */}
                      <div className="text-sm text-slate-600">
                        Total No. of entries: {reportData.totalEntries || 0}
                      </div>

                      {/* Transactions Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-200">
                              {exportFilterType === "day" && (
                                <>
                                  <th className="text-left py-2 px-3 font-semibold text-slate-700">Date</th>
                                  <th className="text-right py-2 px-3 font-semibold text-slate-700">Cash In</th>
                                  <th className="text-right py-2 px-3 font-semibold text-slate-700">Cash Out</th>
                                  <th className="text-right py-2 px-3 font-semibold text-slate-700">Balance</th>
                                </>
                              )}
                              {exportFilterType === "party" && (
                                <>
                                  <th className="text-left py-2 px-3 font-semibold text-slate-700">Party</th>
                                  <th className="text-right py-2 px-3 font-semibold text-slate-700">Cash In</th>
                                  <th className="text-right py-2 px-3 font-semibold text-slate-700">Cash Out</th>
                                  <th className="text-right py-2 px-3 font-semibold text-slate-700">Balance</th>
                                </>
                              )}
                              {exportFilterType === "category" && (
                                <>
                                  <th className="text-left py-2 px-3 font-semibold text-slate-700">Category</th>
                                  <th className="text-right py-2 px-3 font-semibold text-slate-700">Cash In</th>
                                  <th className="text-right py-2 px-3 font-semibold text-slate-700">Cash Out</th>
                                  <th className="text-right py-2 px-3 font-semibold text-slate-700">Balance</th>
                                </>
                              )}
                              {exportFilterType === "payment_mode" && (
                                <>
                                  <th className="text-left py-2 px-3 font-semibold text-slate-700">Mode</th>
                                  <th className="text-right py-2 px-3 font-semibold text-slate-700">Cash In</th>
                                  <th className="text-right py-2 px-3 font-semibold text-slate-700">Cash Out</th>
                                  <th className="text-right py-2 px-3 font-semibold text-slate-700">Balance</th>
                                </>
                              )}
                              {exportFilterType === "all" && (
                                <>
                                  <th className="text-left py-2 px-3 font-semibold text-slate-700">Date</th>
                                  <th className="text-left py-2 px-3 font-semibold text-slate-700">Remark</th>
                                  <th className="text-left py-2 px-3 font-semibold text-slate-700">Party</th>
                                  <th className="text-left py-2 px-3 font-semibold text-slate-700">Category</th>
                                  <th className="text-left py-2 px-3 font-semibold text-slate-700">Mode</th>
                                  <th className="text-right py-2 px-3 font-semibold text-slate-700">Cash In</th>
                                  <th className="text-right py-2 px-3 font-semibold text-slate-700">Cash Out</th>
                                  <th className="text-left py-2 px-3 font-semibold text-slate-700">Entry By</th>
                                  <th className="text-right py-2 px-3 font-semibold text-slate-700">Balance</th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.entries && reportData.entries.length > 0 ? (
                              reportData.entries.map((entry: any, index: number) => {
                                if (entry.isSummary) {
                                  // Summary row
                                  return (
                                    <tr key={index} className="border-b border-slate-100">
                                      {exportFilterType === "day" && (
                                        <>
                                          <td className="py-2 px-3 text-slate-700">
                                            <div>
                                              {new Date(entry.entry_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                              {entry.entry_time && (() => {
                                                const timeStr = entry.entry_time.substring(0, 5); // Get HH:MM
                                                const [hours, minutes] = timeStr.split(':');
                                                const hour24 = parseInt(hours);
                                                const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                                                const ampm = hour24 >= 12 ? 'PM' : 'AM';
                                                const formattedTime = `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
                                                return <div className="text-xs text-slate-500">{formattedTime}</div>;
                                              })()}
                                            </div>
                                          </td>
                                          <td className="py-2 px-3 text-right text-green-600">{entry.cash_in || 0}</td>
                                          <td className="py-2 px-3 text-right text-red-600">{entry.cash_out || 0}</td>
                                          <td className={`py-2 px-3 text-right ${(entry.balance || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>{entry.balance || 0}</td>
                                        </>
                                      )}
                                      {exportFilterType === "party" && (
                                        <>
                                          <td className="py-2 px-3 text-slate-700">
                                            {entry.party_name && entry.party_name.startsWith("phone_") 
                                              ? "via phone" 
                                              : (entry.party_name || "-")}
                                          </td>
                                          <td className="py-2 px-3 text-right text-green-600">{entry.cash_in || 0}</td>
                                          <td className="py-2 px-3 text-right text-red-600">{entry.cash_out || 0}</td>
                                          <td className={`py-2 px-3 text-right ${(entry.balance || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>{entry.balance || 0}</td>
                                        </>
                                      )}
                                      {exportFilterType === "category" && (
                                        <>
                                          <td className="py-2 px-3 text-slate-700">{entry.category_name || "-"}</td>
                                          <td className="py-2 px-3 text-right text-green-600">{entry.cash_in || 0}</td>
                                          <td className="py-2 px-3 text-right text-red-600">{entry.cash_out || 0}</td>
                                          <td className={`py-2 px-3 text-right ${(entry.balance || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>{entry.balance || 0}</td>
                                        </>
                                      )}
                                      {exportFilterType === "payment_mode" && (
                                        <>
                                          <td className="py-2 px-3 text-slate-700">{entry.payment_mode || "-"}</td>
                                          <td className="py-2 px-3 text-right text-green-600">{entry.cash_in || 0}</td>
                                          <td className="py-2 px-3 text-right text-red-600">{entry.cash_out || 0}</td>
                                          <td className={`py-2 px-3 text-right ${(entry.balance || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>{entry.balance || 0}</td>
                                        </>
                                      )}
                                    </tr>
                                  );
                                } else {
                                  // Regular entry row
                                  return (
                                    <tr key={entry.id || index} className="border-b border-slate-100">
                                      <td className="py-2 px-3 text-slate-700">
                                        <div>
                                          {new Date(entry.entry_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                          {entry.entry_time && (() => {
                                            const timeStr = entry.entry_time.substring(0, 5); // Get HH:MM
                                            const [hours, minutes] = timeStr.split(':');
                                            const hour24 = parseInt(hours);
                                            const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                                            const ampm = hour24 >= 12 ? 'PM' : 'AM';
                                            const formattedTime = `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
                                            return <div className="text-xs text-slate-500">{formattedTime}</div>;
                                          })()}
                                        </div>
                                      </td>
                                      <td className="py-2 px-3 text-slate-700">
                                        <div className="flex items-center gap-1">
                                          {(() => {
                                            const remarks = entry.remarks || "-";
                                            if (remarks === "-" || remarks.length <= 10) {
                                              return remarks;
                                            }
                                            return remarks.substring(0, 10) + "...";
                                          })()}
                                          {entry.hasAttachment && (
                                            <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-2 px-3 text-slate-700">
                                        {entry.party_name && entry.party_name.startsWith("phone_") 
                                          ? "via phone" 
                                          : (entry.party_name || "-")}
                                      </td>
                                      <td className="py-2 px-3 text-slate-700">{entry.category_name || "-"}</td>
                                      <td className="py-2 px-3 text-slate-700">{entry.payment_mode || "-"}</td>
                                      <td className="py-2 px-3 text-right text-green-600">
                                        {entry.entry_type === "cash_in" ? entry.amount : ""}
                                      </td>
                                      <td className="py-2 px-3 text-right text-red-600">
                                        {entry.entry_type === "cash_out" ? entry.amount : ""}
                                      </td>
                                      <td className="py-2 px-3 text-slate-700">{entry.created_by_name || "-"}</td>
                                      <td className={`py-2 px-3 text-right ${(entry.balance || 0) < 0 ? 'text-red-600' : 'text-green-600'}`}>{entry.balance || 0}</td>
                                    </tr>
                                  );
                                }
                              })
                            ) : (
                              <tr>
                                <td colSpan={exportFilterType === "all" ? 9 : 4} className="py-8 text-center text-slate-500">
                                  No entries found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      Select a filter type to generate report preview
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 bg-white">
                <button
                  onClick={() => setShowPdfSettings(true)}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  PDF Settings
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowExportModal(false);
                      setReportData(null);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => downloadReport("pdf")}
                    disabled={generatingReport || !reportData}
                    className="flex items-center gap-2 rounded-lg bg-[#2f4bff] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2f4bff]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download as PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PDF Settings Modal */}
        {showPdfSettings && (
          <div className="fixed inset-0 z-[66] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-white">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowPdfSettings(false)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h2 className="text-lg font-semibold text-[#1f2937]">PDF Settings</h2>
                </div>
                <button
                  onClick={() => setShowPdfSettings(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-sm text-slate-600 mb-6">
                  Select columns you wish to include in '{exportFilterType === "all" ? "All Entries" : exportFilterType === "day" ? "Day-wise" : exportFilterType === "party" ? "Party-wise" : exportFilterType === "category" ? "Category-wise" : "Payment Mode-wise"}'.
                </p>

                {/* Column Selection */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  {/* Left Column */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pdfSettings.columns.date}
                        disabled
                        className="w-4 h-4 text-[#2f4bff] border-slate-300 rounded focus:ring-[#2f4bff]"
                      />
                      <span className="text-sm font-medium text-slate-700">Date</span>
                      <span className="text-xs text-slate-500">Compulsory</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pdfSettings.columns.balance}
                        onChange={(e) =>
                          setPdfSettings({
                            ...pdfSettings,
                            columns: { ...pdfSettings.columns, balance: e.target.checked },
                          })
                        }
                        className="w-4 h-4 text-[#2f4bff] border-slate-300 rounded focus:ring-[#2f4bff]"
                      />
                      <span className="text-sm font-medium text-slate-700">Balance</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pdfSettings.columns.paymentModes}
                        onChange={(e) =>
                          setPdfSettings({
                            ...pdfSettings,
                            columns: { ...pdfSettings.columns, paymentModes: e.target.checked },
                          })
                        }
                        className="w-4 h-4 text-[#2f4bff] border-slate-300 rounded focus:ring-[#2f4bff]"
                      />
                      <span className="text-sm font-medium text-slate-700">Payment Modes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pdfSettings.columns.time}
                        onChange={(e) =>
                          setPdfSettings({
                            ...pdfSettings,
                            columns: { ...pdfSettings.columns, time: e.target.checked },
                          })
                        }
                        className="w-4 h-4 text-[#2f4bff] border-slate-300 rounded focus:ring-[#2f4bff]"
                      />
                      <span className="text-sm font-medium text-slate-700">Time</span>
                    </label>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pdfSettings.columns.cashIn}
                        disabled
                        className="w-4 h-4 text-[#2f4bff] border-slate-300 rounded focus:ring-[#2f4bff]"
                      />
                      <span className="text-sm font-medium text-slate-700">Cash In</span>
                      <span className="text-xs text-slate-500">Compulsory</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pdfSettings.columns.cashOut}
                        disabled
                        className="w-4 h-4 text-[#2f4bff] border-slate-300 rounded focus:ring-[#2f4bff]"
                      />
                      <span className="text-sm font-medium text-slate-700">Cash Out</span>
                      <span className="text-xs text-slate-500">Compulsory</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pdfSettings.columns.category}
                        onChange={(e) =>
                          setPdfSettings({
                            ...pdfSettings,
                            columns: { ...pdfSettings.columns, category: e.target.checked },
                          })
                        }
                        className="w-4 h-4 text-[#2f4bff] border-slate-300 rounded focus:ring-[#2f4bff]"
                      />
                      <span className="text-sm font-medium text-slate-700">Category</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pdfSettings.columns.remark}
                        onChange={(e) =>
                          setPdfSettings({
                            ...pdfSettings,
                            columns: { ...pdfSettings.columns, remark: e.target.checked },
                          })
                        }
                        className="w-4 h-4 text-[#2f4bff] border-slate-300 rounded focus:ring-[#2f4bff]"
                      />
                      <span className="text-sm font-medium text-slate-700">Remark</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pdfSettings.columns.members}
                        onChange={(e) =>
                          setPdfSettings({
                            ...pdfSettings,
                            columns: { ...pdfSettings.columns, members: e.target.checked },
                          })
                        }
                        className="w-4 h-4 text-[#2f4bff] border-slate-300 rounded focus:ring-[#2f4bff]"
                      />
                      <span className="text-sm font-medium text-slate-700">Members</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pdfSettings.columns.party}
                        onChange={(e) =>
                          setPdfSettings({
                            ...pdfSettings,
                            columns: { ...pdfSettings.columns, party: e.target.checked },
                          })
                        }
                        className="w-4 h-4 text-[#2f4bff] border-slate-300 rounded focus:ring-[#2f4bff]"
                      />
                      <span className="text-sm font-medium text-slate-700">Party</span>
                    </label>
                  </div>
                </div>

                {/* Other Options */}
                <div className="border-t border-slate-200 pt-6 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pdfSettings.includeUserNameAndNumber}
                      onChange={(e) =>
                        setPdfSettings({
                          ...pdfSettings,
                          includeUserNameAndNumber: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-[#2f4bff] border-slate-300 rounded focus:ring-[#2f4bff]"
                    />
                    <span className="text-sm font-medium text-slate-700">User Name & Number</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pdfSettings.includeAppliedFilters}
                      onChange={(e) =>
                        setPdfSettings({
                          ...pdfSettings,
                          includeAppliedFilters: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-[#2f4bff] border-slate-300 rounded focus:ring-[#2f4bff]"
                    />
                    <span className="text-sm font-medium text-slate-700">Applied Filters</span>
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 bg-white">
                <button
                  onClick={() => setShowPdfSettings(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Save PDF settings (can be stored in localStorage or sent to backend)
                    localStorage.setItem('pdfSettings', JSON.stringify(pdfSettings));
                    setShowPdfSettings(false);
                    alert('PDF settings saved successfully!');
                  }}
                  className="rounded-lg bg-[#2f4bff] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2f4bff]/90 transition"
                >
                  Save PDF Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Attachment Preview Modal */}
        {previewAttachment && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-white">
                <h2 className="text-lg font-semibold text-[#1f2937]">Attachment Preview</h2>
                <button
                  onClick={() => setPreviewAttachment(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Filename */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-slate-700">
                    {previewAttachment.file_name || previewAttachment.name || 'Attachment'}
                  </p>
                </div>

                {/* Image/File Preview */}
                <div className="flex items-center justify-center bg-slate-50 rounded-lg min-h-[400px] max-h-[70vh] overflow-auto">
                  {(() => {
                    // Construct full URL - handle relative paths
                    let attachmentUrl = previewAttachment.url || previewAttachment.path || previewAttachment.file_path;
                    if (attachmentUrl) {
                      // If URL already starts with http/https, use it as-is
                      if (attachmentUrl.startsWith('http://') || attachmentUrl.startsWith('https://')) {
                        // Already a full URL, use as-is
                      } else if (attachmentUrl.startsWith('/')) {
                        // Normalize API_BASE (remove trailing slash)
                        const apiBaseNormalized = API_BASE.replace(/\/$/, '');
                        
                        // Remove any existing /backend/ prefix to avoid duplication
                        let cleanUrl = attachmentUrl;
                        if (cleanUrl.startsWith('/backend/')) {
                          cleanUrl = cleanUrl.replace(/^\/backend/, '');
                        }
                        
                        // Check if URL already contains the API_BASE path to avoid duplication
                        if (cleanUrl.startsWith(apiBaseNormalized)) {
                          // URL already includes API_BASE, use as-is
                          attachmentUrl = cleanUrl;
                        } else {
                          // Prepend API_BASE
                          attachmentUrl = `${apiBaseNormalized}${cleanUrl}`;
                        }
                      } else if (!attachmentUrl.startsWith('http')) {
                        // Relative path without leading slash
                        attachmentUrl = `${API_BASE}/${attachmentUrl}`;
                      }
                    }
                    const isImage = previewAttachment.file_type?.startsWith('image/') || 
                                   previewAttachment.mime_type?.startsWith('image/') ||
                                   previewAttachment.file_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
                                   (attachmentUrl && attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i));
                    
                    if (isImage) {
                      return (
                        <img
                          src={attachmentUrl}
                          alt={previewAttachment.file_name || 'Attachment preview'}
                          className="max-w-full max-h-[70vh] object-contain"
                        />
                      );
                    } else {
                      return (
                        <div className="flex flex-col items-center justify-center p-12">
                          <svg className="h-16 w-16 text-slate-400 mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-sm text-slate-600 mb-2">
                            {previewAttachment.file_name || 'File Preview'}
                          </p>
                          <p className="text-xs text-slate-500">
                            Click Download to view this file
                          </p>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 bg-white">
                <button
                  onClick={() => setPreviewAttachment(null)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Construct full URL - handle relative paths
                    let attachmentUrl = previewAttachment.url || previewAttachment.path || previewAttachment.file_path;
                    if (attachmentUrl) {
                      if (attachmentUrl.startsWith('/')) {
                        attachmentUrl = `${API_BASE}${attachmentUrl}`;
                      } else if (!attachmentUrl.startsWith('http')) {
                        attachmentUrl = `${API_BASE}/${attachmentUrl}`;
                      }
                    }
                    const fileName = previewAttachment.file_name || previewAttachment.name || 'attachment';
                    
                    // Create a temporary anchor element to trigger download
                    const link = document.createElement('a');
                    link.href = attachmentUrl;
                    link.download = fileName;
                    link.target = '_blank';
                    
                    // Add authorization header if needed (for protected files)
                    // For now, we'll use a simple approach
                    fetch(attachmentUrl, {
                      headers: {
                        Authorization: `Bearer ${getAuthToken()}`,
                      },
                    })
                      .then(response => response.blob())
                      .then(blob => {
                        const url = window.URL.createObjectURL(blob);
                        link.href = url;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(url);
                      })
                      .catch(() => {
                        // Fallback: open in new tab if download fails
                        window.open(attachmentUrl, '_blank');
                      });
                  }}
                  className="rounded-lg bg-[#2f4bff] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2f4bff]/90 transition"
                >
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}

