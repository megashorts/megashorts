// Naver Sign-In Button
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function NaverSignInButton() {
  return (
    <Button
      variant="outline"
      className="text-black hover:bg-gray-800 hover:text-black"
      asChild
    >
      <a href="/login/naver" className="flex w-full items-center gap-2">
        <NaverIcon />
      </a>
    </Button>
  );
}

function NaverIcon() {
  return (
    <Image
      src="/naver.svg"
      alt="Naver Icon"
      width={20}
      height={20}
      className="block"
    />
  );
}