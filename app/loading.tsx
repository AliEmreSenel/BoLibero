import {
  PageHeaderSkeleton,
  SearchFiltersSkeleton,
  RoomGridSkeleton,
} from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="h-16 border-b bg-background" /> {/* Navbar placeholder */}
      <main className="flex-1">
        <div className="container mx-auto p-6 max-w-7xl">
          <PageHeaderSkeleton />
          <SearchFiltersSkeleton />
          <RoomGridSkeleton count={9} />
        </div>
      </main>
      <div className="h-24 border-t bg-background" /> {/* Footer placeholder */}
    </div>
  );
}
