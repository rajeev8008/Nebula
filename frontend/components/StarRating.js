'use client';
import { useState } from 'react';
import { Star, StarHalf } from 'lucide-react';

export default function StarRating({ rating = 0, onRate, size = 20, interactive = true }) {
    const [hoverRating, setHoverRating] = useState(null);
    const displayRating = hoverRating !== null ? hoverRating : rating;

    const stars = [];
    for (let i = 1; i <= 5; i++) {
        const isFull = displayRating >= i;
        const isHalf = !isFull && displayRating >= i - 0.5;

        stars.push(
            <div
                key={i}
                style={{
                    position: 'relative',
                    cursor: interactive ? 'pointer' : 'default',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2px'
                }}
                onMouseMove={(e) => {
                    if (!interactive) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    if (x < rect.width / 2) {
                        setHoverRating(i - 0.5);
                    } else {
                        setHoverRating(i);
                    }
                }}
                onMouseLeave={() => setHoverRating(null)}
                onClick={() => {
                    if (interactive && onRate) {
                        onRate(hoverRating);
                    }
                }}
            >
                <Star
                    size={size}
                    fill={isFull ? "#fbbf24" : "none"}
                    stroke={isFull || isHalf ? "#fbbf24" : "rgba(255,255,255,0.2)"}
                    style={{ opacity: isFull || isHalf ? 1 : 0.5, transition: 'all 0.1s' }}
                />
                {isHalf && (
                    <div style={{ position: 'absolute', left: '2px', top: '2px', width: '50%', overflow: 'hidden' }}>
                        <Star
                            size={size}
                            fill="#fbbf24"
                            stroke="#fbbf24"
                        />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {stars}
            {displayRating > 0 && (
                <span style={{ marginLeft: '8px', fontSize: '13px', fontWeight: 700, color: '#fbbf24' }}>
                    {displayRating.toFixed(1)}
                </span>
            )}
        </div>
    );
}
