import React from 'react';
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
