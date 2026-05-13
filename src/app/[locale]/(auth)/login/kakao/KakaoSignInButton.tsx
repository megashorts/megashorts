// Kakao Sign-In Button
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function KakaoSignInButton() {
  return (
    <Button
      variant="outline"
      className="text-black hover:bg-gray-800 hover:text-black"
      asChild
    >
      <a href="/login/kakao" className="flex w-full items-center gap-2">
        <KakaoIcon />
      </a>
    </Button>
  );
}

function KakaoIcon() {
  return (
    <Image
      src="/kakao.svg"
      alt="Kakao Icon"
      width={20}
      height={20}
      className="block"
    />
  );
}
