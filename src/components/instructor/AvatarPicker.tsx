"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "@/components/ui/Image";

type Props = {
  file: File | null;
  onChange: (f: File | null) => void;
  ariaLabel?: string;
  initialImageUrl?: string | null;
};

export default function AvatarPicker({
  file,
  onChange,
  ariaLabel = "Alterar foto",
  initialImageUrl = null,
}: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    let nextUrl: string | null = null;

    if (file) {
      nextUrl = URL.createObjectURL(file);
      setObjectUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return nextUrl;
      });
    } else {
      setObjectUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return null;
      });
    }

    return () => {
      if (nextUrl) URL.revokeObjectURL(nextUrl);
    };
  }, [file]);

  const fallbackImage =
    typeof initialImageUrl === "string" && initialImageUrl.trim().length > 0
      ? initialImageUrl
      : null;
  const avatarPreview = objectUrl ?? fallbackImage;

  function pickFile() {
    fileRef.current?.click();
  }

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    onChange(selectedFile);
    event.target.value = "";
  }

  return (
    <div className="flex w-full justify-center">
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
            <img
              src={avatarPreview}
              alt="avatar"
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center">
              <Image src="/User.svg" alt="User" width={48} height={48} />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={pickFile}
          aria-label={ariaLabel}
          className="absolute left-1/2 bottom-2 flex -translate-x-1/2 translate-y-0 cursor-pointer items-center justify-center transition-transform duration-150 ease-in-out hover:scale-105"
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
