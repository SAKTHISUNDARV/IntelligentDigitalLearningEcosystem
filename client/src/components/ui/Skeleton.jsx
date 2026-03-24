// components/ui/Skeleton.jsx — Skeleton placeholder loaders
export function Skeleton({ className = '' }) {
    return <div className={`skeleton ${className}`} />;
}

export function SkeletonCard() {
    return (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2.5 w-1/2" />
                </div>
            </div>
            <Skeleton className="h-2.5 w-full" />
            <Skeleton className="h-2.5 w-5/6" />
            <div className="flex gap-2 pt-1">
                <Skeleton className="h-6 w-16 rounded-lg" />
                <Skeleton className="h-6 w-20 rounded-lg" />
            </div>
        </div>
    );
}

export function SkeletonRow() {
    return (
        <div className="flex items-center gap-4 px-4 py-3.5 border-b border-[var(--border)]">
            <Skeleton className="w-8 h-8 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-2.5 w-28" />
            </div>
            <Skeleton className="h-6 w-16 rounded-lg" />
            <Skeleton className="h-6 w-16 rounded-lg" />
        </div>
    );
}

export function SkeletonStat() {
    return (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
            <Skeleton className="h-2.5 w-20 mb-3" />
            <Skeleton className="h-7 w-16 mb-2" />
            <Skeleton className="h-2.5 w-28" />
        </div>
    );
}
