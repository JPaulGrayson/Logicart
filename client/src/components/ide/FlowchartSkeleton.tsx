import { Skeleton } from '@/components/ui/skeleton';

export function FlowchartSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-background/50 backdrop-blur-sm p-8">
      <div className="max-w-3xl w-full space-y-6">
        <div className="text-center mb-8">
          <Skeleton className="h-6 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
        
        <div className="flex justify-center gap-8">
          <div className="space-y-4">
            <Skeleton className="h-16 w-48 rounded-lg" />
            <div className="flex justify-center">
              <Skeleton className="h-8 w-0.5" />
            </div>
            <Skeleton className="h-20 w-56 rounded-lg" />
            <div className="flex justify-center">
              <Skeleton className="h-8 w-0.5" />
            </div>
            <Skeleton className="h-16 w-48 rounded-lg" />
          </div>
        </div>
        
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground animate-pulse">
            Analyzing code structure...
          </p>
        </div>
      </div>
    </div>
  );
}
