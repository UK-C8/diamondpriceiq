import Link from "next/link";
import { DISCLAIMER } from "@/lib/constants";

export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-gray-500 text-center leading-relaxed ${className}`}>
      <span className="font-medium text-gray-600">{DISCLAIMER}</span>{" "}
      <Link
        href="/methodology"
        className="underline hover:text-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-400 rounded"
      >
        See methodology
      </Link>
    </p>
  );
}
