"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../components/AppShell";
import ProtectedRoute from "../components/ProtectedRoute";
import { getAuthToken, isStaff, getUserRole } from "../utils/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "/backend");

interface BusinessData {
  id: string;
  name: string;
  description: string | null;
  businessAddress: string;
  staffSize: string;
  businessCategory: string;
  businessSubcategory: string;
  businessType: string;
  businessRegistrationType: string;
  gstNumber: string;
  businessMobile: string;
  businessEmail: string;
  masterWalletUpi: string | null;
}

const BUSINESS_CATEGORIES = [
  "Agriculture",
  "Retail",
  "Manufacturing",
  "Services",
  "Technology",
  "Healthcare",
  "Education",
  "Food & Beverage",
  "Real Estate",
  "Other",
];

const BUSINESS_TYPES = ["Retailer", "Wholesaler", "Manufacturer", "Service Provider", "Other"];

const REGISTRATION_TYPES = ["Sole Proprietorship", "Partnership", "LLP", "Private Limited", "Public Limited", "Other"];

export default function SettingsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<"business-profile" | "settings">("business-profile");
  const [activeTab, setActiveTab] = useState<"basics" | "business-info" | "gst-info" | "communication">("basics");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [businessData, setBusinessData] = useState<BusinessData>({
    id: "",
    name: "",
    description: "",
    businessAddress: "",
    staffSize: "",
    businessCategory: "",
    businessSubcategory: "",
    businessType: "",
    businessRegistrationType: "",
    gstNumber: "",
    businessMobile: "",
    businessEmail: "",
    masterWalletUpi: null,
  });

  // Check if user has access to settings page
  useEffect(() => {
    const role = getUserRole();
    if (isStaff() || role === "staff") {
      // Staff users should not access settings page
      router.push("/dashboard");
      return;
    }
    setCheckingAccess(false);
    fetchBusinessData();
  }, [router]);

  const fetchBusinessData = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        setError("Not authenticated");
        return;
      }

      // Get selected business ID from localStorage
      const selectedBusinessId = localStorage.getItem("selectedBusinessId");

      if (!selectedBusinessId) {
        // Fetch all businesses and use the first one
        const response = await fetch(`${API_BASE}/api/businesses`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.businesses && data.businesses.length > 0) {
            const business = data.businesses[0];
            loadBusinessData(business);
          }
        }
      } else {
        // Fetch specific business
        const response = await fetch(`${API_BASE}/api/businesses`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          const business = data.businesses?.find((b: any) => b.id === selectedBusinessId) || data.businesses?.[0];
          if (business) {
            loadBusinessData(business);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching business data:", err);
      setError("Failed to load business data");
    } finally {
      setLoading(false);
    }
  };

  const loadBusinessData = (business: any) => {
    setBusinessData({
      id: business.id,
      name: business.name || "",
      description: business.description || "",
      businessAddress: business.businessAddress || "",
      staffSize: business.staffSize || "",
      businessCategory: business.businessCategory || "",
      businessSubcategory: business.businessSubcategory || "",
      businessType: business.businessType || "",
      businessRegistrationType: business.businessRegistrationType || "",
      gstNumber: business.gstNumber || "",
      businessMobile: business.businessMobile || "",
      businessEmail: business.businessEmail || business.ownerEmail || "",
      masterWalletUpi: business.masterWalletUpi || null,
    });
  };

  const calculateProfileStrength = () => {
    const fields = [
      businessData.name,
      businessData.businessAddress,
      businessData.staffSize,
      businessData.businessCategory,
      businessData.businessSubcategory,
      businessData.businessType,
      businessData.businessRegistrationType,
      businessData.gstNumber,
      businessData.businessMobile,
      businessData.businessEmail,
      businessData.masterWalletUpi,
    ];

    const filledFields = fields.filter((field) => field && field.trim() !== "").length;
    const totalFields = fields.length;
    const percentage = Math.round((filledFields / totalFields) * 100);

    return { filledFields, totalFields, percentage };
  };

  const handleFieldChange = (field: keyof BusinessData, value: string) => {
    setBusinessData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const token = getAuthToken();
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const response = await fetch(`${API_BASE}/api/businesses/${businessData.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: businessData.name,
          description: businessData.description,
          masterWalletUpi: businessData.masterWalletUpi,
          businessAddress: businessData.businessAddress,
          staffSize: businessData.staffSize,
          businessCategory: businessData.businessCategory,
          businessSubcategory: businessData.businessSubcategory,
          businessType: businessData.businessType,
          businessRegistrationType: businessData.businessRegistrationType,
          gstNumber: businessData.gstNumber,
          businessMobile: businessData.businessMobile,
          businessEmail: businessData.businessEmail,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update business");
      }

      setSuccess("Business profile updated successfully!");
      setEditingField(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error saving business data:", err);
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleLeaveBusiness = async () => {
    if (!confirm("Are you sure you want to leave this business? You will lose access to all business data.")) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const token = getAuthToken();
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const selectedBusinessId = localStorage.getItem("selectedBusinessId");
      if (!selectedBusinessId) {
        setError("No business selected");
        return;
      }

      // TODO: Implement leave business API call
      // For now, just show a message
      setError("Leave business functionality is not yet implemented");
      
      // After implementation, you would:
      // 1. Call API to remove user from business
      // 2. Clear selectedBusinessId from localStorage
      // 3. Redirect to businesses list or dashboard
    } catch (err) {
      console.error("Error leaving business:", err);
      setError(err instanceof Error ? err.message : "Failed to leave business");
    } finally {
      setSaving(false);
    }
  };

  const profileStrength = calculateProfileStrength();
  const strengthLabel =
    profileStrength.percentage >= 80 ? "Strong" : profileStrength.percentage >= 50 ? "Medium" : "Weak";
  const strengthColor =
    profileStrength.percentage >= 80
      ? "from-emerald-400 to-emerald-500"
      : profileStrength.percentage >= 50
      ? "from-amber-400 to-amber-500"
      : "from-rose-400 to-rose-500";

  if (checkingAccess || loading) {
    return (
      <ProtectedRoute>
        <AppShell activePath="/settings">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-[#2f4bff]"></div>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell activePath="/settings">
        <div className="flex gap-6">
          {/* Left Sidebar */}
          <div className="w-64 flex-shrink-0 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-[#1f2937] mb-2">Business Profile</h2>
              <button
                onClick={() => setActiveSection("business-profile")}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                  activeSection === "business-profile"
                    ? "bg-blue-50 text-[#2f4bff] shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-[#1f2937] hover:shadow-sm"
                }`}
              >
                <p className="text-sm font-medium">Edit business details</p>
              </button>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#1f2937] mb-2">Settings</h2>
              <button
                onClick={() => setActiveSection("settings")}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                  activeSection === "settings"
                    ? "bg-blue-50 text-[#2f4bff] shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-[#1f2937] hover:shadow-sm"
                }`}
              >
                <p className="text-sm font-medium">Leave Business</p>
              </button>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 space-y-6">
            {/* Success/Error Messages */}
            {success && (
              <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600">{success}</div>
            )}
            {error && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{error}</div>}

            {/* Business Profile Section */}
            {activeSection === "business-profile" && (
              <div className="rounded-3xl border border-white/70 bg-white p-8 shadow-md">
            {/* Business Header */}
            <div className="mb-6 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-[#2f4bff] to-[#4f6dff] text-2xl font-bold text-white">
                  {businessData.name.charAt(0).toUpperCase() || "B"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    {editingField === "name" ? (
                      <input
                        type="text"
                        value={businessData.name}
                        onChange={(e) => handleFieldChange("name", e.target.value)}
                        onBlur={() => {
                          setEditingField(null);
                          handleSave();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setEditingField(null);
                            handleSave();
                          }
                          if (e.key === "Escape") {
                            setEditingField(null);
                            fetchBusinessData();
                          }
                        }}
                        className="text-xl font-semibold text-[#1f2937] focus:outline-none focus:ring-2 focus:ring-[#2f4bff] rounded px-2 border border-[#2f4bff]"
                        autoFocus
                      />
                    ) : (
                      <>
                        <h3 className="text-xl font-semibold text-[#1f2937]">{businessData.name || "Business Name"}</h3>
                        <button
                          onClick={() => setEditingField("name")}
                          className="text-slate-400 hover:text-[#2f4bff] transition"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    {profileStrength.percentage < 100 && (
                      <span className="text-sm font-medium text-amber-600">▲ Incomplete business profile</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Strength */}
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">
                  Profile Strength: {strengthLabel}
                </span>
                <span className="text-sm font-semibold text-slate-700">{profileStrength.percentage}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200">
                <div
                  className={`h-2 rounded-full bg-gradient-to-r ${strengthColor}`}
                  style={{ width: `${profileStrength.percentage}%` }}
                ></div>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {profileStrength.totalFields - profileStrength.filledFields} out of {profileStrength.totalFields}{" "}
                fields are incomplete. Fill these to complete your profile
              </p>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-slate-200">
              <div className="flex gap-6">
                {(["basics", "business-info", "gst-info", "communication"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-sm font-medium capitalize transition ${
                      activeTab === tab
                        ? "border-b-2 border-[#2f4bff] text-[#2f4bff]"
                        : "text-slate-600 hover:text-[#1f2937]"
                    }`}
                  >
                    {tab.replace("-", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === "basics" && (
                <div className="space-y-4">
                  <EditableField
                    label="Business Name"
                    value={businessData.name}
                    editing={editingField === "name"}
                    onEdit={() => setEditingField("name")}
                    onChange={(value) => handleFieldChange("name", value)}
                    onSave={handleSave}
                    onCancel={() => {
                      setEditingField(null);
                      fetchBusinessData();
                    }}
                  />
                  <EditableField
                    label="Business Address"
                    value={businessData.businessAddress}
                    editing={editingField === "businessAddress"}
                    onEdit={() => setEditingField("businessAddress")}
                    onChange={(value) => handleFieldChange("businessAddress", value)}
                    onSave={handleSave}
                    onCancel={() => {
                      setEditingField(null);
                      fetchBusinessData();
                    }}
                    multiline
                  />
                  <EditableField
                    label="Staff Size"
                    value={businessData.staffSize}
                    editing={editingField === "staffSize"}
                    onEdit={() => setEditingField("staffSize")}
                    onChange={(value) => handleFieldChange("staffSize", value)}
                    onSave={handleSave}
                    onCancel={() => {
                      setEditingField(null);
                      fetchBusinessData();
                    }}
                    placeholder="e.g., 1-10, 11-50, 51-200, 200+"
                  />
                </div>
              )}

              {activeTab === "business-info" && (
                <div className="space-y-4">
                  <SelectableField
                    label="Business Category"
                    value={businessData.businessCategory}
                    options={BUSINESS_CATEGORIES}
                    editing={editingField === "businessCategory"}
                    onEdit={() => setEditingField("businessCategory")}
                    onChange={(value) => handleFieldChange("businessCategory", value)}
                    onSave={handleSave}
                    onCancel={() => {
                      setEditingField(null);
                      fetchBusinessData();
                    }}
                  />
                  <EditableField
                    label="Business Subcategory"
                    value={businessData.businessSubcategory}
                    editing={editingField === "businessSubcategory"}
                    onEdit={() => setEditingField("businessSubcategory")}
                    onChange={(value) => handleFieldChange("businessSubcategory", value)}
                    onSave={handleSave}
                    onCancel={() => {
                      setEditingField(null);
                      fetchBusinessData();
                    }}
                  />
                  <SelectableField
                    label="Business Type"
                    value={businessData.businessType}
                    options={BUSINESS_TYPES}
                    editing={editingField === "businessType"}
                    onEdit={() => setEditingField("businessType")}
                    onChange={(value) => handleFieldChange("businessType", value)}
                    onSave={handleSave}
                    onCancel={() => {
                      setEditingField(null);
                      fetchBusinessData();
                    }}
                  />
                  <SelectableField
                    label="Business Registration Type"
                    value={businessData.businessRegistrationType}
                    options={REGISTRATION_TYPES}
                    editing={editingField === "businessRegistrationType"}
                    onEdit={() => setEditingField("businessRegistrationType")}
                    onChange={(value) => handleFieldChange("businessRegistrationType", value)}
                    onSave={handleSave}
                    onCancel={() => {
                      setEditingField(null);
                      fetchBusinessData();
                    }}
                  />
                </div>
              )}

              {activeTab === "gst-info" && (
                <div className="space-y-4">
                  <EditableField
                    label="GST number"
                    value={businessData.gstNumber}
                    editing={editingField === "gstNumber"}
                    onEdit={() => setEditingField("gstNumber")}
                    onChange={(value) => handleFieldChange("gstNumber", value)}
                    onSave={handleSave}
                    onCancel={() => {
                      setEditingField(null);
                      fetchBusinessData();
                    }}
                    placeholder="15-digit GST number"
                  />
                </div>
              )}

              {activeTab === "communication" && (
                <div className="space-y-4">
                  <EditableField
                    label="Business Mobile Number"
                    value={businessData.businessMobile}
                    editing={editingField === "businessMobile"}
                    onEdit={() => setEditingField("businessMobile")}
                    onChange={(value) => handleFieldChange("businessMobile", value)}
                    onSave={handleSave}
                    onCancel={() => {
                      setEditingField(null);
                      fetchBusinessData();
                    }}
                    placeholder="+91XXXXXXXXXX"
                    type="tel"
                  />
                  <EditableField
                    label="Business Email"
                    value={businessData.businessEmail}
                    editing={editingField === "businessEmail"}
                    onEdit={() => setEditingField("businessEmail")}
                    onChange={(value) => handleFieldChange("businessEmail", value)}
                    onSave={handleSave}
                    onCancel={() => {
                      setEditingField(null);
                      fetchBusinessData();
                    }}
                    type="email"
                  />
                </div>
              )}
            </div>

            {/* Save Button */}
            {editingField && (
              <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-6">
                <button
                  onClick={() => {
                    setEditingField(null);
                    fetchBusinessData();
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-[#2f4bff] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2f4bff]/90 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
            </div>
            )}

            {/* Settings Section - Leave Business */}
            {activeSection === "settings" && (
              <div className="rounded-3xl border border-white/70 bg-white p-8 shadow-md">
                <div>
                  <h2 className="text-xl font-semibold text-[#1f2937] mb-2">Leave Business</h2>
                  <p className="text-sm text-slate-500 mb-6">You will lose access to this business</p>
                  <button
                    onClick={handleLeaveBusiness}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                    Leave business
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}

// Editable Field Component
function EditableField({
  label,
  value,
  editing,
  onEdit,
  onChange,
  onSave,
  onCancel,
  placeholder,
  type = "text",
  multiline = false,
}: {
  label: string;
  value: string;
  editing: boolean;
  onEdit: () => void;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  placeholder?: string;
  type?: string;
  multiline?: boolean;
}) {
  if (editing) {
    const InputComponent = multiline ? "textarea" : "input";
    return (
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600">{label}</label>
        <InputComponent
          type={type}
          value={value}
          onChange={(e: any) => onChange(e.target.value)}
          onBlur={onSave}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === "Enter" && !multiline) {
              onSave();
            }
            if (e.key === "Escape") {
              onCancel();
            }
          }}
          placeholder={placeholder}
          className="w-full rounded-lg border border-[#2f4bff] px-3 py-2 text-sm text-[#1f2937] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
          autoFocus
          rows={multiline ? 3 : undefined}
        />
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-600">{label}</label>
      <div className="flex items-center justify-between">
        <p className={`text-sm ${value ? "text-[#1f2937]" : "text-slate-400"}`}>
          {value || placeholder || "-"}
        </p>
        <button onClick={onEdit} className="ml-2 text-slate-400 hover:text-[#2f4bff] transition">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Selectable Field Component
function SelectableField({
  label,
  value,
  options,
  editing,
  onEdit,
  onChange,
  onSave,
  onCancel,
}: {
  label: string;
  value: string;
  options: string[];
  editing: boolean;
  onEdit: () => void;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  if (editing) {
    return (
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-600">{label}</label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onSave}
          className="w-full rounded-lg border border-[#2f4bff] px-3 py-2 text-sm text-[#1f2937] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
          autoFocus
        >
          <option value="">Select {label}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-600">{label}</label>
      <div className="flex items-center justify-between">
        <p className={`text-sm ${value ? "text-[#1f2937]" : "text-slate-400"}`}>{value || "-"}</p>
        <button onClick={onEdit} className="ml-2 text-slate-400 hover:text-[#2f4bff] transition">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
