import { supabase } from '../../../lib/supabase';
import { notFound } from 'next/navigation';
import GuestbookInteractive from '../../../components/GuestbookInteractive';
import GuestFlipBook from '../../../components/GuestFlipBook';

export const revalidate = 0;

interface GuestbookPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function GuestbookPage({ params }: GuestbookPageProps) {
  const resolvedParams = await params;
  
  // WICHTIGER FIX: URL-Decoding! 
  // Wandelt %C3%A4 wieder in 'ä' und %20 wieder in Leerzeichen um.
  const slug = decodeURIComponent(resolvedParams.slug);

  const { data: guestbook, error: guestbookError } = await supabase
    .from('guestbooks')
    .select('*')
    .eq('slug', slug)
    .single();

  console.log("--- DEBUG START ---");
  console.log("Gesuchter Slug (entschlüsselt):", slug);
  console.log("Datenbank-Ergebnis:", guestbook);
  console.log("Datenbank-Fehler:", guestbookError);
  console.log("--- DEBUG ENDE ---");

  if (guestbookError || !guestbook) {
    notFound();
  }

  const { data: entries, error: entriesError } = await supabase
    .from('entries')
    .select('*')
    .eq('guestbook_id', guestbook.id)
    .order('created_at', { ascending: true });

  if (entriesError) {
    console.error("Fehler beim Laden der Einträge:", entriesError);
  }

  const safeEntries = entries || [];

  return (
    <main className="min-h-screen bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] bg-stone-200 p-4 flex flex-col items-center justify-center relative overflow-hidden">
      <GuestFlipBook entries={safeEntries} title={guestbook.title} />
      <GuestbookInteractive guestbookId={guestbook.id} />
    </main>
  );
}