import TrendsSidebar from "@/components/TrendsSidebar";
import { Metadata } from "next";
import SearchResults from "./SearchResults";
import NoticeSidebar from "@/components/NoticeSidebar";

interface PageProps {
  searchParams: Promise<{ q: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: 'Search results for "' + q + '"',
  };
}

export default async function Page({ searchParams }: PageProps) {
  const { q } = await searchParams;
  
  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <h1 className="line-clamp-2 break-all text-center text-2xl font-bold">
            검색조회결과 &ldquo;{q}&rdquo;
          </h1>
        </div>
        <SearchResults query={q} />
      </div>
      <NoticeSidebar />
    </main>
  );
}
