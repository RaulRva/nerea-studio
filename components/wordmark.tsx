import Image from "next/image";
import Link from "next/link";

export function Wordmark({
  href = "/",
  variant = "name",
}: {
  href?: string;
  variant?: "name" | "full";
}) {
  const full = variant === "full";

  return (
    <Link href={href} className={full ? "wordmark wordmark-full" : "wordmark"}>
      <Image
        src={full ? "/logo-lockup.png" : "/logo-name.png"}
        alt="Nerea Studio"
        width={full ? 1134 : 1134}
        height={full ? 452 : 140}
        priority={full}
      />
    </Link>
  );
}
