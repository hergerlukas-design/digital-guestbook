"use client";

import React, { forwardRef } from 'react';
import dynamic from 'next/dynamic';

const FlipBookWrapper = dynamic(() => import('react-pageflip'), { 
  ssr: false,
  loading: () => (
    <div className="w-[400px] h-[600px] bg-stone-300 animate-pulse rounded-md mx-auto shadow-2xl flex items-center justify-center">
      <p className="text-stone-500 font-serif">Buch wird gebunden...</p>
    </div>
  )
}) as any;

const Page = forwardRef<HTMLDivElement, { children: React.ReactNode; isCover?: boolean }>(
  ({ children, isCover }, ref) => {
    return (
      <div 
        className={`page flex flex-col overflow-hidden border border-stone-300 ${
          isCover 
            ? 'bg-stone-800 text-white justify-center items-center shadow-2xl' 
            : 'bg-[#fdfbf7] text-stone-900 shadow-[inset_0_0_20px_rgba(0,0,0,0.05)]'
        }`} 
        ref={ref}
      >
        <div className="p-8 h-full flex flex-col">
          {children}
        </div>
      </div>
    );
  }
);

Page.displayName = 'Page';

interface Entry {
  id: string;
  guest_name: string;
  message: string | null;
  image_url: string | null;
  created_at: string;
}

export default function GuestFlipBook({ entries, title }: { entries: Entry[]; title: string }) {
  
  // WICHTIGER FIX: Wir bauen alle Seiten vorher in diesem Array auf.
  // Das verhindert strikt, dass "null" oder "false" in die FlipBook-Komponente gelangen.
  const pages = [];

  // 1. Cover (Vorderseite)
  pages.push(
    <Page key="cover-front" isCover={true}>
      <h1 className="text-4xl md:text-5xl font-serif font-bold text-center mt-auto mb-auto leading-tight">
        {title}
      </h1>
      <p className="mt-auto mb-8 text-stone-400 italic text-sm">
        Zum Blättern wischen oder klicken
      </p>
    </Page>
  );

  // 2. Innenseite des Covers
  pages.push(
    <Page key="cover-inside">
      <div className="w-full h-full flex items-center justify-center opacity-10">
        <span className="font-serif text-4xl">❧</span>
      </div>
    </Page>
  );

  // 3. Die Gästeeinträge
  if (entries.length === 0) {
    pages.push(
      <Page key="empty-page">
        <div className="h-full flex items-center justify-center text-stone-400 italic text-center font-serif text-lg">
          Die erste Seite gehört dir. Hinterlasse eine Erinnerung!
        </div>
      </Page>
    );
  } else {
    entries.forEach((entry) => {
      pages.push(
        <Page key={entry.id}>
          <header className="mb-4 border-b border-stone-200 pb-3">
            <p className="font-serif font-bold text-stone-900 text-2xl">
              {entry.guest_name}
            </p>
            <time className="text-xs text-stone-400 uppercase tracking-widest">
              {new Date(entry.created_at).toLocaleDateString('de-DE')}
            </time>
          </header>

          {entry.message && (
            <p className="text-stone-700 leading-relaxed mb-4 whitespace-pre-wrap font-serif italic text-lg">
              "{entry.message}"
            </p>
          )}
          
          {entry.image_url && (
            <div className="mt-auto pt-4 bg-white/50 rounded-lg h-1/2 flex items-center justify-center p-2 border border-stone-200 shadow-sm relative">
              <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-stone-400 opacity-50"></div>
              <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-stone-400 opacity-50"></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-stone-400 opacity-50"></div>
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-stone-400 opacity-50"></div>
              
              <img 
                src={entry.image_url} 
                alt={`Erinnerungsfoto von ${entry.guest_name}`} 
                className="max-w-full max-h-full object-contain p-1"
              />
            </div>
          )}
        </Page>
      );
    });
  }

  // 4. Korrektur-Seite (Damit der Umschlag immer hinten ist, brauchen wir eine gerade Seitenanzahl im Innenteil)
  if (entries.length % 2 !== 0 && entries.length > 0) {
    pages.push(
      <Page key="correction-page">
        <div className="h-full flex items-center justify-center text-stone-300 italic font-serif"></div>
      </Page>
    );
  }

  // 5. Innenseite des Rück-Covers
  pages.push(
    <Page key="back-inside">
      <div className="w-full h-full flex items-center justify-center opacity-10"></div>
    </Page>
  );

  // 6. Rückseite (Back Cover)
  pages.push(
    <Page key="back-cover" isCover={true}>
      <div className="h-full flex flex-col items-center justify-center">
        <p className="text-stone-400 font-serif tracking-widest uppercase">Ende</p>
      </div>
    </Page>
  );

  return (
    <div className="flex justify-center w-full max-w-5xl mx-auto my-8 md:my-16 perspective-1000">
      <FlipBookWrapper
        width={400}
        height={600}
        size="stretch"
        minWidth={315}
        maxWidth={500}
        minHeight={420}
        maxHeight={700}
        maxShadowOpacity={0.5}
        showCover={true}
        mobileScrollSupport={true}
        className="flip-book drop-shadow-2xl"
      >
        {/* Hier übergeben wir jetzt ausschließlich das zu 100% gefilterte Array */}
        {pages}
      </FlipBookWrapper>
    </div>
  );
}