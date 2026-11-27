import Image from "next/image";
import type { SocialLink } from "@/lib/platform-settings";

const shapes = {
  facebook: <path d="M14 22v-9h3l.5-4H14V7c0-1 .4-2 2-2h2V2h-3c-3 0-5 2-5 5v2H7v4h3v9z" />,
  instagram: <g fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r=".7" fill="currentColor" stroke="none"/></g>,
  youtube: <path fillRule="evenodd" d="M22 7.3a3 3 0 0 0-2.1-2.1C18 4.7 12 4.7 12 4.7s-6 0-7.9.5A3 3 0 0 0 2 7.3c-.5 1.7-.5 4.7-.5 4.7s0 3 .5 4.7a3 3 0 0 0 2.1 2.1c1.9.5 7.9.5 7.9.5s6 0 7.9-.5a3 3 0 0 0 2.1-2.1c.5-1.7.5-4.7.5-4.7s0-3-.5-4.7zM10 15.5v-7l6 3.5z" />,
  tiktok: <path d="M16 2h-3.6v13.5a2.8 2.8 0 1 1-2.8-2.8h.7V9.2l-.7-.1a6.4 6.4 0 1 0 6.4 6.4V8.7a8 8 0 0 0 4.5 1.4V6.6A4.6 4.6 0 0 1 16 2z" />,
  linkedin: <path d="M4 9h4v12H4zm2-6a2.2 2.2 0 1 1 0 4.4A2.2 2.2 0 0 1 6 3zm4 6h3.7v1.7c.6-1 1.7-2 3.7-2 3.2 0 4.6 2 4.6 5V21h-4v-6.6c0-1.5-.6-2.3-1.9-2.3-1.4 0-2.1.9-2.1 2.3V21h-4z" />,
  x: <path fillRule="evenodd" d="M2 3h5.8l5 6.6L18.5 3H21l-7 8.2L22 21h-5.8l-5.4-7.1L4.5 21H2l7.6-8.7zm3.6 1.8 11.6 14.4h1.4L7 4.8z" />,
  whatsapp: <><path d="M4.5 17.4 3 21l4.1-1.3A9.2 9.2 0 1 0 4.5 17.4Z" fill="none" stroke="currentColor" strokeWidth="1.6"/><path d="M8 7.5c.5-.5 1.4-.4 1.6.2l.8 1.9c.2.4-.6 1-.7 1.3.5 1.5 2.2 3 3.8 3.5.3-.1 1-1.2 1.3-1.2l2 .9c.6.3.2 1.6-.3 1.9-2.7 2-9.7-3.6-9.2-7.2.1-.7.4-1.1.7-1.3z"/></>,
  link: <path d="m10 13 4-4m-5 7-2 2a3.5 3.5 0 0 1-5-5l4-4a3.5 3.5 0 0 1 5 0m4-1 2-2a3.5 3.5 0 0 1 5 5l-4 4a3.5 3.5 0 0 1-5 0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />,
};

export default function SocialIcon({ link }: { link: SocialLink }) {
  if (link.icon === "custom" && link.custom_icon) {
    return <Image src={link.custom_icon} unoptimized width={22} height={22} alt="" className="size-[22px] object-contain" />;
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="size-[22px]">
      {shapes[link.icon === "custom" ? "link" : link.icon] || shapes.link}
    </svg>
  );
}
