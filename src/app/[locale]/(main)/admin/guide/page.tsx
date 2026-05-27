import { validateRequest } from '@/auth';
import { redirect } from 'next/navigation';
import { USER_ROLE } from '@/lib/constants';
import { readFileSync } from 'fs';
import { join } from 'path';
import { GuideMarkdownRenderer } from './GuideMarkdownRenderer';

export default async function AdminGuidePage() {
  const { user } = await validateRequest();
  
  if (!user || user.userRole < USER_ROLE.MASTER_ADMIN) {
    redirect('/');
  }

  const filePath = join(process.cwd(), 'docs', 'SYSTEM_GUIDE.md');
  const rawMd = readFileSync(filePath, 'utf-8');

  return (
    <main className="flex w-full min-w-0 gap-0">
      <div className="w-full min-w-0 space-y-2 px-2 sm:px-3 md:px-1 lg:px-1 xl:px-1">
        <div className="flex items-center justify-center rounded-xl bg-card p-2 md:p-3 mx-auto shadow-sm">
          <h1 className="text-center text-base sm:text-xl font-bold">System Guide</h1>
        </div>
        <GuideMarkdownRenderer rawMd={rawMd} />
      </div>
    </main>
  );
}
