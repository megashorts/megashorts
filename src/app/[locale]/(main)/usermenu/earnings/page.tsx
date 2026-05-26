import { validateRequest } from '@/auth';
import { notFound } from "next/navigation";
import { Metadata } from "next";
import EarningsTabsClient from './EarningsTabsClient';
import { getTranslations } from 'next-intl/server';
import prisma from '@/lib/prisma';
import { canOpenCreatorEarnings, isCreatorRole, isOperationsRole } from '@/lib/user-roles';


export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Earnings');
  return {
    title: t('creatorMetaTitle'),
    description: t('creatorMetaDescription'),
  };
}

export default async function EarningsPage({
  searchParams,
}: {
  searchParams?: Promise<{ targetUserId?: string }>;
}) {
  const { user: loggedInUser } = await validateRequest();
  const t = await getTranslations('Earnings');

  if (!loggedInUser) {
    return (
      <p className="text-destructive">
        You&apos;re not authorized to view this page.
      </p>
    );
  }

  const params = await searchParams;
  const targetUserId = params?.targetUserId;
  const isOperatorView = Boolean(targetUserId && targetUserId !== loggedInUser.id && isOperationsRole(loggedInUser.userRole));
  const targetUser = isOperatorView
    ? await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, displayName: true, userRole: true },
      })
    : loggedInUser;

  if (!targetUser) {
    notFound();
  }

  if (!isOperatorView && !canOpenCreatorEarnings(loggedInUser.userRole)) {
    notFound();
  }

  if (!isCreatorRole(targetUser.userRole)) {
    notFound();
  }

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-2 mx-5 md:mx-1 lg:mx-1 xl:mx-1">
        <div className="rounded-2xl bg-card p-3 shadow-sm">
          <h2 className="text-center text-base text-zinc-400 font-bold">
            {t('creatorPageHeading', { name: targetUser.displayName })}
          </h2>
        </div>
        <EarningsTabsClient userId={targetUser.id} userRole={targetUser.userRole} />
      </div>
    </main>
  );
}
