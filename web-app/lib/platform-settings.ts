export const socialIcons = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  x: "X",
  whatsapp: "WhatsApp",
  link: "General link",
  custom: "Upload an icon",
};

export type SocialLink = {
  label: string;
  url: string;
  icon: keyof typeof socialIcons;
  custom_icon?: string;
};

export type PlatformSettings = {
  display_name: string | null;
  tagline: string | null;
  support_email: string | null;
  support_phone: string | null;
  social_links: SocialLink[];
};
