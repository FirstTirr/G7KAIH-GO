"use client"

import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { LayoutDashboard, Users, Calendar, BarChart3, FileText } from "lucide-react"

export function TeacherSidebar({
  activeView,
  onViewChange,
}: {
  activeView: string
  onViewChange: (v: string) => void
}) {
  const items = [
    { key: "dashboard", title: "Overview", icon: LayoutDashboard },
    { key: "students", title: "Siswa", icon: Users },
    { key: "calendar", title: "Kalender", icon: Calendar },
    { key: "statistics", title: "Statistik", icon: BarChart3 },
    { key: "reports", title: "Laporan", icon: FileText },
  ] as const

  return (
    <Sidebar collapsible="icon" className="border-r bg-white">
      <SidebarHeader>
        <SidebarGroup>
          <SidebarGroupLabel>Guru</SidebarGroupLabel>
        </SidebarGroup>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {items.map((it) => (
              <SidebarMenuItem key={it.key}>
                <SidebarMenuButton
                  isActive={activeView === it.key}
                  onClick={() => onViewChange(it.key)}
                >
                  <it.icon />
                  <span>{it.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
