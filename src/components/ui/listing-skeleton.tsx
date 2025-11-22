import { Skeleton } from "@/components/ui/skeleton";

export function ListingSkeleton() {
  return (
    <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
      {/* Image skeleton */}
      <Skeleton className="aspect-[4/3] w-full" />
      
      {/* Content skeleton */}
      <div className="p-3 md:p-4 space-y-2">
        {/* Title skeleton */}
        <Skeleton className="h-4 md:h-5 w-3/4" />
        
        {/* Location skeleton */}
        <Skeleton className="h-3 md:h-4 w-1/2" />
        
        {/* Date/Info skeleton */}
        <Skeleton className="h-3 md:h-4 w-2/3" />
        
        {/* Price skeleton */}
        <Skeleton className="h-5 md:h-6 w-1/3 mt-2" />
      </div>
    </div>
  );
}
