import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter } from '@/components/ui/sidebar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Upload, Users, Menu, Activity } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { ModeToggle } from '@/components/common/ModeToggle';

interface AppLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/',
  },
  {
    title: 'Event Ingestion',
    icon: Upload,
    path: '/events',
  },
  {
    title: 'Sellers',
    icon: Users,
    path: '/sellers',
  },
];

function SidebarNav() {
  const location = useLocation();

  return (
    <>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary rounded-lg">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Analytics API</h2>
            <p className="text-xs text-muted-foreground">E-commerce Insights</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.path}
                  >
                    <Link to={item.path}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">© 2026 Analytics API</p>
          <ModeToggle />
        </div>
      </SidebarFooter>
    </>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="hidden lg:block">
          <SidebarNav />
        </Sidebar>

        <div className="lg:hidden fixed top-4 left-4 z-50">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <Sidebar>
                <SidebarNav />
              </Sidebar>
            </SheetContent>
          </Sheet>
        </div>

        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
