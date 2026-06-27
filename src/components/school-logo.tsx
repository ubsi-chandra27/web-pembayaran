import Image from "next/image";

import { cn } from "@/lib/utils";

type SchoolLogoProps = {
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

export function SchoolLogo({
  className,
  imageClassName,
  priority = false,
}: SchoolLogoProps) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        className
      )}
    >
      <Image
        src="/logo-tk-azkia-transparent.png"
        alt="Logo TK Islam Azkia"
        width={2385}
        height={2161}
        priority={priority}
        className={cn("h-full w-full object-contain", imageClassName)}
      />
    </span>
  );
}
