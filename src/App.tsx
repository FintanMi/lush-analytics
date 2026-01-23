import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import { AppLayout } from '@/components/layouts/AppLayout';

import routes from './routes';

import { Toaster } from '@/components/ui/toaster';

function AppContent() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const isPaymentSuccess = location.pathname === '/payment-success';
  const showWithoutLayout = isLandingPage || isPaymentSuccess;

  return (
    <>
      <IntersectObserver />
      <Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      }>
        {showWithoutLayout ? (
          <Routes>
            {routes.map((route, index) => (
              <Route
                key={index}
                path={route.path}
                element={route.element}
              />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        ) : (
          <AppLayout>
            <Routes>
              {routes.map((route, index) => (
                <Route
                  key={index}
                  path={route.path}
                  element={route.element}
                />
              ))}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>
        )}
      </Suspense>
      <Toaster />
    </>
  );
}

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
