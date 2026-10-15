"use client";

import { useParams } from "next/navigation";

import { RejectEnrollmentForm } from "@/components/reject-enrollment-form";

export default function AuthorRejectEnrollmentPage() {
  const params = useParams<{ enrollmentId: string }>();
  return (
    <RejectEnrollmentForm
      enrollmentId={params.enrollmentId}
      backHref="/dashboard/author/enrollments"
    />
  );
}
