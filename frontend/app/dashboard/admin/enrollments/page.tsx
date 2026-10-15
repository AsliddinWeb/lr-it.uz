import { EnrollmentReviewList } from "@/components/enrollment-review-list";

export default function AdminEnrollmentsPage() {
  return (
    <main className="min-h-screen bg-bg px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl font-bold text-text-primary">
          So'rovlar (global)
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Barcha kurslarga tushgan so'rovlar shu yerda ko&apos;rinadi.
        </p>
        <div className="mt-8">
          <EnrollmentReviewList />
        </div>
      </div>
    </main>
  );
}
