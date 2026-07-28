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
import { useTranslations } from 'next-intl';

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
  ],

  member: [
    {
      title: "Overview",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
        { title: "Alerts", url: "/dashboard/alerts", icon: Bell }
      ]
    },
    {
      title: "My Learning",
      items: [
        { title: "My Courses", url: "/dashboard/courses", icon: GraduationCap },
        { title: "My Certificates", url: "/dashboard/certificates", icon: Award }
      ]
    }
  ],

  public_user: [
    {
      title: "Overview",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
        { title: "Alerts", url: "/dashboard/alerts", icon: Bell }
      ]
    },
    {
      title: "My Learning",
      items: [
        { title: "My Courses", url: "/dashboard/courses", icon: GraduationCap },
        { title: "My Certificates", url: "/dashboard/certificates", icon: Award }
      ]
    },
    {
      title: "Security Tools",
      items: [
        { title: "Phishing Test", url: "/dashboard/tools/phishing", icon: ShieldAlert },
        { title: "Password Check", url: "/dashboard/tools/password-strength", icon: Shield }
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
  const t = useTranslations('sidebar');
  const tCommon = useTranslations('common');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);
  const [openState, setOpenState] = React.useState<Record<string, boolean>>({});
  
  const handleLogout = () => setIsLogoutModalOpen(true);
  const confirmLogout = () => {
    logout();
    setIsLogoutModalOpen(false);
  };
  
  const toCamel = (str: string) => str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
    return index === 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '');

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
            <SidebarMenuButton size="lg" render={<Link href={homeUrl} />} className="group/logo">
              <div className="flex items-center gap-3 w-full overflow-hidden">
                <div className="flex aspect-square size-8 items-center justify-center group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:shrink-0!">
                  <img src="/logo.png" alt="INSA" className="h-8 w-8 object-contain" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none transition-opacity group-data-[collapsible=icon]:hidden">
                  <span className="font-semibold text-base">INSA Awareness</span>
                  <span className="text-xs text-muted-foreground">{portalName}</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />
      
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="group-data-[collapsible=icon]:opacity-0">{(t as any)(toCamel(group.title)) || group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  const isActive = pathname === item.url || (item.url !== "/admin" && item.url !== "/dashboard" && pathname?.startsWith(item.url));

                  if (hasSubItems) {
                    return (
                      <Collapsible
                        key={item.title}
                        open={openState[item.title] ?? isMenuExpanded(item.url, item.subItems)}
                        onOpenChange={(open) => setOpenState(prev => ({ ...prev, [item.title]: open }))}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger render={<SidebarMenuButton tooltip={(t as any)(toCamel(item.title)) || item.title} isActive={isActive} />}>
                            <item.icon className="size-4 shrink-0" />
                            <span>{(t as any)(toCamel(item.title)) || item.title}</span>
                            <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
                            <SidebarMenuSub>
                              {item.subItems!.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton isActive={pathname === subItem.url} render={<Link href={subItem.url} />}>
                                    <span>{(t as any)(toCamel(subItem.title)) || subItem.title}</span>
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
                      <SidebarMenuButton isActive={isActive} tooltip={(t as any)(toCamel(item.title)) || item.title} render={<Link href={item.url} />}>
                        <item.icon className="size-4 shrink-0" />
                        <span>{(t as any)(toCamel(item.title)) || item.title}</span>
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
            <SidebarMenuButton tooltip={t('settings')} render={<Link href="/profile" />}>
              <Settings className="size-4 shrink-0" />
              <span>{t('settings')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={t('notifications')} render={<Link href="/notifications" />}>
              <Bell className="size-4 shrink-0" />
              <span>{t('notifications')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip={t('logout')} className="flex items-center gap-3 w-full text-red-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors duration-200">
              <LogOut className="size-4 shrink-0" />
              <span>{t('logout')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmLogout}
        title={t('logout')}
        message={tCommon('logoutConfirm')}
        confirmText={t('logout')}
        variant="danger"
      />
    </Sidebar>
  )
}
