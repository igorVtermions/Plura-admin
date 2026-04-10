// src/features/instructors/components/profile/InstructorStats.tsx
import React, { KeyboardEvent } from "react";

type Props = {
  followers: number;
  reports: number;
  onFollowersClick?: () => void;
  onReportsClick?: () => void;
};

type StatItem = {
  key: "followers" | "reports";
  label: string;
  value: number;
  onPress?: () => void;
};

export const InstructorStats: React.FC<Props> = ({
  followers,
  reports,
  onFollowersClick,
  onReportsClick,
}) => {
  const stats: StatItem[] = [
    { key: "followers", label: "Seguidores", value: followers, onPress: onFollowersClick },
    { key: "reports", label: "Denúncias", value: reports, onPress: onReportsClick },
  ];

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, handler?: () => void) => {
    if (!handler) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handler();
    }
  };

  return (
    <section className="mt-8 grid gap-4 md:grid-cols-2">
      {stats.map(({ key, label, value, onPress }) => {
        const clickable = typeof onPress === "function";
        const cardClass = [
          "group flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#E2E8F8] bg-[#F9FBFF] p-6 text-center transition-transform duration-200 ease-out",
          clickable
            ? "cursor-pointer hover:-translate-y-1 hover:scale-[1.03] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#B8C3F5]"
            : "cursor-default",
        ].join(" ");

        const valueClass = [
          "text-2xl font-semibold text-[#191F33] transition-colors duration-200",
          clickable ? "group-hover:text-[#2B1F58]" : "",
        ].join(" ");

        const labelClass = [
          "text-xs uppercase tracking-wide text-[#8A94AB] transition-colors duration-200",
          clickable ? "group-hover:text-[#6350C9]" : "",
        ].join(" ");

        return (
          <div
            key={key}
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
            className={cardClass}
            onClick={clickable ? onPress : undefined}
            onKeyDown={(event) => handleKeyDown(event, onPress)}
          >
            <p className={valueClass}>{value}</p>
            <p className={labelClass}>{label}</p>
          </div>
        );
      })}
    </section>
  );
};
