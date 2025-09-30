"use client"

import { TeacherSidebar } from "@/components/teacher/TeacherSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import * as React from "react"

export default function GuruLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Determine active view based on pathname
  const getActiveView = () => {
    if (pathname.includes('/siswa')) return 'students'
    if (pathname.includes('/wali-kelas')) return 'walikelas'
    if (pathname.includes('/laporan')) return 'reports'
    return 'students'
  }

  const [activeView, setActiveView] = React.useState(getActiveView())

  React.useEffect(() => {
    setActiveView(getActiveView())
  }, [pathname])

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <TeacherSidebar activeView={activeView} onViewChange={setActiveView} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
