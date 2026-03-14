"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Book, LogOut, Plus, Loader2, Link as LinkIcon, ExternalLink, Copy } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  // --- STATE: Authentifizierung ---
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // --- STATE: Dashboard & Bücher ---
  const [books, setBooks] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // 1. Session beim Start prüfen & Listener für Login/Logout setzen
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthLoading(false);
      if (session) fetchBooks(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchBooks(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Gästebücher des eingeloggten Nutzers laden
  const fetchBooks = async (userId: string) => {
    const { data, error } = await supabase
      .from('guestbooks')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Fehler beim Laden der Bücher:", error);
    } else {
      setBooks(data || []);
    }
  };

  // 3. Login-Funktion
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError("Login fehlgeschlagen. Bitte prüfe E-Mail und Passwort.");
    setIsAuthLoading(false);
  };

  // 4. Logout-Funktion
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setBooks([]);
  };

  // 5. Neues Gästebuch anlegen
  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !session) return;
    
    setDashboardError(null);
    setIsCreating(true);

    // Slug aus dem Titel generieren (kleinschreiben, Leerzeichen durch Bindestriche, Sonderzeichen entfernen)
    const baseSlug = newTitle
      .toLowerCase()
      .replace(/[^a-z0-9äöüß\s-]/g, '')
      .replace(/\s+/g, '-');
    
    // Eindeutigen Slug garantieren, indem wir einen kurzen Hash anhängen
    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

    const { error } = await supabase
      .from('guestbooks')
      .insert({
        title: newTitle.trim(),
        slug: uniqueSlug,
        owner_id: session.user.id
      });

    if (error) {
      setDashboardError("Fehler beim Erstellen des Buches.");
    } else {
      setNewTitle(''); // Formular leeren
      fetchBooks(session.user.id); // Liste neu laden
    }
    setIsCreating(false);
  };

  // 6. NFC Link in die Zwischenablage kopieren
  const copyToClipboard = (slug: string) => {
    const url = `${window.location.origin}/book/${slug}`;
    navigator.clipboard.writeText(url);
    alert(`Link kopiert!\n\n${url}\n\nDu kannst diesen Link jetzt auf einen NFC-Tag schreiben.`);
  };

  // --- UI: Ladebildschirm ---
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <Loader2 className="animate-spin text-stone-500" size={40} />
      </div>
    );
  }

  // --- UI: Login-Bereich (Wenn nicht eingeloggt) ---
  if (!session) {
    return (
      <main className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-stone-200">
          <div className="flex justify-center mb-6">
            <div className="bg-stone-800 p-4 rounded-2xl text-white shadow-lg transform -rotate-3">
              <Book size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-serif font-bold text-center text-stone-800 mb-2">Gästebuch Admin</h1>
          <p className="text-stone-500 text-center mb-8 text-sm">Logge dich ein, um deine Events zu verwalten.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">E-Mail Adresse</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="z.B. mail@beispiel.de"
                className="w-full border border-stone-300 rounded-lg p-3 text-stone-900 focus:ring-2 focus:ring-stone-800 outline-none transition-shadow"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Passwort</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-stone-300 rounded-lg p-3 text-stone-900 focus:ring-2 focus:ring-stone-800 outline-none transition-shadow"
                required
              />
            </div>
            {authError && <p className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-lg">{authError}</p>}
            
            <button 
              type="submit"
              disabled={isAuthLoading}
              className="w-full bg-stone-800 text-white font-bold py-3 mt-4 rounded-lg hover:bg-stone-700 transition-colors flex justify-center items-center gap-2 shadow-md"
            >
              {isAuthLoading ? <Loader2 className="animate-spin" size={20} /> : 'Einloggen'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // --- UI: Dashboard (Wenn eingeloggt) ---
  return (
    <main className="min-h-screen bg-stone-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm mb-8 border border-stone-200">
          <div className="flex items-center gap-4">
            <div className="bg-stone-800 p-3 rounded-xl text-white shadow-sm">
              <Book size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-stone-800">Meine Events</h1>
              <p className="text-stone-500 text-sm hidden sm:block">Angemeldet als {session.user.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="text-stone-500 hover:text-stone-800 flex items-center gap-2 transition-colors font-medium bg-stone-50 hover:bg-stone-200 px-4 py-2 rounded-lg"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Abmelden</span>
          </button>
        </header>

        {/* Neues Buch erstellen */}
        <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm mb-8 border border-stone-200">
          <h2 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
            <Plus size={20} className="text-stone-500" />
            Neues Gästebuch anlegen
          </h2>
          <form onSubmit={handleCreateBook} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Titel eingeben (z. B. Mias & Toms Hochzeit 2026)"
                className="w-full border border-stone-300 rounded-lg p-4 text-stone-900 focus:ring-2 focus:ring-stone-800 outline-none transition-shadow text-lg"
                required
              />
            </div>
            <button 
              type="submit"
              disabled={isCreating}
              className="bg-stone-800 text-white font-bold py-4 px-8 rounded-lg hover:bg-stone-700 transition-colors flex justify-center items-center gap-2 whitespace-nowrap shadow-md disabled:opacity-70"
            >
              {isCreating ? <Loader2 className="animate-spin" size={20} /> : 'Gästebuch generieren'}
            </button>
          </form>
          {dashboardError && <p className="text-red-500 text-sm mt-3 font-medium">{dashboardError}</p>}
        </section>

        {/* Liste der Bücher */}
        <section>
          <h2 className="text-lg font-bold text-stone-800 mb-4 px-2">Vorhandene Gästebücher ({books.length})</h2>
          {books.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-stone-200 flex flex-col items-center justify-center">
              <Book size={48} className="text-stone-300 mb-4" />
              <p className="text-stone-600 text-lg font-medium">Du hast noch keine Gästebücher erstellt.</p>
              <p className="text-stone-400 mt-2">Nutze das Formular oben, um dein erstes Event anzulegen.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map((book) => (
                <div key={book.id} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col h-full hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-serif font-bold text-stone-800 mb-3 leading-tight">{book.title}</h3>
                  
                  <div className="flex items-center gap-2 text-stone-500 text-xs mb-6 bg-stone-50 p-3 rounded-lg border border-stone-100 font-mono">
                    <LinkIcon size={14} className="flex-shrink-0" />
                    <span className="truncate" title={`/book/${book.slug}`}>/book/{book.slug}</span>
                  </div>
                  
                  <div className="mt-auto flex flex-col xl:flex-row gap-3">
                    <button 
                      onClick={() => copyToClipboard(book.slug)}
                      className="flex-1 bg-stone-100 text-stone-700 font-semibold py-2.5 px-4 rounded-lg hover:bg-stone-200 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Copy size={16} />
                      NFC Link kopieren
                    </button>
                    <Link 
                      href={`/book/${book.slug}`}
                      target="_blank"
                      className="flex-1 border border-stone-300 text-stone-800 font-semibold py-2.5 px-4 rounded-lg hover:bg-stone-50 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <ExternalLink size={16} />
                      Öffnen
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        
      </div>
    </main>
  );
}