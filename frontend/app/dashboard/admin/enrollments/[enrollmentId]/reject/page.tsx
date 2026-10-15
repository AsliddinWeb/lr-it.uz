"use client";

import { useParams } from "next/navigation";

import { RejectEnrollmentForm } from "@/components/reject-enrollment-form";

export default function AdminRejectEnrollmentPage() {
  const params = useParams<{ enrollmentId: string }>();
  return (
    <RejectEnrollmentForm
      enrollmentId={params.enrollmentId}
      backHref="/dashboard/admin/enrollments"
    />
  );
}
