import { Metadata } from "next";
import Subscriptions from "./Subscription";

export const metadata: Metadata = {
  title: "Subscription",
};

export default function Page() {
  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-2 mx-5 md:mx-1 lg:mx-1 xl:mx-1">
        <div className="rounded-2xl bg-card p-3 sm:p-3 mx-auto shadow-sm">
          <h1 className="text-center text-lg sm:text-2xl font-bold">🎉 🎉 어마어마한 할인 !! 🎁 🎁</h1>
        </div>
        <Subscriptions />
      </div>
    </main>
  );
}
