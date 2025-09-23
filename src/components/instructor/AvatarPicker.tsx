"use client";

import React, { useRef } from "react";
import Image from "@/components/ui/Image";

type Props = {
  file: File | null;
  onChange: (f: File | null) => void;
  ariaLabel?: string;
};

export default function AvatarPicker({ file, onChange, ariaLabel = "Alterar foto" }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const avatarPreview = file ? URL.createObjectURL(file) : null;

  function pickFile() {
    fileRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    onChange(f);
  }

  return (
    <div className="w-full flex justify-center">
      <div className="relative">
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 112,
            height: 112,
            borderRadius: "9999px",
            background: "#F3F0FF",
            border: "2px dashed #D4C7FF",
          }}
        >
          {avatarPreview ? (
            <img src={avatarPreview} alt="avatar" className="w-24 h-24 rounded-full object-cover" />
          ) : (
            <div className="w-24 h-24 flex items-center justify-center">
              <Image src="/User.svg" alt="User" width={48} height={48} />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={pickFile}
          aria-label={ariaLabel}
          className="absolute left-1/2 bottom-2 transform -translate-x-1/2 translate-y-0 flex items-center justify-center cursor-pointer transition-transform duration-150 ease-in-out"
          style={{ pointerEvents: "auto" }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#977CEC",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 8px rgba(0,0,0,0.08)",
            }}
            className="hover:scale-105"
          >
            <Image src="/Pen.svg" alt="Pen" width={14} height={14} />
          </div>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
      </div>
    </div>
  );
}
