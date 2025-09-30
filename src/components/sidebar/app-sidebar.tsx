"use client"

import { Activity, BarChart3, ChevronDown, GraduationCap, Home, ListTodo, Settings, Upload, User, UserCheck, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"

import { createClient } from "@/utils/supabase/client"
import LogoutButton from "@/components/ui/logoutButton"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar"

const navigationItems = [
  {
    title: "User Management",
    url: "/dashboard",
    icon: Users,
    description: "Kelola akun pengguna",
    color: "bg-green-500"
  },
  {
    title: "Import Users",
    url: "/dashboard/import-users",
    icon: Upload,
    description: "Import CSV & bulk create",
    color: "bg-purple-500"
  },
  {
    title: "Activities",
    url: "/dashboard/aktivitas",
    icon: Activity,
    description: "Monitor student activities",
    color: "bg-orange-500"
  },
  {
    title: "Kegiatan",
    url: "/dashboard/kegiatan",
    icon: ListTodo,
    description: "Manage tasks & assignments",
    color: "bg-indigo-500"
  },
  {
    title: "Teacher Roles",
    url: "/dashboard/admin/teacher-roles",
    icon: GraduationCap,
    description: "Assign teacher permissions",
    color: "bg-teal-500"
  },
  {
    title: "Parent-Student",
    url: "/dashboard/admin/parent-student",
    icon: UserCheck,
    description: "Link parents to students",
    color: "bg-pink-500"
  },
  {
    title: "Guru Wali",
    url: "/dashboard/admin/guruwali-siswa",
    icon: Settings,
    description: "Homeroom teacher setup",
    color: "bg-amber-500"
  }
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const [showLogout, setShowLogout] = React.useState(false)
  const [userProfile, setUserProfile] = React.useState<{
    username: string | null
    email: string | null
    roleid: number | null
  } | null>(null)

  React.useEffect(() => {
    const fetchUserData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // Get user profile
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('username, roleid')
            .eq('userid', user.id)
            .single()
          
          setUserProfile({
            username: profile?.username || null,
            email: user.email || null,
            roleid: profile?.roleid || null
          })
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
    }

    fetchUserData()
  }, [])

  const getRoleName = (roleId: number | null) => {
    switch (roleId) {
      case 1: return "Unknown"
      case 2: return "Teacher"
      case 3: return "Admin"
      case 4: return "Parent"
      case 5: return "Student"
      case 6: return "Guru Wali"
      default: return "Unknown"
    }
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-4 py-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-data-[collapsible=icon]:mx-auto">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <h2 className="text-xl font-bold text-gray-900">G7KAIH</h2>
            <p className="text-sm text-gray-500">Admin Dashboard</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="bg-gray-50/30">
        <div className="px-4 space-y-2 group-data-[collapsible=icon]:px-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.url
            
            return (
              <Link
                key={item.url}
                href={item.url}
                className={`group flex items-start gap-4 rounded-xl p-4 transition-all duration-200 hover:shadow-md group-data-[collapsible=icon]:p-3 group-data-[collapsible=icon]:justify-center relative ${
                  isActive 
                    ? 'bg-white shadow-lg ring-1 ring-gray-100 scale-[1.02]' 
                    : 'hover:bg-white/80'
                }`}
                title={item.title}
              >
                <div className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8`}>
                  <Icon className="h-5 w-5 text-white group-data-[collapsible=icon]:h-4 group-data-[collapsible=icon]:w-4" />
                </div>
                <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                  <h3 className={`text-sm font-semibold truncate ${isActive ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'}`}>
                    {item.title}
                  </h3>
                  <p className={`text-xs truncate mt-0.5 ${isActive ? 'text-gray-600' : 'text-gray-500'}`}>
                    {item.description}
                  </p>
                </div>
                {isActive && (
                  <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full group-data-[collapsible=icon]:hidden" />
                )}
                {/* Active indicator for collapsed state */}
                {isActive && (
                  <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full hidden group-data-[collapsible=icon]:block" />
                )}
              </Link>
            )
          })}
        </div>
        
        {/* User Account Section */}
        <div className="px-4 mt-8 group-data-[collapsible=icon]:hidden">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-100 overflow-hidden">
            <button
              onClick={() => setShowLogout(!showLogout)}
              className="w-full p-4 text-left hover:bg-white/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    {userProfile?.username || 'Loading...'}
                  </h4>
                  <p className="text-xs text-gray-600 truncate">
                    {getRoleName(userProfile?.roleid || null)}
                  </p>
                  {userProfile?.email && (
                    <p className="text-xs text-gray-500 truncate">
                      {userProfile.email}
                    </p>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showLogout ? 'rotate-180' : ''}`} />
              </div>
            </button>
            
            {showLogout && (
              <div className="px-4 pb-4 pt-0">
                <div className="border-t border-gray-200 pt-3">
                  <LogoutButton />
                </div>
              </div>
            )}
          </div>
        </div>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="px-4 py-4 group-data-[collapsible=icon]:px-2">
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <div className="hidden group-data-[collapsible=icon]:block">
              <LogoutButton />
            </div>
            <div className="text-xs text-gray-500 text-center group-data-[collapsible=icon]:hidden">
              © 2025 G7KAIH
            </div>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
