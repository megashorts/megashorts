export default function GridPostsSkeleton() {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div 
            key={i} 
            className="relative w-full aspect-[2/3] rounded-md overflow-hidden bg-gray-200 animate-pulse"
          />
        ))}
      </div>
    );
  }