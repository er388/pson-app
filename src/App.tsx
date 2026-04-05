import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import UndoSnackbar from "@/components/UndoSnackbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const queryClient = new QueryClient();

const MAIN_PATHS = ['/', '/catalog', '/history', '/stats', '/settings'];

function BackButtonHandler({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showExitDialog, setShowExitDialog] = useState(false);

  useEffect(() => {
    const handler = CapApp.addListener('backButton', ({ canGoBack }) => {
      // Αν υπάρχει focused input (inline edit), απλώς blur — δεν εμφανίζουμε dialog
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
        active.blur();
        return;
      }

      // Αν υπάρχει open modal/dialog στο backStack, κλείσε το
      if (backStack.handle()) return;

      // Main path → exit dialog, αλλιώς navigate back
      if (MAIN_PATHS.includes(location.pathname)) {
        setShowExitDialog(true);
      } else if (canGoBack) {
        navigate(-1);
      } else {
        setShowExitDialog(true);
      }
    });

    return () => { handler.then(h => h.remove()); };
  }, [location.pathname, navigate]);

  const lang = localStorage.getItem('Pson-lang') === 'en' ? 'en' : 'el';

  return (
    <>
      {children}
      {/* AlertDialog render-άρεται σε Radix portal — σωστό stacking, taps δεν περνάνε */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="rounded-2xl max-w-xs">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-base">
              {lang === 'en' ? 'Close the app?' : 'Κλείσιμο εφαρμογής;'}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:flex-row sm:space-x-0">
            <AlertDialogCancel className="flex-1 rounded-xl mt-0">
              {lang === 'en' ? 'No' : 'Όχι'}
            </AlertDialogCancel>
            <AlertDialogAction className="flex-1 rounded-xl" onClick={() => CapApp.exitApp()}>
              {lang === 'en' ? 'Yes' : 'Ναι'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function RouteTracker({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  useEffect(() => {
    localStorage.setItem('Pson-last-page', location.pathname);
    (document.activeElement as HTMLElement)?.blur();
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