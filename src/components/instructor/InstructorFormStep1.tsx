"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import AvatarPicker from "./AvatarPicker";
import PasswordRequirements from "./PasswordRequirements";

type Props = {
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  role: string;
  setRole: (v: string) => void;
  about: string;
  setAbout: (v: string) => void;
  file: File | null;
  setFile: (f: File | null) => void;
  pwFocused: boolean;
  setPwFocused: (b: boolean) => void;
  handlePhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePhoneKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

export default function InstructorFormStep1(props: Props) {
  const {
    name,
    setName,
    email,
    setEmail,
    phone,
    handlePhoneChange,
    handlePhoneKeyDown,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    role,
    setRole,
    about,
    setAbout,
    file,
    setFile,
    pwFocused,
    setPwFocused,
  } = props;

  return (
    <div className="w-full mt-6">
      <AvatarPicker file={file} onChange={setFile} />
      <div className="w-full mt-6">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="instructor-name">
              Nome <span className="text-red-600">*</span>
            </Label>
            <Input id="instructor-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Insira o nome do instrutor" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="instructor-email">
                E-mail <span className="text-red-600">*</span>
              </Label>
              <Input id="instructor-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Insira o e-mail" required />
            </div>
            <div>
              <Label htmlFor="instructor-phone">
                Telefone <span className="text-red-600">*</span>
              </Label>
              <Input id="instructor-phone" value={phone} onChange={handlePhoneChange} onKeyDown={handlePhoneKeyDown} placeholder="(21) 99999-9999" inputMode="numeric" pattern="[0-9]*" maxLength={15} required />
            </div>
          </div>

          <div className="relative">
            <Label htmlFor="instructor-password">
              Senha <span className="text-red-600">*</span>
            </Label>
            <div className="relative h-10">
              <Input id="instructor-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setPwFocused(true)} onBlur={() => setTimeout(() => setPwFocused(false), 120)} placeholder="Escolha uma senha" className="pr-10 h-full" />
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} className="absolute right-2 top-0 bottom-0 flex items-center justify-center px-2 text-slate-600 hover:text-slate-800 transition-colors" style={{ pointerEvents: "auto" }}>
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <PasswordRequirements password={password} focused={pwFocused} />
          </div>

          <div>
            <Label htmlFor="instructor-role">Cargo / Função <span className="text-red-600">*</span></Label>
            <Input id="instructor-role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Ex: Médico, psicólogo, neurocientista" required />
          </div>

          <div>
            <Label htmlFor="instructor-about">Sobre</Label>
            <textarea id="instructor-about" value={about} onChange={(e) => { if (e.target.value.length <= 150) setAbout(e.target.value); }} placeholder="Adicione uma descrição sobre este instrutor" className="w-full min-h-[80px] border rounded-md px-3 py-2 text-sm" />
            <div className="text-xs mt-1 text-muted-foreground text-right">{about.length}/150</div>
          </div>
        </div>
      </div>
    </div>
  );
}