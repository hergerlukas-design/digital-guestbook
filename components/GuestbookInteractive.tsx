"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AddEntryForm from './AddEntryForm';

export default function GuestbookInteractive({ guestbookId }: { guestbookId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    setIsModalOpen(false);
    // Das ist der Next.js-Trick: Wir sagen dem Server, 
    // er soll die aktuellen Datenbankeinträge im Hintergrund neu laden.
    router.refresh(); 
  };

  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 bg-stone-800 text-white px-8 py-4 rounded-full font-bold shadow-2xl hover:bg-stone-700 transition-transform transform hover:scale-105 z-40"
      >
        Eintrag hinzufügen
      </button>

      {isModalOpen && (
        <AddEntryForm 
          guestbookId={guestbookId} 
          onSuccess={handleSuccess} 
          onCancel={() => setIsModalOpen(false)} 
        />
      )}
    </>
  );
}