import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';

interface Genre {
  id: number;
  name: string;
}

interface MovieResult {
  id: string;
  title: string;
  year: string | null;
}

interface SelectedMovie {
  id: string;
  title: string;
}

interface PreferencesPanelProps {
  roomId: string;
  isOpen: boolean;
  initialGenreIds?: number[];
  initialReferenceMovieIds?: string[];
  initialReferenceMovieTitles?: string[];
  onClose: () => void;
  onSaved: () => void;
}

export default function PreferencesPanel({
  roomId,
  isOpen,
  initialGenreIds = [],
  initialReferenceMovieIds = [],
  initialReferenceMovieTitles = [],
  onClose,
  onSaved,
}: PreferencesPanelProps) {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>(initialGenreIds);
  const [selectedMovies, setSelectedMovies] = useState<SelectedMovie[]>(() =>
    initialReferenceMovieIds.map((id, i) => ({ id, title: initialReferenceMovieTitles[i] ?? id }))
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MovieResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset state when panel opens
  useEffect(() => {
    if (isOpen) {
      setSelectedGenreIds(initialGenreIds);
      setSelectedMovies(
        initialReferenceMovieIds.map((id, i) => ({ id, title: initialReferenceMovieTitles[i] ?? id }))
      );
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen]);

  // Fetch genres once
  useEffect(() => {
    if (genres.length > 0) return;
    api
      .get('/genres')
      .then((res) => setGenres(res.data.genres ?? []))
      .catch(console.error);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await api.get('/movies/search', { params: { q: value } });
        setSearchResults(res.data.movies ?? []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  }, []);

  function addMovie(movie: MovieResult) {
    if (selectedMovies.some((m) => m.id === movie.id)) return;
    setSelectedMovies((prev) => [...prev, { id: movie.id, title: movie.title }]);
    setSearchQuery('');
    setSearchResults([]);
    // Adding a reference movie clears genres
    setSelectedGenreIds([]);
  }

  function removeMovie(id: string) {
    setSelectedMovies((prev) => prev.filter((m) => m.id !== id));
  }

  function toggleGenre(id: number) {
    setSelectedGenreIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  }

  function handleClear() {
    setSelectedGenreIds([]);
    setSelectedMovies([]);
    setSearchQuery('');
    setSearchResults([]);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.patch(`/rooms/${roomId}/preferences`, {
        genreIds: selectedMovies.length > 0 ? [] : selectedGenreIds,
        referenceMovieIds: selectedMovies.map((m) => m.id),
        referenceMovieTitles: selectedMovies.map((m) => m.title),
      });
      onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setSaving(false);
    }
  }

  const hasPreferences = selectedGenreIds.length > 0 || selectedMovies.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.75)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-md bg-gray-900 rounded-t-3xl border border-white/10 p-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Preferencias</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Reference movie search */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-300 mb-1">
                Peliculas de referencia
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Agrega una o mas peliculas para ver recomendaciones similares.
              </p>

              {/* Selected movies chips */}
              {selectedMovies.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedMovies.map((movie) => (
                    <span
                      key={movie.id}
                      className="flex items-center gap-1.5 bg-brand-pink/20 border border-brand-pink/40 text-brand-pink rounded-full px-3 py-1 text-sm"
                    >
                      {movie.title}
                      <button
                        onClick={() => removeMovie(movie.id)}
                        className="hover:text-white transition-colors leading-none"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar pelicula..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-brand-pink/50 transition-colors"
                />
              </div>

              {/* Search results dropdown */}
              {(searchResults.length > 0 || searchLoading) && (
                <div className="mt-1 bg-gray-800 border border-white/10 rounded-xl overflow-hidden">
                  {searchLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="w-5 h-5 border-2 border-brand-pink/30 border-t-brand-pink rounded-full animate-spin" />
                    </div>
                  ) : (
                    searchResults.map((movie) => {
                      const alreadyAdded = selectedMovies.some((m) => m.id === movie.id);
                      return (
                        <button
                          key={movie.id}
                          onClick={() => !alreadyAdded && addMovie(movie)}
                          disabled={alreadyAdded}
                          className="w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between border-b border-white/5 last:border-0 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10"
                        >
                          <span className="font-medium">{movie.title}</span>
                          <span className="text-xs text-gray-500 ml-2 shrink-0">
                            {alreadyAdded ? '✓' : movie.year ?? ''}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Genre chips */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-300 mb-1">
                Generos
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Se usan si no hay peliculas de referencia seleccionadas.
              </p>
              {genres.length === 0 ? (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-brand-pink/30 border-t-brand-pink rounded-full animate-spin" />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {genres.map((genre) => {
                    const active = selectedGenreIds.includes(genre.id) && selectedMovies.length === 0;
                    const disabled = selectedMovies.length > 0;
                    return (
                      <button
                        key={genre.id}
                        onClick={() => !disabled && toggleGenre(genre.id)}
                        disabled={disabled}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          active
                            ? 'bg-brand-pink text-white'
                            : disabled
                            ? 'bg-white/5 text-gray-600 cursor-not-allowed'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {genre.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleClear}
                disabled={!hasPreferences && !searchQuery}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-medium text-gray-400 hover:text-white hover:border-white/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Limpiar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-[2] py-2.5 rounded-xl bg-brand-pink text-white text-sm font-semibold hover:bg-brand-pink/90 transition-colors disabled:opacity-60"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
