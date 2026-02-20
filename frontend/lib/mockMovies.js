/**
 * Deterministic mock movie generator for stress-testing the Browse grid at 500+ items.
 * Uses a seeded pseudo-random approach for reproducibility.
 */

const GENRES = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
    'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music',
    'Mystery', 'Romance', 'Science Fiction', 'Thriller', 'War', 'Western',
];

const TITLE_PREFIXES = [
    'The Last', 'Beyond', 'Shadow of', 'Rise of the', 'Fall of', 'The Secret',
    'Dark', 'Eternal', 'Lost in', 'Edge of', 'Return to', 'Whispers of',
    'The Silent', 'Broken', 'Under the', 'Chasing', 'Forgotten', 'The Final',
    'Savage', 'Frozen', 'Into the', 'Code of', 'Heart of', 'Echoes of',
    'Night of the', 'Day of the', 'Crimson', 'Golden', 'Iron', 'Project',
];

const TITLE_SUFFIXES = [
    'Dawn', 'Horizon', 'Empire', 'Legacy', 'Thunder', 'Phoenix',
    'Frontier', 'Storm', 'Redemption', 'Awakening', 'Protocol', 'Kingdom',
    'Requiem', 'Cascade', 'Obsidian', 'Nebula', 'Cipher', 'Vanguard',
    'Prophecy', 'Asylum', 'Dominion', 'Spectre', 'Paradox', 'Exodus',
    'Vendetta', 'Odyssey', 'Rapture', 'Sentinel', 'Inferno', 'Eclipse',
];

const OVERVIEWS = [
    'A gripping tale of survival against impossible odds in a world on the brink of collapse.',
    'When an ancient secret is uncovered, a reluctant hero must rise to protect everything they hold dear.',
    'In a dystopian future, a small group of rebels fights for freedom against a tyrannical regime.',
    'A heart-wrenching story of love and loss set against the backdrop of a war-torn landscape.',
    'An edge-of-your-seat thriller that follows a detective racing against time to solve a series of baffling crimes.',
    'A visually stunning adventure through uncharted territories where danger lurks at every turn.',
    'The bonds of family are tested when a dark secret from the past threatens to destroy everything.',
    'A comedic masterpiece that explores the absurdities of modern life with wit and charm.',
    'When worlds collide, unlikely allies must join forces to prevent an apocalyptic catastrophe.',
    'A mind-bending journey through time and space that challenges the very fabric of reality.',
];

// Seeded PRNG for deterministic results
function seededRandom(seed) {
    let s = seed;
    return function () {
        s = (s * 16807 + 0) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

export function generateMockMovies(count = 500) {
    const rng = seededRandom(42);
    const movies = [];

    for (let i = 0; i < count; i++) {
        const prefix = TITLE_PREFIXES[Math.floor(rng() * TITLE_PREFIXES.length)];
        const suffix = TITLE_SUFFIXES[Math.floor(rng() * TITLE_SUFFIXES.length)];

        // Pick 1-3 genres
        const genreCount = 1 + Math.floor(rng() * 3);
        const shuffled = [...GENRES].sort(() => rng() - 0.5);
        const genres = shuffled.slice(0, genreCount).join(', ');

        // Random year between 1985 and 2026
        const year = 1985 + Math.floor(rng() * 41);
        const month = 1 + Math.floor(rng() * 12);
        const day = 1 + Math.floor(rng() * 28);

        // Rating between 5.0 and 9.8
        const rating = Math.round((5.0 + rng() * 4.8) * 10) / 10;

        movies.push({
            id: i + 1,
            title: `${prefix} ${suffix}`,
            poster: null, // No real poster — the MovieCard fallback will show
            overview: OVERVIEWS[Math.floor(rng() * OVERVIEWS.length)],
            rating,
            genres,
            release_date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
            language: rng() > 0.2 ? 'en' : ['es', 'fr', 'ko', 'ja', 'de'][Math.floor(rng() * 5)],
            popularity: Math.round(rng() * 100 * 10) / 10,
        });
    }

    return movies;
}
