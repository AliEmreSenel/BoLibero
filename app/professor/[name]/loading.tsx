import {
  DetailHeaderSkeleton,
  CalendarViewSkeleton,
} from "@/components/skeletons";

export default function ProfessorLoading() {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-3 py-5 sm:px-6">
      <DetailHeaderSkeleton />
      <CalendarViewSkeleton />
    </div>
  );
}
