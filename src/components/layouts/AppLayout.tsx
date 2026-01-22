import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, SidebarTrigger } from '@/components/ui/sidebar';
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
    path: '/dashboard',
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
      <SidebarHeader className="border-b border-sidebar-border p-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg shadow-primary/10">
            <span className="text-xl font-bold gradient-text">LA</span>
          </div>
          <div>
            <h2 className="font-bold text-lg tracking-tight">Lush Analytics</h2>
            <p className="text-xs text-muted-foreground">Real-time Insights</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.path}
                    className="rounded-lg transition-all duration-200"
                  >
                    <Link to={item.path}>
                      <item.icon className="h-4 w-4" />
                      <span className="font-medium">{item.title}</span>
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
          <p className="text-xs text-muted-foreground">© 2026 Lush Analytics</p>
          <ModeToggle />
        </div>
      </SidebarFooter>
    </>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full gradient-bg">
        <Sidebar collapsible="icon" className="hidden lg:flex border-r border-border">
          <SidebarNav />
        </Sidebar>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="sticky top-0 z-40 glass border-b border-border/50">
            <div className="flex h-16 items-center gap-4 px-6">
              {/* Desktop sidebar trigger - uses enhanced toggle functionality */}
              <SidebarTrigger className="hidden lg:flex" />

              {/* Mobile menu */}
              <div className="lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
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

              <div className="flex-1" />
              <ModeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-auto scrollbar-thin">
            <div className="animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
