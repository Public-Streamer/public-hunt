
import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AppProvider, useAppContext } from "@/contexts/AppContext";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import Create from "./pages/Create";
import CreateEpisode from "./pages/CreateEpisode";
import Channels from "./pages/Channels";
import ChannelPage from "./pages/ChannelPage";
import Events from "./pages/Events";
import EventPage from "./pages/EventPage";
import StagePage from "./pages/StagePage";
import Profile from "./pages/Profile";
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

const queryClient = new QueryClient();

const App = () => {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppProvider>
            <AuthWrapper />
          </AppProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

const AuthWrapper = () => {
  const { user, isAuthenticated } = useAppContext();
  const [authLoading, setAuthLoading] = useState(true);
  
  useEffect(() => {
    // Set a timeout to handle auth loading state
    const timer = setTimeout(() => {
      setAuthLoading(false);
    }, 1000);
    
    // If user state changes, stop loading immediately
    if (user !== null || isAuthenticated !== undefined) {
      setAuthLoading(false);
      clearTimeout(timer);
    }
    
    return () => clearTimeout(timer);
  }, [user, isAuthenticated]);
  
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }
  
  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/create" element={<Create />} />
            <Route path="/create-episode" element={<CreateEpisode />} />
            <Route path="/channels" element={<Channels />} />
            <Route path="/channel/:channelId" element={<ChannelPage />} />
            <Route path="/events" element={<Events />} />
            <Route path="/event/:eventId" element={<EventPage />} />
            <Route path="/stage/:eventId" element={<StagePage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route
              path="/company/:companyId"
              element={<CompanyProfile />}
            />
            <Route path="/login" element={<Login />} />
            <Route path="/payment-setup" element={<PaymentSetup />} />
            <Route path="/past-events" element={<PastEvents />} />
            <Route path="/my-ads" element={<MyAds />} />
            <Route path="/advertisers" element={<Advertisers />} />
            <Route path="/create-ad" element={<CreateAd />} />
            <Route path="/ad-library" element={<AdLibrary />} />
            <Route path="/advertiser-dashboard" element={<AdvertiserDashboard />} />
            <Route path="/withdraw" element={<WithdrawFunds />} />
            <Route path="/master-admin" element={<MasterAdmin />} />
            <Route path="/qa" element={<QA />} />
            <Route path="/legal" element={<LegalDocumentPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </>
  );
};

export default App;
