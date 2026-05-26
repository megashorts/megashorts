import { getTranslations } from 'next-intl/server';

export default async function OfflinePage() {
  const t = await getTranslations('PWA');

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <section className="max-w-sm text-center">
        <h1 className="text-2xl font-bold">{t('offlineTitle')}</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-300">
          {t('offlineDescription')}
        </p>
      </section>
    </main>
  );
}
