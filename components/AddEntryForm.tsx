"use client";

import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import imageCompression from 'browser-image-compression';
import { ImagePlus, Loader2, Send } from 'lucide-react';

interface AddEntryFormProps {
  guestbookId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddEntryForm({ guestbookId, onSuccess, onCancel }: AddEntryFormProps) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Vorschau für das Bild generieren
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validierung: Entweder Text oder Bild (oder beides) MUSS vorhanden sein
    if (!message.trim() && !file) {
      setError("Bitte hinterlasse einen Text oder ein Bild.");
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = null;

      // 1. Bild komprimieren und hochladen (falls vorhanden)
      if (file) {
        // Komprimierungs-Optionen: max. 1MB, max. 1920x1920 Pixel
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        
        const compressedFile = await imageCompression(file, options);
        
        // Eindeutigen Dateinamen generieren, um Überschreibungen zu verhindern
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        const filePath = `${guestbookId}/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('guestbook_images')
          .upload(filePath, compressedFile, {
            contentType: 'image/jpeg',
          });

        if (uploadError) throw new Error("Fehler beim Bild-Upload.");

        // Die öffentliche URL des Bildes abrufen
        const { data: publicUrlData } = supabase.storage
          .from('guestbook_images')
          .getPublicUrl(filePath);
          
        imageUrl = publicUrlData.publicUrl;
      }

      // 2. Den Eintrag in die Datenbank schreiben
      const { error: dbError } = await supabase
        .from('entries')
        .insert({
          guestbook_id: guestbookId,
          guest_name: name.trim() || 'Ein anonymer Gast',
          message: message.trim() || null,
          image_url: imageUrl,
        });

      if (dbError) throw new Error("Fehler beim Speichern des Eintrags.");

      // Erfolgreich! Formular zurücksetzen und Parent-Komponente informieren
      setName('');
      setMessage('');
      setFile(null);
      setPreview(null);
      onSuccess();

    } catch (err: any) {
      setError(err.message || "Es ist ein unbekannter Fehler aufgetreten.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
        <h2 className="text-2xl font-bold text-stone-800 mb-6">Neuer Eintrag</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Dein Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z. B. Mia & Tom"
              // FIX: text-stone-900 hinzugefügt für dunkle Schrift
              className="w-full border border-stone-300 rounded-lg p-3 text-stone-900 focus:ring-2 focus:ring-stone-800 outline-none"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Deine Nachricht</label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Was möchtest du dem Gastgeber sagen?"
              rows={4}
              // FIX: text-stone-900 hinzugefügt für dunkle Schrift
              className="w-full border border-stone-300 rounded-lg p-3 text-stone-900 focus:ring-2 focus:ring-stone-800 outline-none resize-none"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden" 
              disabled={isSubmitting}
            />
            
            {preview ? (
              <div className="relative rounded-lg overflow-hidden border border-stone-200 bg-stone-50">
                {/* FIX: object-cover durch object-contain ersetzt für volles Bild */}
                <img src={preview} alt="Vorschau" className="w-full h-48 object-contain" />
                <button 
                  type="button" 
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full text-xs font-bold shadow-md hover:bg-red-600 transition-colors"
                  disabled={isSubmitting}
                >
                  Entfernen
                </button>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-stone-300 rounded-lg p-6 text-stone-600 hover:bg-stone-50 transition-colors"
                disabled={isSubmitting}
              >
                <ImagePlus size={24} />
                <span>Foto hochladen</span>
              </button>
            )}
          </div>

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

          <div className="flex gap-3 pt-4 border-t border-stone-100">
            <button 
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 bg-stone-100 text-stone-700 font-semibold rounded-lg hover:bg-stone-200 transition-colors"
              disabled={isSubmitting}
            >
              Abbrechen
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-stone-800 text-white font-semibold rounded-lg hover:bg-stone-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Lädt hoch...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Eintragen
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}