// src/features/instructors/visuals.ts
import type { InstructorStatus } from "./types";

export type InstructorStatusMeta = {
  headerColor: string;
  nameColor: string;
  subtitleColor: string;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  avatarBorder: string;
  avatarShadow: string;
  primaryButtonShadow: string;
};

export const INSTRUCTOR_STATUS_META: Record<
  InstructorStatus,
  InstructorStatusMeta
> = {
  active: {
    headerColor: "#B08BFF",
    nameColor: "#2B1F58",
    subtitleColor: "#5F4A8C",
    accentColor: "#7D5CF5",
    badgeBg: "rgba(125, 92, 245, 0.12)",
    badgeText: "#4F3AAF",
    avatarBorder: "rgba(255, 255, 255, 0.78)",
    avatarShadow: "0px 14px 28px rgba(144, 118, 236, 0.32)",
    primaryButtonShadow: "0px 14px 28px rgba(125, 92, 245, 0.28)",
  },
  pending: {
    headerColor: "#D6DDF3",
    nameColor: "#23344E",
    subtitleColor: "#51607F",
    accentColor: "#5D6F92",
    badgeBg: "rgba(93, 111, 146, 0.12)",
    badgeText: "#3C4A63",
    avatarBorder: "rgba(255, 255, 255, 0.72)",
    avatarShadow: "0px 14px 28px rgba(109, 129, 168, 0.24)",
    primaryButtonShadow: "0px 14px 28px rgba(93, 111, 146, 0.24)",
  },
  banned: {
    headerColor: "#F5C0C0",
    nameColor: "#661F1F",
    subtitleColor: "#7D2E2E",
    accentColor: "#A94444",
    badgeBg: "rgba(201, 96, 96, 0.14)",
    badgeText: "#7D2E2E",
    avatarBorder: "rgba(255, 255, 255, 0.76)",
    avatarShadow: "0px 14px 28px rgba(197, 76, 76, 0.22)",
    primaryButtonShadow: "0px 14px 28px rgba(169, 68, 68, 0.25)",
  },
  inactive: {
    headerColor: "#E7E9F5",
    nameColor: "#2A3352",
    subtitleColor: "#59607D",
    accentColor: "#717AA6",
    badgeBg: "rgba(113, 122, 166, 0.14)",
    badgeText: "#4D5678",
    avatarBorder: "rgba(255, 255, 255, 0.7)",
    avatarShadow: "0px 14px 28px rgba(113, 122, 166, 0.18)",
    primaryButtonShadow: "0px 14px 28px rgba(113, 122, 166, 0.22)",
  },
};