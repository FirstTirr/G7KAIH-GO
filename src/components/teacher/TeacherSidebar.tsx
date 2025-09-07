"use client"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import LogoutButton from "@/components/ui/logoutButton"
import { FileText, Users } from "lucide-react"

export function TeacherSidebar({
  activeView,
  onViewChange,
}: {
  activeView: string
  onViewChange: (v: string) => void
}) {
  const items = [
    { key: "students", title: "Siswa", icon: Users },
    { key: "reports", title: "Laporan", icon: FileText },
  ] as const

  return (
    <Sidebar collapsible="icon" className="border-r bg-white">
      <SidebarHeader>
        <SidebarGroup>
          <SidebarGroupLabel>Panel</SidebarGroupLabel>
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
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="p-2">
              <LogoutButton />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
