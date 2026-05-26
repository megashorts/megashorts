import { validateRequest } from '@/auth';
import Linkify from "@/components/Linkify";
import prisma from "@/lib/prisma";
import { getUserDataSelect, UserData } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { formatDate } from "date-fns";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import EditProfileButton from "./EditProfileButton";
import LanguageFlag from '@/components/LanguageFlag';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AuthButton } from './AuthButton';
import UserTabsClient from './UserTabsClient';
import { getTranslations } from 'next-intl/server';


interface PageProps {
  params: Promise<{ username: string }>;
}

const getUser = cache(async (username: string, loggedInUserId: string) => {
  const user = await prisma.user.findFirst({
    where: {
      username: {
        equals: username,
        mode: "insensitive",
      },
    },
    select: getUserDataSelect(loggedInUserId),
  });

  if (!user) notFound();

  return user;
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { user: loggedInUser } = await validateRequest();

  if (!loggedInUser) return {};

  const user = await getUser(resolvedParams.username, loggedInUser.id);

  return {
    title: `${user.displayName} (@${user.username})`,
  };
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  const { user: loggedInUser } = await validateRequest();
  const tUserMenu = await getTranslations('UserMenu');

  if (!loggedInUser) {
    return (
      <p className="text-destructive">
        {tUserMenu('unauthorized')}
      </p>
    );
  }

  const user = await getUser(resolvedParams.username, loggedInUser.id);

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-2 mx-5 md:mx-1 lg:mx-1 xl:mx-1">
        <UserProfile user={user} loggedInUserId={loggedInUser.id} />
        <div className="rounded-2xl bg-card p-3 shadow-sm">
          <h2 className="text-center text-base text-zinc-400 font-bold">
            {tUserMenu('usageHistory', { name: user.displayName })}
          </h2>
        </div>
        <UserTabsClient />
      </div>
    </main>
  );
}

interface UserProfileProps {
  user: UserData;
  loggedInUserId: string;
}

async function UserProfile({ user, loggedInUserId }: UserProfileProps) {
  const tUserMenu = await getTranslations('UserMenu');
  const signupLabel = user.googleId
    ? tUserMenu('googleSignup', { email: user.email || '' })
    : user.naverId
      ? tUserMenu('naverSignup', { email: user.email || '' })
      : user.kakaoId
        ? tUserMenu('kakaoSignup', { email: user.email || '' })
        : tUserMenu('emailSignup', { email: user.email || '' });

  return (
    <div className="h-fit w-full space-y-5 rounded-2xl bg-card p-4 sm:p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-white break-words">{user.displayName}</h1>
          <div className="text-sm text-muted-foreground">@{user.username}</div>
        </div>
        {user.id === loggedInUserId ? (
          <EditProfileButton user={JSON.parse(JSON.stringify(user))} />
        ) : (
          <Label />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Account Info</h3>
          <div className="divide-y divide-white/10 text-sm">
            <div className="flex min-h-10 items-center justify-between gap-3 py-2">
              <span className="text-muted-foreground">Date Join</span>
              <span className="text-right text-white">{formatDate(user.createdAt, "yyyy-MM-dd")}</span>
            </div>
            <div className="flex min-h-10 items-center justify-between gap-3 py-2">
              <span className="text-muted-foreground">Email</span>
              <span className="max-w-[68%] truncate text-right text-white" title={signupLabel}>{signupLabel}</span>
            </div>
            <div className="flex min-h-10 items-center justify-between gap-3 py-2">
              <span className="text-muted-foreground">Language</span>
              <LanguageFlag language={user.myLanguage} className="h-5 w-5" />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Status</h3>
          <div className="divide-y divide-white/10 text-sm">
            <div className="flex min-h-10 items-center justify-between gap-3 py-2">
              <span className="text-muted-foreground">{tUserMenu('msCoin')}</span>
              <span className="text-right text-white">💎 {formatNumber(user.mscoin)}</span>
            </div>
            <div className="flex min-h-10 items-center justify-between gap-3 py-2">
              <span className="text-muted-foreground">Adult Verification</span>
              <div className="flex items-center gap-2">
                <span className={`led-indicator ${user.adultauth ? 'led-blue' : 'led-red'}`}></span>
                <span className="text-white">{user.adultauth ? tUserMenu('adultVerified') : tUserMenu('adultNotVerified')}</span>
                <AuthButton isAuthenticated={user.adultauth} />
              </div>
            </div>
            <div className="flex min-h-10 items-center justify-between gap-3 py-2">
              <span className="text-muted-foreground">Subscription</span>
              <div className="flex items-center gap-2 text-right text-white">
                <span>{user.subscription ? tUserMenu('subscribed') : tUserMenu('notSubscribed')}</span>
                {!user.subscription && (
                <Link href="/subscription" className="block">
                  <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                    {tUserMenu('subscribeApply')}
                  </Button>
                </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {user.bio && (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-4">
          <Linkify>
            <div className="overflow-hidden whitespace-pre-line break-words text-sm text-white/85">
              {user.bio}
            </div>
          </Linkify>
        </div>
      )}
    </div>
  );
}
