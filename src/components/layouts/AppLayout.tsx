import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, SidebarTrigger } from '@/components/ui/sidebar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Upload, Users, Menu, LogOut, Webhook, Filter, Shield } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ModeToggle } from '@/components/common/ModeToggle';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

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
  {
    title: 'Webhooks',
    icon: Webhook,
    path: '/webhooks',
  },
  {
    title: 'Funnels',
    icon: Filter,
    path: '/funnels',
  },
  {
    title: 'Admin Panel',
    icon: Shield,
    path: '/admin',
  },
];

function SidebarNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      toast({
        title: 'Logged out successfully',
        description: 'You have been logged out of your account.',
      });

      // Redirect to landing page
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Logout failed',
        description: error.message || 'Failed to log out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <SidebarHeader className="border-b border-sidebar-border p-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg shadow-primary/10">
            <span className="text-xl font-bold gradient-text">LA</span>
          </div>
          <div>
            <h2 className="font-bold text-lg tracking-tight">Lush Analytics</h2>
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
      <SidebarFooter className="border-t border-sidebar-border p-4 space-y-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
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
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full flex-col">
        {/* Top Navigation Bar */}
        <nav className="sticky top-0 z-50 glass border-b border-border/50">
          <div className="flex h-16 items-center gap-4 px-6">
            {/* Mobile menu */}
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                  <Sidebar collapsible="none" className="h-full">
                    <SidebarNav />
                  </Sidebar>
                </SheetContent>
              </Sheet>
            </div>

            {/* Logo/Brand */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg shadow-primary/10">
                <span className="text-lg font-bold gradient-text">LA</span>
              </div>
              <div className="hidden sm:block">
                <h2 className="font-bold text-base tracking-tight">Lush Analytics</h2>
                <p className="text-xs text-muted-foreground">Real-time Insights</p>
              </div>
            </div>

            <div className="flex-1" />
          </div>
        </nav>

        {/* Main Content Area with Sidebar */}
        <div className="flex flex-1 overflow-hidden">
          <Sidebar collapsible="none" className="hidden lg:flex border-r border-border">
            <SidebarNav />
          </Sidebar>
          <main className="flex-1 overflow-auto scrollbar-thin gradient-bg">
            <div className="animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
