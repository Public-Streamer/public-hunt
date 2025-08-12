import React, { Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AppProvider } from "@/contexts/AppContext";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import Create from "./pages/Create";
import CreateEpisode from "./pages/CreateEpisode";
// import Channels from "./pages/Channels";
// import ChannelPage from "./pages/ChannelPage";
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

const queryClient = new QueryClient();

const App = () => {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<div className="p-6">Loading…</div>}>
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
                    <Route path="/payments" element={<PaymentSetup />} />
                    <Route path="/past-events" element={<PastEvents />} />
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
