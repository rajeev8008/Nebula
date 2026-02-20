'use client';

import { cn } from '@/lib/utils';

/**
 * Generic skeleton pulse block.
 * Usage: <Skeleton className="w-32 h-4" />
 */
export function Skeleton({ className, ...props }) {
    return (
        <div
            className={cn(
                'animate-pulse rounded-md bg-white/[0.06]',
                className
            )}
            {...props}
        />
    );
}

/**
 * MovieCardSkeleton — matches the exact 192×288px MovieCard dimensions.
 * Shows pulsing placeholders for poster, title, rating, and genre chips.
 */
export function MovieCardSkeleton() {
    return (
        <div
            style={{
                width: '192px',
                height: '288px',
                flexShrink: 0,
                borderRadius: '12px',
                overflow: 'hidden',
            }}
            className="relative bg-white/[0.03] border border-white/[0.06]"
        >
            {/* Poster area */}
            <Skeleton className="w-full h-[200px] rounded-none" />

            {/* Content area */}
            <div className="p-3 space-y-2.5">
                {/* Title line */}
                <Skeleton className="h-3.5 w-[75%] rounded-sm" />

                {/* Rating row */}
                <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-3 w-8 rounded-sm" />
                </div>

                {/* Genre chips */}
                <div className="flex gap-1.5">
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                </div>
            </div>

            {/* Shimmer sweep overlay */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)',
                    animation: 'shimmerSweep 2s ease-in-out infinite',
                }}
            />
        </div>
    );
}

/**
 * SkeletonSection — renders a full skeleton section with heading + row of cards.
 */
export function SkeletonSection({ cardCount = 8 }) {
    return (
        <div style={{ marginBottom: '48px' }}>
            {/* Section heading skeleton */}
            <div style={{ paddingLeft: '24px', paddingRight: '24px', marginBottom: '20px' }}>
                <Skeleton className="h-7 w-48 rounded-md" />
            </div>

            {/* Card row */}
            <div
                style={{
                    display: 'flex',
                    gap: '16px',
                    paddingLeft: '24px',
                    paddingRight: '24px',
                    overflow: 'hidden',
                }}
            >
                {Array.from({ length: cardCount }).map((_, i) => (
                    <MovieCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}
