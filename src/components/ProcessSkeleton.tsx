import { Skeleton } from '@/components/ui/skeleton';

export const ProcessSkeleton = () => (
  <div className="flex items-center gap-3 p-3 animate-pulse">
    <Skeleton className="h-10 w-10 rounded" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4 rounded" />
      <div className="flex gap-4">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-3 w-24 rounded" />
      </div>
    </div>
    <Skeleton className="h-8 w-8 rounded" />
  </div>
);

export const ProcessSkeletonList = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, i) => (
      <ProcessSkeleton key={i} />
    ))}
  </div>
);

