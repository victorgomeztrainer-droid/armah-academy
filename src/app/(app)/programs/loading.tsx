export default function ProgramsLoading() {
  return (
    <div className="px-6 py-8 max-w-5xl mx-auto animate-pulse">
      <div className="h-8 w-36 bg-gray-200 rounded-xl mb-8" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="h-36 bg-gray-200" />
            <div className="p-5 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
              <div className="h-2 bg-gray-100 rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
