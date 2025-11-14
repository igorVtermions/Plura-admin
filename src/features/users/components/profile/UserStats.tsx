import React, { KeyboardEvent } from "react";

type Props = {
  followingCount: number;
  followersCount: number;
  reportsTotal: number;
  onOpenFollowers?: () => void;
  onOpenFollowing?: () => void;
  onOpenReports?: () => void;
};

type StatItem = {
  key: "following" | "followers" | "reports";
  label: string;
  value: number;
  onPress?: () => void;
};

const UserStats: React.FC<Props> = ({
  followingCount,
  followersCount,
  reportsTotal,
  onOpenFollowers,
  onOpenFollowing,
  onOpenReports,
}) => {
  const stats: StatItem[] = [
    { key: "following", label: "Seguindo", value: followingCount, onPress: onOpenFollowing },
    { key: "followers", label: "Seguidores", value: followersCount, onPress: onOpenFollowers },
    { key: "reports", label: "Denúncias", value: reportsTotal, onPress: onOpenReports },
  ];

  const handleKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    handler?: () => void,
  ) => {
    if (!handler) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handler();
    }
  };

  return (
    <section className="mt-8 grid gap-4 md:grid-cols-3">
      {stats.map(({ key, label, value, onPress }) => {
        const clickable = typeof onPress === "function";
        const className = [
          "group flex flex-col items-center justify-center gap-2 rounded-2xl border border-[#E2E8F8] bg-[#F9FBFF] p-6 text-center transition-transform duration-200 ease-out",
          clickable
            ? "cursor-pointer hover:-translate-y-1 hover:scale-[1.03] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#B8C3F5]"
            : "cursor-default",
        ].join(" ");

        return (
          <div
            key={key}
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
            onClick={clickable ? onPress : undefined}
            onKeyDown={(event) => handleKeyDown(event, onPress)}
            className={className}
          >
            <p className="text-2xl font-semibold text-[#191F33] transition-colors duration-200 group-hover:text-[#2B1F58]">
              {value}
            </p>
            <p className="text-xs uppercase tracking-wide text-[#8A94AB] transition-colors duration-200 group-hover:text-[#6350C9]">
              {label}
            </p>
          </div>
        );
      })}
    </section>
  );
};

export default UserStats;