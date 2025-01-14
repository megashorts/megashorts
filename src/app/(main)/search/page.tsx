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
    <main className="flex w-full min-w-0">  
      <div className="w-full min-w-0 space-y-4 mx-5 md:mx-1 lg:mx-1 xl:mx-1">
        {/* 공지사항 섹션 */}
        <div className="space-y-1">
          <div className="rounded-2xl bg-card p-3 sm:p-3 mx-auto shadow-sm">
            <h1 className="text-center text-lg sm:text-2xl font-bold">검색조회결과 &ldquo;{q}&rdquo;</h1>
          </div>
        </div>
        <SearchResults query={q} />
      </div>
      <NoticeSidebar />
    </main>
  );
}
