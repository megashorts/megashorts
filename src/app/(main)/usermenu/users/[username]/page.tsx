import { validateRequest } from '@/auth';
import FollowButton from "@/components/FollowButton";
import Linkify from "@/components/Linkify";
import prisma from "@/lib/prisma";
import { FollowerInfo, getUserDataSelect, UserData } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { formatDate } from "date-fns";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import EditProfileButton from "./EditProfileButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import YourPosts from '../../yourposts/Yourposts';
import LanguageFlag from '@/components/LanguageFlag';
import { Language } from '@prisma/client';
import { WalletCards } from 'lucide-react';
import { Label } from '@/components/ui/label';
import Notifications from './Notifications';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AuthButton } from './AuthButton';
import PaymentHistory from './PaymentHistory';


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

  if (!loggedInUser) {
    return (
      <p className="text-destructive">
        You&apos;re not authorized to view this page.
      </p>
    );
  }

  const user = await getUser(resolvedParams.username, loggedInUser.id);

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-2 mx-5 md:mx-1 lg:mx-1 xl:mx-1">
        {/* <div className="rounded-2xl bg-card p-3 sm:p-3 mx-auto shadow-sm">
          <h1 className="text-center text-lg sm:text-2xl font-bold">나의 컨텐츠</h1>
        </div> */}
        <UserProfile user={user} loggedInUserId={loggedInUser.id} />
        <div className="rounded-2xl bg-card p-3 shadow-sm">
          <h2 className="text-center text-base text-zinc-400 font-bold">
            {user.displayName}&apos;의 이용내역
          </h2>
        </div>
        {/* <UserPosts userId={user.id} /> */}
        <Tabs defaultValue="notification">
          <TabsList>
            <TabsTrigger value="notification">알림</TabsTrigger>
            <TabsTrigger value="pay">코인 & 결제 기록</TabsTrigger>
          </TabsList>
          <TabsContent value="notification">
            <Notifications />
          </TabsContent>
          <TabsContent value="pay">
            {/* <PaymentHistory userId={''} /> */}
            {/* <YourPosts status="DRAFT" /> */}
            <p className="text-center text-muted-foreground mt-8">
              {/* You don&apos;t have any notifications yet. */}
              결제 사업자 등록 후 조회됩니다.
            </p>
          </TabsContent>
        </Tabs>
      </div>
      {/* <TrendsSidebar /> */}
    </main>
  );
}

interface UserProfileProps {
  user: UserData;
  loggedInUserId: string;
}

async function UserProfile({ user, loggedInUserId }: UserProfileProps) {
  const followerInfo: FollowerInfo = {
    followers: user._count.followers,
    isFollowedByUser: user.followers.some(
      ({ followerId }) => followerId === loggedInUserId,
    ),
  };

  return (
    <div className="h-fit w-full space-y-8 rounded-2xl bg-card p-8 shadow-sm">
      {/* <UserAvatar
        avatarUrl={user.avatarUrl}
        size={250}
        className="mx-auto size-full max-h-60 max-w-60 rounded-full"
      /> */}
      <div className="flex flex-wrap gap-3 sm:flex-nowrap">
        <div className="me-auto space-y-4 my-2 text-white/70">
          <div>
            <h1 className="text-3xl font-bold text-white">{user.displayName}</h1>
            <div className="text-muted-foreground">@{user.username}</div>
          </div>
          <div>{formatDate(user.createdAt, "MMM d, yyyy")}{" "}
            <br />
            {user.googleId
              ? `구글아이디 가입 ${user.email}`
              : user.naverId
              ? `네이버아이디 가입 ${user.email}`
              : user.kakaoId
              ? `카카오아이디 가입 ${user.email}`
              : `이메일 가입 ${user.email}`}
          </div>

          <div className="space-y-4">
            <div>
              <LanguageFlag language={user.myLanguage} />{"  /  "}{user.userRole === 10 ? "사용자 계정" : user.userRole === 15 ? "크리에이터 계정" : ""}
            </div>
            
          {/* <div className="flex items-center">
            {" "} <LanguageFlag language={user.myLanguage} />
          </div> */}

          <div className="flex items-center">
              💎 {formatNumber(user.mscoin)} MS코인
              {/* <svg 
                className="w-4 h-4 ml-2 mr-1" 
                viewBox="0 0 24 24" 
                fill="gold"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                <circle cx="12" cy="12" r="5" fill="gold"/>
              </svg> */}
            {/* <WalletCards className="mr-2 size-4" /> */}
            {/* {formatNumber(user.points)} */}
          </div>

          <div className="flex items-center">
            <span className={`led-indicator ${user.adultauth ? 'led-blue' : 'led-red'}`}></span>
            {user.adultauth ? '성인인증 완료' : '성인인증 미완료'}
            <AuthButton isAuthenticated={user.adultauth} />
          </div>

          <div className="flex items-center">
            <span className={`led-indicator ${user.subscription ? 'led-blue' : 'led-red'}`}></span>
              {user.subscription ? '현재 구독중' : '현재 미구독중'}
              {user.subscription && user.subscription.status === 'active' && user.subscriptionEndDate && (
                <span className="ml-2">/ 구독갱신 {formatDate(user.subscriptionEndDate, "yyyy-MM-dd")}</span>
              )}
              {user.subscription && user.subscription.status === 'cancelled' && user.subscriptionEndDate && (
                <span className="ml-2">/ 구독만료 {formatDate(user.subscriptionEndDate, "yyyy-MM-dd")}</span>
              )}
              {!user.subscription && (
                <Link href="/subscription">
                  <Button 
                    variant="outline" 
                    className='ml-2'
                    size="sm"
                  >
                    구독신청
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* <div className="flex items-center gap-3">
            <span>
              나의 컨텐츠 :{" "}
              <span className="font-semibold">
                {formatNumber(user._count.posts)}
              </span>
            </span>
          </div> */}
        </div>
        {user.id === loggedInUserId ? (
          <EditProfileButton user={user} />
        ) : (
          // <FollowButton userId={user.id} initialState={followerInfo} />
          <Label></Label>
        )}
      </div>
      {user.bio && (
        <>
          <hr />
          <Linkify>
            <div className="overflow-hidden whitespace-pre-line break-words">
              {user.bio}
            </div>
          </Linkify>
        </>
      )}
    </div>
  );
}
