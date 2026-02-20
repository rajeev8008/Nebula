/**
 * Nebula API client
 * Connects the Next.js frontend to the FastAPI + Pinecone backend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Fetch movies from the backend with optional search, filters, and pagination.
 *
 * @param {Object} params
 * @param {string} [params.q]       - Search query text
 * @param {string} [params.genre]   - Genre filter (e.g., "Action")
 * @param {string} [params.decade]  - Decade filter (e.g., "2020s")
 * @param {number} [params.rating]  - Minimum rating filter
 * @param {number} [params.page]    - Page number (1-indexed)
 * @param {number} [params.limit]   - Results per page (default 20)
 * @returns {Promise<{movies: Array, total: number, page: number, hasMore: boolean}>}
 */
export async function fetchMovies({ q = '', genre, decade, rating, page = 1, limit = 20 } = {}) {
    const url = new URL(`${API_BASE}/api/search`);

    if (q) url.searchParams.set('q', q);
    if (genre) url.searchParams.set('genre', genre);
    if (decade) url.searchParams.set('decade', decade);
    if (rating) url.searchParams.set('rating', String(rating));
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', String(limit));

    const res = await fetch(url.toString());

    if (!res.ok) {
        const detail = await res.text();
        throw new Error(`API error ${res.status}: ${detail}`);
    }

    return res.json();
}
