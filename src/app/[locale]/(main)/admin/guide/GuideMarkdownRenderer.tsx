"use client";

import { useState, useMemo, useEffect, useCallback, useRef, type ComponentPropsWithoutRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { X, List } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── 헬퍼: 헤딩 텍스트 → id ──
function anchoredId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\uAC00-\uD7A3-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// ── 커스텀 ReactMarkdown 컴포넌트 ──
function H1({ children, ...props }: ComponentPropsWithoutRef<'h1'>) {
  const text = typeof children === 'string' ? children : String(children ?? '');
  return <h1 id={anchoredId(text)} {...props}>{children}</h1>;
}

function H2({ children, ...props }: ComponentPropsWithoutRef<'h2'>) {
  const text = typeof children === 'string' ? children : String(children ?? '');
  return <h2 id={anchoredId(text)} {...props}>{children}</h2>;
}

function H3({ children, ...props }: ComponentPropsWithoutRef<'h3'>) {
  const text = typeof children === 'string' ? children : String(children ?? '');
  return <h3 id={anchoredId(text)} {...props}>{children}</h3>;
}

function TableWrapper({ children, ...props }: ComponentPropsWithoutRef<'table'>) {
  return (
    <div className="table-wrapper">
      <table {...props}>{children}</table>
    </div>
  );
}

function PreWrapper({ children, ...props }: ComponentPropsWithoutRef<'pre'>) {
  return (
    <pre className="overflow-x-auto -mx-3 sm:mx-0 rounded-lg sm:rounded-xl" {...props}>
      {children}
    </pre>
  );
}

// ── 메인 컴포넌트 ──
export function GuideMarkdownRenderer({ rawMd }: { rawMd: string }) {
  const [activeSection, setActiveSection] = useState('');
  const [tocOpen, setTocOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // 목차 추출
  const toc = useMemo(() => {
    const headings: { level: number; text: string; id: string }[] = [];
    const regex = /^(#{1,3})\s+(.+)$/gm;
    let match;
    while ((match = regex.exec(rawMd)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      headings.push({ level, text, id: anchoredId(text) });
    }
    return headings;
  }, [rawMd]);

  // IntersectionObserver: 현재 읽는 섹션 추적
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px' }
    );

    const timer = setTimeout(() => {
      const els = document.querySelectorAll('.guide-markdown h1[id], .guide-markdown h2[id]');
      els.forEach((el) => observer.observe(el));
    }, 300);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [rawMd]);

  // 목차 클릭 → 부드러운 스크롤
  const scrollToHeading = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState(null, '', `#${id}`);
    }
    setTocOpen(false);
  }, []);

  // TOC 오버레이 열릴 때 body 스크롤 락
  useEffect(() => {
    if (tocOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [tocOpen]);

  // ── 공통 목차 아이템 렌더러 ──
  const tocButton = (item: { level: number; text: string; id: string }, mode: 'desktop' | 'overlay') => {
    const isMobile = mode === 'overlay';
    return (
      <li key={item.id}>
        <button
          onClick={() => scrollToHeading(item.id)}
          className={cn(
            'w-full text-left rounded-md transition-colors leading-snug',
            isMobile ? 'px-3 py-2.5 text-sm' : 'px-2 py-1.5 text-xs',
            item.level === 3 ? (isMobile ? 'pl-8' : 'pl-7') : item.level === 2 ? (isMobile ? 'pl-5' : 'pl-4') : 'font-semibold',
            activeSection === item.id
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          {item.text}
        </button>
      </li>
    );
  };

  return (
    <>
      {/* ═══════════════════════════════════════
          모바일/태블릿: 하단 플로팅 TOC 버튼 + 오버레이
          ═══════════════════════════════════════ */}
      <div className="lg:hidden">
        <button
          onClick={() => setTocOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-transform"
          aria-label="Open table of contents"
        >
          <List className="size-5" />
        </button>

        {tocOpen && (
          <div className="fixed inset-0 z-[100] flex flex-col bg-background">
            <div className="flex items-center justify-between border-b px-5 py-4 shrink-0">
              <h2 className="font-semibold text-lg">Table of Contents</h2>
              <button
                onClick={() => setTocOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto overscroll-contain px-4 py-3">
              <ul className="space-y-0.5">
                {toc.map((item) => tocButton(item, 'overlay'))}
              </ul>
            </nav>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════
          전체 레이아웃
          ═══════════════════════════════════════ */}
      <div className="flex gap-0 lg:gap-6">
        {/* 데스크탑 사이드바 TOC */}
        <aside className="hidden lg:block w-56 xl:w-64 shrink-0">
          <nav className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain rounded-xl bg-card border p-4">
            <h3 className="font-semibold text-sm mb-3 px-1 text-muted-foreground">
              Table of Contents
            </h3>
            <ul className="space-y-0">
              {toc.map((item) => tocButton(item, 'desktop'))}
            </ul>
          </nav>
        </aside>

        {/* 본문 */}
        <div ref={contentRef} className="flex-1 min-w-0">
          <div className="rounded-xl bg-card border shadow-sm p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="guide-markdown">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: H1,
                  h2: H2,
                  h3: H3,
                  table: TableWrapper,
                  pre: PreWrapper,
                }}
              >
                {rawMd}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
