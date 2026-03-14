import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Sicherheits-Check: Verhindert, dass die App ohne Datenbankverbindung startet
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Fehlende Supabase Umgebungsvariablen. Bitte die .env.local Datei prüfen.');
}

// Erstellt den Client, den wir im gesamten Projekt wiederverwenden werden
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
