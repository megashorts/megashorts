import { TooltipProvider } from '@/components/ui/tooltip';
import ServiceTabs from './components/ServiceTabs';
import { validateRequest } from '@/auth';
import { USER_ROLE } from '@/lib/constants';
import { redirect } from 'next/navigation';

interface ServicePageProps {
  params: Promise<{ locale: string }>;
}

export default async function ServicePage({ params }: ServicePageProps) {
  const [{ locale }, { user }] = await Promise.all([params, validateRequest()]);
  if (!user || user.userRole < USER_ROLE.OPERATION1) {
    redirect(`/${locale}/login?next=/${locale}/admin/service?tab=logs`);
  }

  return (
    <TooltipProvider>
      <main className="flex w-full min-w-0 gap-5">
        <div className="w-full min-w-0 space-y-2 mx-5 md:mx-1 lg:mx-1 xl:mx-1">
          <div className="flex items-center justify-center rounded-xl bg-card p-2 md:p-3 mx-auto shadow-sm hidden md:block">
            <h1 className="text-center text-base sm:text-xl font-bold">Service</h1>
          </div>
          <ServiceTabs />
        </div>
      </main>
    </TooltipProvider>
  );
}
