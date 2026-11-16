import {
  PageHeaderSkeleton,
  SearchFiltersSkeleton,
  RoomGridSkeleton,
} from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="min-h-dvh flex flex-col">
      <div className="h-[60px] border-b bg-card" /> {/* Navbar placeholder */}
      <main id="main" className="flex-1">
        <div className="mx-auto w-full max-w-[1240px] px-3 py-5 sm:px-6">
          <PageHeaderSkeleton />
          <SearchFiltersSkeleton />
          <RoomGridSkeleton count={9} />
        </div>
      </main>
      <div className="h-16 border-t bg-card" /> {/* Footer placeholder */}
    </div>
  );
}
