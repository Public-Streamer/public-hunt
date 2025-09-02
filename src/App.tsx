import React, { Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AppProvider } from "@/contexts/AppContext";
import { supabaseBrowser } from "@/lib/supabase/browser";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import Create from "./pages/Create";
import CreateEpisode from "./pages/CreateEpisode";
import Events from "./pages/Events";

const StagePage = React.lazy(() => import("./pages/StagePage"));
const EventPage = React.lazy(() => import("./pages/EventPage"));
const Profile = React.lazy(() => import("./pages/Profile"));
import CompanyProfile from "./pages/CompanyProfile";
import Login from "./pages/Login";
import PaymentSetup from "./pages/PaymentSetup";
import WithdrawFunds from "./pages/WithdrawFunds";
import QA from "./pages/QA";
import PastEvents from "./pages/PastEvents";
import MyAds from "./pages/MyAds";
import Advertisers from "./pages/Advertisers";
import CreateAd from "./pages/CreateAd";
import AdLibrary from "./pages/AdLibrary";
import AdvertiserDashboard from "./pages/AdvertiserDashboard";
import MasterAdmin from "./pages/MasterAdmin";
import NotFound from "./pages/NotFound";
import LegalDocumentPage from "./pages/LegalDocument";
import Post from "./pages/Post";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import ReportDMCA from "./pages/ReportDMCA";
import ResetPasswordForm from "./components/ResetPasswordForm";
import SetNewPassword from "./pages/SetNewPassword";

const queryClient = new QueryClient();

// Simplified auth state sync - no aggressive reloads
function AuthStateSync() {
  const navigate = useNavigate();

  useEffect(() => {
    const supabase = supabaseBrowser();

    // Only sync auth state, don't force reloads
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return null;
}

const App = () => {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthStateSync />
              <Suspense
                fallback={
                  <div className="flex items-center justify-center h-screen">
                    <img
                      src="/sLogo.png"
                      className="w-24 h-24 animate-pulse"
                      alt="Logo"
                    />
                  </div>
                }
              >
                <Layout>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/create" element={<Create />} />
                    <Route path="/create-episode" element={<CreateEpisode />} />
                    {/* <Route path="/channels" element={<Channels />} /> */}
                    {/* <Route path="/channel/:channelId" element={<ChannelPage />} /> */}
                    <Route path="/events" element={<Events />} />
                    <Route path="/event/:eventId" element={<EventPage />} />
                    <Route path="/stage/:eventId" element={<StagePage />} />
                    {/* <Route path="/profile" element={<Profile />} /> */}
                    <Route path="/profile/:userId" element={<Profile />} />
                    <Route
                      path="/company/:companyId"
                      element={<CompanyProfile />}
                    />
                    <Route path="/login" element={<Login />} />
                    <Route
                      path="/auth/reset-password"
                      element={<SetNewPassword />}
                    />
                    <Route path="/payments" element={<PaymentSetup />} />
                    <Route path="/past-events" element={<PastEvents events={[]} />} />
                    <Route path="/my-ads" element={<MyAds />} />
                    <Route path="/advertisers" element={<Advertisers />} />
                    <Route path="/create-ad" element={<CreateAd />} />
                    <Route path="/ad-library" element={<AdLibrary />} />
                    <Route
                      path="/advertiser-dashboard"
                      element={<AdvertiserDashboard />}
                    />
                    <Route path="/withdraw" element={<WithdrawFunds />} />
                    <Route path="/master-admin" element={<MasterAdmin />} />
                    <Route path="/qa" element={<QA />} />
                    <Route path="/legal" element={<LegalDocumentPage />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/report" element={<ReportDMCA />} />
                    <Route path="/post/:postId" element={<Post />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              </Suspense>
            </BrowserRouter>
          </AppProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
