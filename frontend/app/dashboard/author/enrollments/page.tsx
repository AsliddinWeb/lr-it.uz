import { EnrollmentReviewList } from "@/components/enrollment-review-list";

export default function AuthorEnrollmentsPage() {
  return (
    <main className="min-h-screen bg-bg px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl font-bold text-text-primary">So'rovlar</h1>
        <p className="mt-1 text-sm text-text-muted">
          Kurslaringizga tushgan so'rovlarni shu yerda ko&apos;rib chiqasiz.
        </p>
        <div className="mt-8">
          <EnrollmentReviewList />
        </div>
      </div>
    </main>
  );
}
