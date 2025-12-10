import type { UserStatus } from "@/types/users";

export type StatusVisualMeta = {
  headerColor: string;
  iconColor: string;
  nameColor: string;
  handleColor: string;
  bioColor: string;
  avatarBorder: string;
  avatarShadow: string;
  buttonGradient: string;
  buttonBorder: string;
};

export const STATUS_META: Record<UserStatus, StatusVisualMeta> = {
  active: {
    headerColor: "#A27DFF",
    iconColor: "#5D47B1",
    nameColor: "#2B1F58",
    handleColor: "#6350C9",
    bioColor: "#4D4F72",
    avatarBorder: "rgba(255, 255, 255, 0.68)",
    avatarShadow: "0px 14px 28px rgba(144, 118, 236, 0.32)",
    buttonGradient: "linear-gradient(180deg, #9F85FF 0%, #7F60F5 100%)",
    buttonBorder: "rgba(255, 255, 255, 0.6)",
  },
  pending: {
    headerColor: "#BBC7DA",
    iconColor: "#42536C",
    nameColor: "#23344E",
    handleColor: "#56667F",
    bioColor: "#4A566B",
    avatarBorder: "rgba(255, 255, 255, 0.7)",
    avatarShadow: "0px 14px 28px rgba(118, 138, 167, 0.24)",
    buttonGradient: "linear-gradient(180deg, #8593AA 0%, #6E7D95 100%)",
    buttonBorder: "rgba(255, 255, 255, 0.55)",
  },
  banned: {
    headerColor: "#F08989",
    iconColor: "#7D2E2E",
    nameColor: "#661F1F",
    handleColor: "#8F3636",
    bioColor: "#5D2020",
    avatarBorder: "rgba(255, 255, 255, 0.7)",
    avatarShadow: "0px 14px 28px rgba(201, 96, 96, 0.28)",
    buttonGradient: "linear-gradient(180deg, #E67070 0%, #C54C4C 100%)",
    buttonBorder: "rgba(255, 255, 255, 0.55)",
  },
};
