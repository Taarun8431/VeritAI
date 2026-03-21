export function SkeletonGroup({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="verit-card p-5 mb-4 flex gap-5 w-full relative overflow-hidden">
          <div className="flex-1 space-y-4">
            <div className="flex gap-2">
              <div className="h-4 w-16 bg-elevated rounded-full shimmer-bg" />
              <div className="h-4 w-20 bg-elevated rounded-full shimmer-bg" />
            </div>
            <div className="space-y-2">
               <div className="h-4 bg-elevated rounded w-full shimmer-bg" />
               <div className="h-4 bg-elevated rounded w-5/6 shimmer-bg" />
            </div>
            <div className="flex gap-2 pt-2">
               <div className="h-6 w-24 bg-elevated rounded-full shimmer-bg" />
               <div className="h-6 w-24 bg-elevated rounded-full shimmer-bg" />
            </div>
          </div>
          <div className="w-[60px] h-[60px] rounded-full bg-elevated flex-shrink-0 self-center border border-border shimmer-bg" />
        </div>
      ))}
    </>
  );
}
