'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Inbox, SendHorizonal, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter, // Import SidebarFooter
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/inbox', label: 'Inbox', icon: Inbox },
  { href: '/compose', label: 'Compose', icon: SendHorizonal },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { toggleSidebar, open } = useSidebar();
  const { theme, resolvedTheme } = useTheme();
  const currentTheme = resolvedTheme || theme;

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r">
      <SidebarHeader
        className={cn(
          "p-2 flex items-center",
          open ? "justify-start" : "justify-center" // Adjusted justification
        )}
      >
        {/* Logo/Title Part */}
        <div className={cn("flex items-center gap-2", open ? "" : "group-data-[collapsible=icon]:hidden")}>
          <Link
            href="/inbox"
            className="flex items-center gap-2 text-lg font-semibold text-foreground hover:text-primary transition-colors"
            aria-label="MuninMail Home"
          >
            <img 
              src={currentTheme === 'dark' ? '/logo-white.png' : '/logo.png'}
              alt="MuninMail Logo" 
              width={24} 
              height={24} 
              className="h-6 w-6"
            />
            <span className="group-data-[collapsible=icon]:hidden transition-opacity duration-200">
              MuninMail
            </span>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href || (item.href === '/inbox' && pathname.startsWith('/inbox/'))}
                tooltip={{ children: item.label, className: "bg-card text-card-foreground border-border" }}
                className={cn(
                  "justify-start",
                  (pathname === item.href || (item.href === '/inbox' && pathname.startsWith('/inbox/')))
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Link href={item.href}>
                  <item.icon className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden transition-opacity duration-200">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 mt-auto border-t"> {/* Added mt-auto to push footer to bottom if content is short, and border-t */}
        <Button
          variant="ghost"
          onClick={toggleSidebar}
          className="w-full flex justify-center items-center h-10 hidden md:flex" // Ensure it's visible on desktop
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
        >
          {open ? (
            <>
              <PanelLeftClose className="h-5 w-5" />
              <span className="ml-2 group-data-[collapsible=icon]:hidden">Collapse</span>
            </>
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
