import {
  DetailHeaderSkeleton,
  CalendarViewSkeleton,
} from "@/components/skeletons";

export default function ProfessorLoading() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <DetailHeaderSkeleton />
      <CalendarViewSkeleton />
    </div>
  );
}
