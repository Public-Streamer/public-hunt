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
import Channels from "./pages/Channels";
import ChannelPage from "./pages/ChannelPage";
import Events from "./pages/Events";
import EventPage from "./pages/EventPage";
import StagePage from "./pages/StagePage";
import Profile from "./pages/Profile";
import CompanyProfile from "./pages/CompanyProfile";
import Login from "./pages/Login";

import WithdrawFunds from "./pages/WithdrawFunds";
import QA from "./pages/QA";
import PastEvents from "./pages/PastEvents";
import MyAds from "./pages/MyAds";
import Advertisers from "./pages/Advertisers";
import NotFound from "./pages/NotFound";
import LegalDocumentPage from "./pages/LegalDocument";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/create" element={<Create />} />
                <Route path="/channels" element={<Channels />} />
                <Route path="/channel/:channelId" element={<ChannelPage />} />
                <Route path="/events" element={<Events />} />
                <Route path="/event/:eventId" element={<EventPage />} />
                <Route path="/stage/:eventId" element={<StagePage />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:userId" element={<Profile />} />
                <Route
                  path="/company/:companyId"
                  element={<CompanyProfile />}
                />
                <Route path="/login" element={<Login />} />
                <Route path="/past-events" element={<PastEvents />} />
                <Route path="/my-ads" element={<MyAds />} />
                <Route path="/advertisers" element={<Advertisers />} />
                <Route path="/withdraw" element={<WithdrawFunds />} />
                <Route path="/qa" element={<QA />} />
                <Route path="/legal" element={<LegalDocumentPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
