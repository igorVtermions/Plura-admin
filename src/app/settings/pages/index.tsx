"use client"

import { useEffect, useMemo, useState } from "react"
import { Eye, EyeClosed } from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "@/components/ui/Image"
import { Input } from "@/components/ui/input"
import { changeAdminPassword, fetchAdminProfile, updateAdminProfile } from "@/services/admin"

type OperationalProfile = {
  displayName: string
  email: string
  photoUrl: string | null
}

const defaultProfile: OperationalProfile = {
  displayName: "Administrador",
  email: "",
  photoUrl: null,
}

function validatePassword(pw: string) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /\d/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === "string") return error
  return "Erro ao alterar senha."
}

export function SettingsPage() {
  const [profile, setProfile] = useState<OperationalProfile>(defaultProfile)
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null)
  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)
  const [newPasswordFocused, setNewPasswordFocused] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadProfile = async () => {
      try {
        const admin = await fetchAdminProfile()
        if (!mounted) return
        setProfile({
          displayName: admin.name,
          email: admin.email,
          photoUrl: admin.photoUrl,
        })
      } catch {
        if (!mounted) return
        setProfile(defaultProfile)
      } finally {
        if (mounted) setLoadingProfile(false)
      }
    }

    loadProfile()
    return () => {
      mounted = false
    }
  }, [])

  const passwordRules = useMemo(() => validatePassword(newPassword), [newPassword])
  const strongPasswordOk = useMemo(() => Object.values(passwordRules).every(Boolean), [passwordRules])
  const passwordsMatch = confirmNewPassword.length > 0 && confirmNewPassword === newPassword

  useEffect(() => {
    if (!profilePhotoFile) {
      setProfilePreviewUrl(null)
      return
    }

    const nextUrl = URL.createObjectURL(profilePhotoFile)
    setProfilePreviewUrl(nextUrl)
    return () => URL.revokeObjectURL(nextUrl)
  }, [profilePhotoFile])

  const handleSaveProfile = async () => {
    const nextName = profile.displayName.trim()
    if (!nextName) {
      toast.error("Informe um nome de exibicao valido.")
      return
    }

    try {
      setSavingProfile(true)
      const updated = await updateAdminProfile({
        displayName: nextName,
        photo: profilePhotoFile,
      })

      setProfile({
        displayName: updated.name,
        email: updated.email,
        photoUrl: updated.photoUrl,
      })
      setProfilePhotoFile(null)

      window.dispatchEvent(
        new CustomEvent("admin:profile-updated", {
          detail: { name: updated.name, photoUrl: updated.photoUrl },
        }),
      )

      toast.success("Perfil atualizado com sucesso.")
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError(null)

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError("Preencha os tres campos de senha.")
      return
    }

    if (!strongPasswordOk) {
      setPasswordError("A nova senha nao atende os criterios de seguranca.")
      return
    }

    if (!passwordsMatch) {
      setPasswordError("A confirmacao da nova senha nao confere.")
      return
    }

    if (currentPassword === newPassword) {
      setPasswordError("A nova senha deve ser diferente da senha atual.")
      return
    }

    try {
      setChangingPassword(true)
      await changeAdminPassword({
        currentPassword,
        newPassword,
        confirmPassword: confirmNewPassword,
      })

      setCurrentPassword("")
      setNewPassword("")
      setConfirmNewPassword("")
      toast.success("Senha alterada com sucesso.")
    } catch (error) {
      setPasswordError(getErrorMessage(error))
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <main className="min-h-full bg-[#FCFDFF] px-4 py-8 md:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8 rounded-2xl border border-[#E5EAF7] bg-gradient-to-r from-[#F4F0FF] via-[#F8FAFF] to-[#EFF5FF] p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6B4DB8]">Painel administrativo</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#161D31] md:text-4xl">Configuracoes</h1>
        </header>

        <section className="grid gap-5 md:grid-cols-2">
          <Card className="border-[#E5EAF7]">
            <CardHeader>
              <CardTitle className="text-[#1D2742]">Perfil operacional</CardTitle>
              <CardDescription>Edite o nome de exibicao e a foto do admin autenticado.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 overflow-hidden rounded-full border border-[#D7DEEE] bg-[#F1F4FC]">
                  {profilePreviewUrl || profile.photoUrl ? (
                    <Image src={profilePreviewUrl || profile.photoUrl || ""} alt="Foto do admin" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-[#6B4DB8]">
                      {profile.displayName.trim().charAt(0).toUpperCase() || "A"}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-[#6A7698]">Foto de perfil</label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) => setProfilePhotoFile(e.target.files?.[0] ?? null)}
                    className="block text-xs text-[#637091] file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-[#D7DEEE] file:bg-white file:px-3 file:py-2"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#6A7698]">Nome exibido</label>
                <Input
                  value={profile.displayName}
                  onChange={(e) => setProfile((prev) => ({ ...prev, displayName: e.target.value }))}
                  placeholder={loadingProfile ? "Carregando..." : "Nome do administrador"}
                  disabled={loadingProfile}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#6A7698]">E-mail</label>
                <Input type="email" value={profile.email} disabled readOnly />
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={savingProfile || loadingProfile}
                  className="bg-[#6B4DB8] text-white hover:bg-[#5A3FB0]"
                >
                  {savingProfile ? "Salvando..." : "Salvar perfil"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#E5EAF7]">
            <CardHeader>
              <CardTitle className="text-[#1D2742]">Alterar senha</CardTitle>
              <CardDescription>
                Informe sua senha atual e escolha uma nova senha forte para a conta de admin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#6A7698]">Senha atual</label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((value) => !value)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7885A9]"
                      aria-label={showCurrentPassword ? "Ocultar senha atual" : "Mostrar senha atual"}
                    >
                      {showCurrentPassword ? <EyeClosed className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#6A7698]">Nova senha</label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      onFocus={() => setNewPasswordFocused(true)}
                      onBlur={() => setNewPasswordFocused(false)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((value) => !value)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7885A9]"
                      aria-label={showNewPassword ? "Ocultar nova senha" : "Mostrar nova senha"}
                    >
                      {showNewPassword ? <EyeClosed className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#6A7698]">Confirmar nova senha</label>
                  <div className="relative">
                    <Input
                      type={showConfirmNewPassword ? "text" : "password"}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword((value) => !value)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7885A9]"
                      aria-label={showConfirmNewPassword ? "Ocultar confirmacao" : "Mostrar confirmacao"}
                    >
                      {showConfirmNewPassword ? <EyeClosed className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {newPasswordFocused && (
                <ul className="space-y-1 text-xs">
                  <li className={passwordRules.length ? "text-green-600" : "text-red-600"}>- Minimo 8 caracteres</li>
                  <li className={passwordRules.upper ? "text-green-600" : "text-red-600"}>- Pelo menos 1 letra maiuscula</li>
                  <li className={passwordRules.lower ? "text-green-600" : "text-red-600"}>- Pelo menos 1 letra minuscula</li>
                  <li className={passwordRules.number ? "text-green-600" : "text-red-600"}>- Pelo menos 1 numero</li>
                  <li className={passwordRules.special ? "text-green-600" : "text-red-600"}>- Pelo menos 1 caractere especial</li>
                </ul>
              )}

              {confirmNewPassword.length > 0 && (
                <p className={passwordsMatch ? "text-xs text-green-600" : "text-xs text-red-600"}>
                  {passwordsMatch ? "As senhas coincidem." : "As senhas nao coincidem."}
                </p>
              )}

              {passwordError && <p className="text-xs text-red-600">{passwordError}</p>}

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="bg-[#6B4DB8] text-white hover:bg-[#5A3FB0]"
                >
                  {changingPassword ? "Alterando..." : "Alterar senha"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
