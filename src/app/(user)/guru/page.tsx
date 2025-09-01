
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { TeacherDashboard } from "@/components/teacher/TeacherDashboard"

export default function Page() {
  const router = useRouter()
  return <TeacherDashboard onBack={() => router.push("/" )} />
}