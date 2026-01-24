import { lazy } from 'react';
import type { ReactNode } from 'react';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const EventIngestion = lazy(() => import('./pages/EventIngestion'));
const SellerManagement = lazy(() => import('./pages/SellerManagement'));
const WebhookManagement = lazy(() => import('./pages/WebhookManagement'));
const FunnelAnalysis = lazy(() => import('./pages/FunnelAnalysis'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));

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
  },
  {
    name: 'Webhook Management',
    path: '/webhooks',
    element: <WebhookManagement />
  },
  {
    name: 'Funnel Analysis',
    path: '/funnels',
    element: <FunnelAnalysis />
  },
  {
    name: 'Payment Success',
    path: '/payment-success',
    element: <PaymentSuccess />,
    visible: false
  }
];

export default routes;
