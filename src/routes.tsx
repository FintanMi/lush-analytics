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
    name: 'Dashboard',
    path: '/',
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
