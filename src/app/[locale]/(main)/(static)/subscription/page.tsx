import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Subscriptions from "./Subscription";

export const metadata: Metadata = {
  title: "Subscription",
};

export default async function Page() {
  const t = await getTranslations("Subscription");

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-2 mx-5 md:mx-1 lg:mx-1 xl:mx-1">
        <div className="rounded-2xl bg-card p-3 sm:p-3 mx-auto shadow-sm">
          <h1 className="text-center text-lg sm:text-2xl font-bold">{t("eventHeadline")}</h1>
        </div>
        <Subscriptions />
      </div>
    </main>
  );
}
