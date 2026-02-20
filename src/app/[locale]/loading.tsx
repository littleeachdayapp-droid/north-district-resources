export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-primary-200 rounded w-1/3" />
        <div className="h-10 bg-primary-100 rounded w-full" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-primary-200 p-4 space-y-3">
              <div className="flex justify-between">
                <div className="h-5 bg-primary-100 rounded w-16" />
                <div className="h-5 bg-primary-100 rounded w-20" />
              </div>
              <div className="h-6 bg-primary-200 rounded w-3/4" />
              <div className="h-4 bg-primary-100 rounded w-1/2" />
              <div className="h-4 bg-primary-100 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
