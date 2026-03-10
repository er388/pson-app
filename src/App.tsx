import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import UndoSnackbar from "@/components/UndoSnackbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { I18nProvider } from "@/lib/i18n";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import CatalogPage from "./pages/CatalogPage";
import SettingsPage from "./pages/SettingsPage";
import StatsPage from "./pages/StatsPage";
import HistoryPage from "./pages/HistoryPage";
import NotFound from "./pages/NotFound";
import SplashScreen from "@/components/SplashScreen";
import { useState, useEffect, useCallback } from "react";

const queryClient = new QueryClient();

function StartupRedirect() {
  const startupPage = localStorage.getItem('smartcart-startup-page') || 'last';
  if (startupPage === 'last') {
    const lastPage = localStorage.getItem('smartcart-last-page') || '/';
    return <Navigate to={lastPage} replace />;
  }
  return <Navigate to={startupPage} replace />;
}

function RouteTracker({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  useEffect(() => {
    localStorage.setItem('smartcart-last-page', location.pathname);
  }, [location.pathname]);
  return <>{children}</>;
}

function BackButtonHandler({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showExitDialog, setShowExitDialog] = useState(false);

  const handlePopState = useCallback((e: PopStateEvent) => {
    const mainPaths = ['/', '/catalog', '/history', '/stats', '/settings'];
    if (mainPaths.includes(location.pathname)) {
      e.preventDefault();
      window.history.pushState(null, '', location.pathname);
      setShowExitDialog(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    window.history.pushState(null, '', location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handlePopState, location.pathname]);

  return (
    <>
      {children}
      {showExitDialog && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowExitDialog(false)}>
          <div className="bg-card rounded-2xl p-6 max-w-xs w-full shadow-xl border border-border" onClick={e => e.stopPropagation()}>
            <p className="text-sm font-medium text-foreground mb-4 text-center">
              {localStorage.getItem('smartcart-lang') === 'en' ? 'Do you want to close the app?' : 'Θέλετε να κλείσετε την εφαρμογή;'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowExitDialog(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium"
              >
                {localStorage.getItem('smartcart-lang') === 'en' ? 'No' : 'Όχι'}
              </button>
              <button
                onClick={() => {
                  // On Capacitor, this will minimize/close the app
                  if ((window as any).navigator?.app?.exitApp) {
                    (window as any).navigator.app.exitApp();
                  } else {
                    window.close();
                  }
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
              >
                {localStorage.getItem('smartcart-lang') === 'en' ? 'Yes' : 'Ναι'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <UndoSnackbar />
          {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
          <BrowserRouter>
            <BackButtonHandler>
              <RouteTracker>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/catalog" element={<CatalogPage />} />
                    <Route path="/history" element={<HistoryPage />} />
                    <Route path="/stats" element={<StatsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              </RouteTracker>
            </BackButtonHandler>
          </BrowserRouter>
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
};

export default App;
