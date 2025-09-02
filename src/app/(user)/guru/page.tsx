
"use client"

import { TeacherDashboard } from "@/components/teacher/TeacherDashboard"
import { useRouter } from "next/navigation"

export default function Page() {
  const router = useRouter()
  return <TeacherDashboard onBack={() => router.push("/" )} />
}