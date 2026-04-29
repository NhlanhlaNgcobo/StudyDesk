"use client";

import { useParams } from "next/navigation";
import { AssessmentRunner } from "@/components/student/assessment-runner";

export default function MockExamPage() {
  const params = useParams();
  return <AssessmentRunner assessmentId={params.id as string} mode="exam" />;
}
