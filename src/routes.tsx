import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import EventIngestion from './pages/EventIngestion';
import SellerManagement from './pages/SellerManagement';
import type { ReactNode } from 'react';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  {
    name: 'Home',
    path: '/',
    element: <LandingPage />
  },
  {
    name: 'Dashboard',
    path: '/dashboard',
    element: <Dashboard />
  },
  {
    name: 'Event Ingestion',
    path: '/events',
    element: <EventIngestion />
  },
  {
    name: 'Seller Management',
    path: '/sellers',
    element: <SellerManagement />
  }
];

export default routes;
