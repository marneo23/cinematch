import axios from 'axios';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date: string;
  genre_ids: number[];
}

export interface TMDBMovieDetails extends TMDBMovie {
  runtime: number;
  genres: Array<{ id: number; name: string }>;
}

function getApiKey(): string {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error('TMDB_API_KEY environment variable is not set');
  return key;
}

export function getPosterUrl(posterPath: string | null): string {
  if (!posterPath) return '';
  return `${TMDB_IMAGE_BASE}${posterPath}`;
}

export async function fetchPopularMovies(page: number = 1): Promise<TMDBMovie[]> {
  const response = await axios.get(`${TMDB_BASE}/movie/popular`, {
    params: {
      api_key: getApiKey(),
      page,
      language: 'en-US',
    },
  });

  const results = response.data?.results;
  if (!Array.isArray(results)) {
    throw new Error('Unexpected TMDB response format: results is not an array');
  }
  return results as TMDBMovie[];
}

export async function fetchMovieDetails(movieId: number): Promise<TMDBMovieDetails> {
  const response = await axios.get(`${TMDB_BASE}/movie/${movieId}`, {
    params: {
      api_key: getApiKey(),
      language: 'en-US',
    },
  });
  return response.data as TMDBMovieDetails;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export async function fetchGenres(): Promise<TMDBGenre[]> {
  const response = await axios.get(`${TMDB_BASE}/genre/movie/list`, {
    params: {
      api_key: getApiKey(),
      language: 'en-US',
    },
  });
  const genres = response.data?.genres;
  if (!Array.isArray(genres)) {
    throw new Error('Unexpected TMDB response format: genres is not an array');
  }
  return genres as TMDBGenre[];
}

export async function discoverMovies(genreIds: number[], page: number = 1): Promise<TMDBMovie[]> {
  const response = await axios.get(`${TMDB_BASE}/discover/movie`, {
    params: {
      api_key: getApiKey(),
      language: 'en-US',
      page,
      with_genres: genreIds.join('|'),
    },
  });
  const results = response.data?.results;
  if (!Array.isArray(results)) {
    throw new Error('Unexpected TMDB response format: results is not an array');
  }
  return results as TMDBMovie[];
}

export async function fetchRecommendations(movieId: string, page: number = 1): Promise<TMDBMovie[]> {
  const response = await axios.get(`${TMDB_BASE}/movie/${movieId}/recommendations`, {
    params: {
      api_key: getApiKey(),
      language: 'en-US',
      page,
    },
  });
  const results = response.data?.results;
  if (!Array.isArray(results)) {
    throw new Error('Unexpected TMDB response format: results is not an array');
  }
  return results as TMDBMovie[];
}

export interface TMDBSearchResult {
  id: number;
  title: string;
  release_date: string;
}

export async function searchMovies(query: string): Promise<TMDBSearchResult[]> {
  const response = await axios.get(`${TMDB_BASE}/search/movie`, {
    params: {
      api_key: getApiKey(),
      language: 'en-US',
      query,
    },
  });
  const results = response.data?.results;
  if (!Array.isArray(results)) {
    throw new Error('Unexpected TMDB response format: results is not an array');
  }
  return results as TMDBSearchResult[];
}

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export async function fetchMovieCredits(movieId: string): Promise<TMDBCastMember[]> {
  const response = await axios.get(`${TMDB_BASE}/movie/${movieId}/credits`, {
    params: { api_key: getApiKey(), language: 'es-ES' },
  });
  const cast = response.data?.cast;
  if (!Array.isArray(cast)) return [];
  return cast as TMDBCastMember[];
}

export interface TMDBVideo {
  key: string;
  site: string;
  type: string;
  official: boolean;
}

export async function fetchMovieVideos(movieId: string): Promise<TMDBVideo[]> {
  const response = await axios.get(`${TMDB_BASE}/movie/${movieId}/videos`, {
    params: { api_key: getApiKey(), language: 'en-US' },
  });
  return Array.isArray(response.data?.results) ? response.data.results : [];
}
