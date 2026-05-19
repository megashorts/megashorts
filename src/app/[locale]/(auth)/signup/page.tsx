import { Metadata } from "next";
import { Link } from "@/i18n/routing";
import SignUpForm from "./SignUpForm";
import { useTranslations } from "next-intl";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function Page() {
  const tAuth = useTranslations("Auth");
  return (
    <div className="space-y-6">
          <SignUpForm />
          <div className="text-gray-500 text-xs mt-3 text-center">
            <p className="text-muted-foreground ml-4 pb-1">
              {tAuth("signupBonusMessage")}
            </p>
            {tAuth("alreadyHaveAccount")} {" "}
            <Link className="text-white hover:underline" href="/login">
              {tAuth("login")}
            </Link>
          </div>
    </div>
  );
}
