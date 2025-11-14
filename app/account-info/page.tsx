"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import AppShell from "../components/AppShell";
import ProtectedRoute from "../components/ProtectedRoute";
import { getAuthToken } from "../utils/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

interface AccountDetails {
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  gstin: string | null;
  phone: string | null;
  upiId: string | null;
  upiQrCode: string | null;
  role: string | null;
  roles: string[] | null;
}

export default function AccountInfoPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [accountDetails, setAccountDetails] = useState<AccountDetails>({
    name: null,
    firstName: null,
    lastName: null,
    gstin: null,
    phone: null,
    upiId: null,
    upiQrCode: null,
    role: null,
    roles: null,
  });
  const [formData, setFormData] = useState<AccountDetails>({
    name: null,
    firstName: null,
    lastName: null,
    gstin: null,
    phone: null,
    upiId: null,
    upiQrCode: null,
    role: null,
    roles: null,
  });
  const [qrCodePreview, setQrCodePreview] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  // Fetch account details on mount
  useEffect(() => {
    fetchAccountDetails();
  }, []);

  const fetchAccountDetails = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const response = await fetch(`${API_BASE}/api/auth/account-details`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch account details");
      }

      const data = await response.json();
      setAccountDetails(data);
      setFormData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load account details");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(accountDetails);
    setQrCodePreview(null);
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      // Split name into first and last name if only name is provided
      let firstName = formData.firstName;
      let lastName = formData.lastName;

      if (formData.name && !firstName && !lastName) {
        const nameParts = formData.name.trim().split(/\s+/);
        firstName = nameParts[0] || null;
        lastName = nameParts.slice(1).join(" ") || null;
      }

      // Determine QR code value to send
      // Priority: 1. qrCodePreview (new upload), 2. formData.upiQrCode === "" (removed), 3. don't send (keep existing)
      let upiQrCodeToSend: string | undefined = undefined;
      
      if (qrCodePreview) {
        // New QR code uploaded (base64 data URL)
        upiQrCodeToSend = qrCodePreview;
      } else if (formData.upiQrCode === "" && accountDetails.upiQrCode) {
        // QR code was explicitly removed (user clicked Remove button)
        upiQrCodeToSend = "";
      }
      // Otherwise, don't send upiQrCode (keep existing QR code)

      const requestBody: any = {
        name: formData.name,
        firstName: firstName,
        lastName: lastName,
        gstin: formData.gstin,
        phone: formData.phone,
        upiId: formData.upiId,
      };

      // Only include upiQrCode if it's being updated (new upload or removal)
      if (upiQrCodeToSend !== undefined) {
        requestBody.upiQrCode = upiQrCodeToSend;
      }

      const response = await fetch(`${API_BASE}/api/auth/account-details`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update account details");
      }

      const data = await response.json();
      setAccountDetails(data.accountDetails);
      setFormData(data.accountDetails);
      setQrCodePreview(null);
      setIsEditing(false);
      setSuccess("Account details updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update account details");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof AccountDetails, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value || null,
    }));
  };

  // Format phone number for display
  const formatPhone = (phone: string | null) => {
    if (!phone) return "";
    // If phone starts with 91 and is 12 digits, format as +91 XXXXX XXXXX
    if (phone.startsWith("91") && phone.length === 12) {
      return `+${phone.slice(0, 2)} ${phone.slice(2, 7)} ${phone.slice(7)}`;
    }
    return phone;
  };

  // Format phone number for input (remove formatting)
  const unformatPhone = (phone: string | null) => {
    if (!phone) return "";
    return phone.replace(/\D/g, "");
  };

  // Handle QR code image upload
  const handleQrCodeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      // Store preview for display, actual base64 will be sent on save
      setQrCodePreview(base64String);
      setFormData((prev) => ({
        ...prev,
        upiQrCode: base64String, // Store base64 in formData
      }));
      setError(null);
    };
    reader.onerror = () => {
      setError("Failed to read image file");
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell activePath="/account-info">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#2f4bff] border-r-transparent"></div>
              <p className="mt-4 text-sm text-slate-600">Loading account details...</p>
            </div>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell activePath="/account-info">
        <section className="max-w-3xl rounded-3xl border border-white/70 bg-white p-8 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#1f2937]">Account details</h2>
              <p className="mt-2 text-sm text-slate-500">
                Keep your payout account information accurate and verified.
              </p>
            </div>
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="rounded-xl border border-[#2f4bff] bg-white px-4 py-2 text-sm font-semibold text-[#2f4bff] transition hover:bg-[#2f4bff]/10"
              >
                Edit
              </button>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-600">
              {success}
            </div>
          )}

          <div className="mt-6 grid gap-5 text-sm text-[#1f2937]">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Enter business name"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2f4bff]"
                />
              ) : (
                <p className="mt-2 rounded-xl border border-slate-200 bg-[#f8faff] px-4 py-3">
                  {accountDetails.name || "Not set"}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                GSTIN
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.gstin || ""}
                  onChange={(e) => handleChange("gstin", e.target.value)}
                  placeholder="Enter GSTIN"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2f4bff]"
                />
              ) : (
                <p className="mt-2 rounded-xl border border-slate-200 bg-[#f8faff] px-4 py-3">
                  {accountDetails.gstin || "Not set"}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                Primary contact
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={unformatPhone(formData.phone)}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="Enter phone number"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2f4bff]"
                />
              ) : (
                <p className="mt-2 rounded-xl border border-slate-200 bg-[#f8faff] px-4 py-3">
                  {formatPhone(accountDetails.phone) || "Not set"}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                UPI ID
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.upiId || ""}
                  onChange={(e) => handleChange("upiId", e.target.value)}
                  placeholder="Enter UPI ID"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2f4bff]"
                />
              ) : (
                <p className="mt-2 rounded-xl border border-slate-200 bg-[#f8faff] px-4 py-3">
                  {accountDetails.upiId || "Not set"}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                Role
              </label>
              <p className="mt-2 rounded-xl border border-slate-200 bg-[#f8faff] px-4 py-3 capitalize">
                {accountDetails.role ? accountDetails.role.replace(/_/g, " ") : "Not set"}
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
              <div className="flex-1">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                  QR code
                </span>
                <p className="mt-2 text-xs text-slate-500">
                  Share this QR code with vendors to receive instant payments into your master wallet.
                </p>
                {isEditing && (
                  <div className="mt-3">
                    <label htmlFor="qr-code-upload" className="block cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQrCodeUpload}
                        className="hidden"
                        id="qr-code-upload"
                      />
                      <span className="inline-block rounded-xl border border-[#2f4bff] bg-white px-4 py-2 text-sm font-semibold text-[#2f4bff] transition hover:bg-[#2f4bff]/10">
                        {qrCodePreview || accountDetails.upiQrCode ? "Change QR Code" : "Upload QR Code"}
                      </span>
                    </label>
                    {(qrCodePreview || (accountDetails.upiQrCode && formData.upiQrCode !== "")) && (
                      <button
                        type="button"
                        onClick={() => {
                          // Set to empty string to mark for deletion
                          setFormData((prev) => ({ ...prev, upiQrCode: "" }));
                          setQrCodePreview(null);
                        }}
                        className="ml-2 text-sm text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div 
                className={`flex h-32 w-32 items-center justify-center rounded-2xl border border-slate-200 bg-[#f8faff] overflow-hidden ${
                  !isEditing && accountDetails.upiQrCode 
                    ? "cursor-pointer transition hover:border-[#2f4bff] hover:shadow-md" 
                    : ""
                }`}
                onClick={() => {
                  if (!isEditing && accountDetails.upiQrCode) {
                    setShowQrModal(true);
                  }
                }}
              >
                {qrCodePreview ? (
                  // Show preview if new image uploaded
                  <img
                    src={qrCodePreview}
                    alt="QR code preview"
                    className="h-full w-full object-contain"
                  />
                ) : isEditing && formData.upiQrCode === "" ? (
                  // Show placeholder if QR code was removed in edit mode
                  <Image
                    src="/images/placeholder-qr.png"
                    alt="QR code placeholder"
                    width={96}
                    height={96}
                    className="object-contain opacity-50"
                  />
                ) : accountDetails.upiQrCode && !(isEditing && formData.upiQrCode === "") ? (
                  // Show existing QR code (only if not removed in edit mode)
                  <img
                    src={`${API_BASE}/uploads/${accountDetails.upiQrCode}`}
                    alt="QR code"
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.onerror = null; // Prevent infinite loop
                      target.src = "/images/placeholder-qr.png";
                    }}
                  />
                ) : (
                  // Show placeholder if no QR code
                  <Image
                    src="/images/placeholder-qr.png"
                    alt="QR code placeholder"
                    width={96}
                    height={96}
                    className="object-contain"
                  />
                )}
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-[#2f4bff] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2f4bff]/90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </section>

        {/* QR Code Modal */}
        {showQrModal && accountDetails.upiQrCode && !isEditing && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowQrModal(false)}
          >
            <div
              className="relative mx-4 w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-[#1f2937]">QR Code</h3>
                <button
                  onClick={() => setShowQrModal(false)}
                  className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Close modal"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl">
                <img
                  src={`${API_BASE}/uploads/${accountDetails.upiQrCode}`}
                  alt="QR code"
                  className="w-80 h-80 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = "/images/placeholder-qr.png";
                  }}
                />
                {accountDetails.upiId && (
                  <p className="mt-6 text-base font-medium text-[#1f2937]">{accountDetails.upiId}</p>
                )}
                <p className="mt-3 text-sm text-slate-500 text-center">
                  Scan to pay with any UPI app
                </p>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowQrModal(false)}
                  className="rounded-full bg-[#2f4bff] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2540e6]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
