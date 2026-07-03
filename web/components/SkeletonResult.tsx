export function SkeletonResult() {
  return (
    <div aria-busy="true" aria-label="Loading price estimate" className="animate-pulse space-y-4">
      <div className="h-5 w-40 rounded-full bg-gray-200" />
      <div className="h-40 rounded-2xl bg-gray-100" />
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl bg-gray-100 p-4 space-y-2">
            <div className="h-3 w-12 rounded-full bg-gray-200" />
            <div className="h-6 w-24 rounded-full bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
