'use client';

import * as React from "react"
import {
  LayoutDashboard,
  Users,
  Building2,
  GraduationCap,
  FileCheck,
  Award,
  BarChart,
  Megaphone,
  Bell,
  Settings,
  LogOut,
  ShieldAlert,
  ChevronRight,
  BookOpen,
  FileText,
  CreditCard,
  Video,
  Shield,
  Activity,
  ClipboardList
} from "lucide-react"
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ConfirmModal } from '@/components/ConfirmModal';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

// ────────────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────────────

type SubMenuItem = {
  title: string;
  url: string;
};

type MenuItem = {
  title: string;
  url: string;
  icon: React.ElementType;
  subItems?: SubMenuItem[];
};

type MenuGroup = {
  title: string;
  items: MenuItem[];
};

type SidebarConfig = Record<string, MenuGroup[]>;

// ────────────────────────────────────────────────────────────────────────
// ROLE-BASED SIDEBAR CONFIGURATION
// ────────────────────────────────────────────────────────────────────────

const sidebarConfig: SidebarConfig = {
  super_admin: [
    {
      title: "Overview",
      items: [
        { title: "Dashboard", url: "/admin", icon: LayoutDashboard }
      ]
    },
    {
      title: "Management",
      items: [
        { 
          title: "Users", 
          url: "/admin/users", 
          icon: Users,
          subItems: [
            { title: "All Users", url: "/admin/users" },
            { title: "Organization Members", url: "/admin/memberships" },
          ]
        },
        { 
          title: "Organizations", 
          url: "/admin/organizations", 
          icon: Building2,
          subItems: [
            { title: "All Organizations", url: "/admin/organizations" },
            { title: "Org Applications", url: "/admin/organization-applications" },
            { title: "Payment Approvals", url: "/admin/payment-approvals" },
            { title: "Training Requests", url: "/admin/training-requests" },
          ]
        },
      ]
    },
    {
      title: "Learning Content",
      items: [
        { 
          title: "Courses", 
          url: "/admin/courses", 
          icon: GraduationCap,
          subItems: [
            { title: "All Courses", url: "/admin/courses" },
            { title: "Modules", url: "/admin/modules" },
            { title: "Lessons", url: "/admin/lessons" },
            { title: "Videos", url: "/admin/videos" },
            { title: "Assessments", url: "/admin/assessments" },
          ]
        },
        { 
          title: "Resources", 
          url: "/admin/resources", 
          icon: BookOpen,
          subItems: [
            { title: "All Resources", url: "/admin/resources" },
            { title: "Articles", url: "/admin/articles" },
          ]
        },
        { title: "Certificates", url: "/certificates", icon: Award },
      ]
    },
    {
      title: "System Operations",
      items: [
        { 
          title: "Communications", 
          url: "/admin/campaigns", 
          icon: Megaphone,
          subItems: [
            { title: "Campaigns", url: "/admin/campaigns" },
            { title: "Alerts", url: "/admin/alerts" },
          ]
        },
        { title: "Reports", url: "/admin/reports", icon: BarChart },
        { title: "Audit Logs", url: "/admin/audit-logs", icon: Shield },
        { title: "Awareness Tools", url: "/admin/awareness-tools", icon: ShieldAlert }
      ]
    }
  ],

  org_admin: [
    {
      title: "Overview",
      items: [
        { title: "Dashboard", url: "/admin", icon: LayoutDashboard }
      ]
    },
    {
      title: "My Organization",
      items: [
        { 
          title: "Users", 
          url: "/admin/users", 
          icon: Users,
          subItems: [
            { title: "All Users", url: "/admin/users" },
            { title: "Members", url: "/admin/memberships" },
          ]
        },
        { title: "Training Requests", url: "/admin/training-requests", icon: ClipboardList },
      ]
    },
    {
      title: "Learning & Compliance",
      items: [
        { title: "Courses", url: "/admin/courses", icon: GraduationCap },
        { title: "Reports", url: "/admin/reports", icon: BarChart },
        { title: "Campaigns", url: "/admin/campaigns", icon: Megaphone },
        { title: "Certificates", url: "/certificates", icon: Award },
      ]
    }
  ],

  course_provider: [
    {
      title: "Overview",
      items: [
        { title: "Dashboard", url: "/admin", icon: LayoutDashboard }
      ]
    },
    {
      title: "Content Management",
      items: [
        { 
          title: "My Courses", 
          url: "/admin/courses", 
          icon: GraduationCap,
          subItems: [
            { title: "Course List", url: "/admin/courses" },
            { title: "Modules", url: "/admin/modules" },
            { title: "Lessons", url: "/admin/lessons" },
            { title: "Videos", url: "/admin/videos" },
            { title: "Assessments", url: "/admin/assessments" },
          ]
        },
        { 
          title: "My Resources", 
          url: "/admin/resources", 
          icon: BookOpen,
          subItems: [
            { title: "Files & Documents", url: "/admin/resources" },
            { title: "Articles", url: "/admin/articles" },
          ]
        },
      ]
    },
    {
      title: "Insights",
      items: [
        { title: "Certificates Issued", url: "/certificates", icon: Award },
      ]
    }
  ],

  org_member: [
    {
      title: "Overview",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }
      ]
    },
    {
      title: "My Learning",
      items: [
        { title: "My Courses", url: "/courses/enrolled", icon: GraduationCap },
        { title: "Full Catalog", url: "/courses", icon: BookOpen },
        { title: "My Certificates", url: "/certificates", icon: Award }
      ]
    },
    {
      title: "Security Tools",
      items: [
        { title: "Phishing Test", url: "/tools/phishing", icon: ShieldAlert },
        { title: "Password Check", url: "/tools/password-strength", icon: Shield }
      ]
    },
    {
      title: "Support",
      items: [
        { title: "Training Requests", url: "/dashboard", icon: ClipboardList }
      ]
    }
  ],

  public_user: [
    {
      title: "Overview",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }
      ]
    },
    {
      title: "My Learning",
      items: [
        { title: "My Courses", url: "/courses/enrolled", icon: GraduationCap },
        { title: "Full Catalog", url: "/courses", icon: BookOpen },
        { title: "My Certificates", url: "/certificates", icon: Award }
      ]
    },
    {
      title: "Security Tools",
      items: [
        { title: "Phishing Test", url: "/tools/phishing", icon: ShieldAlert },
        { title: "Password Check", url: "/tools/password-strength", icon: Shield }
      ]
    }
  ]
};

