import { invokeFunction } from "@/services/api"

export type AdminProfile = {
  id: string | null
  name: string
  email: string
  photoUrl: string | null
}

type ChangeAdminPasswordPayload = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export async function changeAdminPassword(payload: ChangeAdminPasswordPayload) {
  return invokeFunction<{ ok: boolean; message?: string }>("admin-change-password", {
    method: "POST",
    body: payload,
  })
}

function pickString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) return value.trim()
  }
  return null
}

function normalizeAdminProfile(payload: unknown): AdminProfile {
  const raw = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {}
  return {
    id: pickString(raw.id),
    name: pickString(raw.name, raw.fullName, raw.displayName, raw.username) ?? "Administrador",
    email: pickString(raw.email) ?? "",
    photoUrl: pickString(raw.photoUrl, raw.avatarUrl, raw.picture, raw.imageUrl, raw.profilePhoto),
  }
}

export async function fetchAdminProfile() {
  const response = await invokeFunction<unknown>("admin-profile", { method: "GET" })
  return normalizeAdminProfile(response)
}

export async function updateAdminProfile(payload: { displayName: string; photo?: File | null }) {
  const formData = new FormData()
  formData.append("displayName", payload.displayName)
  if (payload.photo) formData.append("photo", payload.photo)

  const response = await invokeFunction<unknown>("admin-profile", {
    method: "PUT",
    body: formData,
  })

  return normalizeAdminProfile(response)
}
