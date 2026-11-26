import Image from "next/image";

export default function SiteLogo({ href = "/" }: { href?: string }) {
  return (
    <a href={href} className="inline-flex max-w-full shrink-0 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#082f5b]">
      <Image
        src="/UrbanHelpHub-logo.png"
        alt="UrbanHelpHub"
        width={2032}
        height={473}
        unoptimized
        className="h-auto w-36 sm:w-44"
      />
    </a>
  );
}