// ────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);
  
  const handleLogout = () => setIsLogoutModalOpen(true);
  const confirmLogout = () => {
    logout();
    setIsLogoutModalOpen(false);
  };
  
  // Default to empty array if role is not recognized or user is loading
  const userRole = user?.role || "";
  const navGroups = sidebarConfig[userRole] || [];

  const isAdminRole = ["super_admin", "org_admin", "course_provider"].includes(userRole);
  const homeUrl = isAdminRole ? "/admin" : "/dashboard";
  const portalName = isAdminRole ? "Admin Portal" : "Learner Portal";

  // Helper to determine if a menu should be expanded by default
  const isMenuExpanded = (itemUrl: string, subItems?: SubMenuItem[]) => {
    if (pathname === itemUrl) return true;
    if (subItems?.some(sub => pathname?.startsWith(sub.url))) return true;
    return false;
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="group/logo">
              <Link href={homeUrl} className="flex items-center gap-3 w-full overflow-hidden">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:shrink-0!">
                  <ShieldAlert className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none transition-opacity group-data-[collapsible=icon]:hidden">
                  <span className="font-semibold text-base">CyberSafe</span>
                  <span className="text-xs text-muted-foreground">{portalName}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />
      
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="group-data-[collapsible=icon]:opacity-0">{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  const isActive = pathname === item.url || (item.url !== "/admin" && item.url !== "/dashboard" && pathname?.startsWith(item.url));

                  if (hasSubItems) {
                    return (
                      <Collapsible
                        key={item.title}
                        asChild
                        defaultOpen={isMenuExpanded(item.url, item.subItems)}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip={item.title} isActive={isActive} className="flex items-center gap-3 w-full">
                              <item.icon className="size-4 shrink-0" />
                              <span>{item.title}</span>
                              <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
                            <SidebarMenuSub>
                              {item.subItems!.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                                    <Link href={subItem.url} className="flex items-center gap-2 w-full">
                                      <span>{subItem.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  // No sub-items
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                        <Link href={item.url} className="flex items-center gap-3 w-full">
                          <item.icon className="size-4 shrink-0" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      
      <SidebarSeparator />
      
      <SidebarFooter className="py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link href="/profile" className="flex items-center gap-3 w-full">
                <Settings className="size-4 shrink-0" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Notifications">
              <Link href="/notifications" className="flex items-center gap-3 w-full">
                <Bell className="size-4 shrink-0" />
                <span>Notifications</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Log out" className="flex items-center gap-3 w-full text-red-500 hover:text-red-600 hover:bg-red-50">
              <LogOut className="size-4 shrink-0" />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmLogout}
        title="Log Out"
        message="Are you sure you want to log out of your account?"
        confirmText="Log Out"
        variant="danger"
      />
    </Sidebar>
  )
}
