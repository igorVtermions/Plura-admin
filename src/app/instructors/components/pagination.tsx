// src/features/instructors/components/Pagination.tsx
"use client";

import React, { useEffect, useRef } from "react";
import Image from "@/components/ui/Image";
import { cn } from "@/lib/utils";

type Props = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
};

const scrollClass = "instructors-pagination-scroll";

const Pagination: React.FC<Props> = ({
  page,
  totalPages,
  onPageChange,
  disabled = false,
}) => {
  const selectedBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    selectedBtnRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [page, totalPages]);

  if (totalPages <= 1) return null;

  const maxVisible = 5;
  const half = Math.floor(maxVisible / 2);
  const start = Math.max(
    1,
    Math.min(page - half, Math.max(1, totalPages - maxVisible + 1)),
  );
  const end = Math.min(totalPages, start + maxVisible - 1);
  const pages = Array.from({ length: end - start + 1 }, (_, idx) => start + idx);

  const goPage = (target: number) => {
    if (disabled) return;
    onPageChange(Math.max(1, Math.min(totalPages, target)));
  };

  const prevDisabled = disabled || page === 1;
  const nextDisabled = disabled || page === totalPages;

  return (
    <div className="mt-10 flex items-center justify-center">
      <div className="flex items-center">
        <button
          type="button"
          aria-label="Página anterior"
          onClick={() => goPage(page - 1)}
          disabled={prevDisabled}
          className="flex h-10 items-center justify-center rounded-md border bg-white px-3 py-2 md:h-12"
          style={{
            borderColor: "#D0D9F1",
            color: prevDisabled ? "#7682A5" : "#191F33",
            opacity: prevDisabled ? 0.5 : 1,
          }}
        >
          <Image
            src="/Arrow.svg"
            alt="Anterior"
            width={13}
            height={13}
            className="object-contain"
          />
        </button>

        <div
          className={`${scrollClass} mx-4 flex items-center gap-2 overflow-x-auto md:mx-6`}
          style={{ scrollBehavior: "smooth" }}
        >
          {pages.map((p) => (
            <button
              key={p}
              ref={p === page ? selectedBtnRef : null}
              type="button"
              disabled={disabled}
              onClick={() => goPage(p)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-md border bg-white text-sm font-medium md:h-12 md:w-12",
                disabled && "cursor-not-allowed opacity-70",
              )}
              style={{
                borderColor: "#D0D9F1",
                color: p === page ? "#191F33" : "#7682A5",
                minWidth: 44,
              }}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          type="button"
          aria-label="Próxima página"
          onClick={() => goPage(page + 1)}
          disabled={nextDisabled}
          className="flex h-10 items-center justify-center rounded-md border bg-white px-3 py-2 md:h-12"
          style={{
            borderColor: "#D0D9F1",
            color: nextDisabled ? "#7682A5" : "#191F33",
            opacity: nextDisabled ? 0.5 : 1,
          }}
        >
          <Image
            src="/Arrow.svg"
            alt="Próxima"
            width={13}
            height={13}
            className="object-contain rotate-180"
          />
        </button>
      </div>

      <style>{`
        .${scrollClass} { -ms-overflow-style: none; scrollbar-width: none; }
        .${scrollClass}::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default Pagination;