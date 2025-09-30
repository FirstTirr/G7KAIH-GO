"use client"

import { GuruWaliStudentDetails } from "@/components/guruwali/GuruWaliStudentDetails"
import * as React from "react"

export default function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params)
  
  return <GuruWaliStudentDetails studentId={resolvedParams.id} />
}
