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
import { useState, useEffect } from "react";
import { App as CapApp } from '@capacitor/app';
import { backStack } from '@/lib/backStack';

const queryClient = new QueryClient();

function BackButtonHandler({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showExitDialog, setShowExitDialog] = useState(false);

  useEffect(() => {
    const mainPaths = ['/', '/catalog', '/history', '/stats', '/settings'];

const handler = CapApp.addListener('backButton', ({ canGoBack }) => {
  if (backStack.handle()) return;  // κλείνει το ανοιχτό dialog

  const mainPaths = ['/', '/catalog', '/history', '/stats', '/settings'];
  if (mainPaths.includes(location.pathname)) {
    setShowExitDialog(true);
  } else if (canGoBack) {
    navigate(-1);
  } else {
    setShowExitDialog(true);
  }
});

    return () => { handler.then(h => h.remove()); };
  }, [location.pathname, navigate]);

  return (
    <>
      {children}
      {showExitDialog && (
        <div
          className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowExitDialog(false)}
        >
          <div
            className="bg-card rounded-2xl p-6 max-w-xs w-full shadow-xl border border-border"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-sm font-medium text-foreground mb-4 text-center">
              {localStorage.getItem('Pson-lang') === 'en'
                ? 'Do you want to close the app?'
                : 'Θέλετε να κλείσετε την εφαρμογή;'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowExitDialog(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium"
              >
                {localStorage.getItem('Pson-lang') === 'en' ? 'No' : 'Όχι'}
              </button>
              <button
                onClick={() => CapApp.exitApp()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
              >
                {localStorage.getItem('Pson-lang') === 'en' ? 'Yes' : 'Ναι'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function RouteTracker({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  useEffect(() => {
    localStorage.setItem('Pson-last-page', location.pathname);
  }, [location.pathname]);
  return <>{children}</>;
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
