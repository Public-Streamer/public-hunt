import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Loader2, CreditCard, ShieldCheck, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/contexts/AppContext";
import StripeAccountForm from "@/components/StripeAccountForm";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const PaymentSetup: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAppContext();
  const [showWizard, setShowWizard] = useState(true);

  useEffect(() => {
    // if (!isAuthenticated) {
    //   navigate('/login');
    //   return;
    // }

    // Handle Stripe redirect responses
    const success = searchParams.get("success");
    const refresh = searchParams.get("refresh");
    const error = searchParams.get("error");

    if (success === "true") {
      toast({
        title: "Account Setup Successful",
        description: "Your Stripe account has been set up successfully!",
      });
      // Clear URL parameters
      window.history.replaceState({}, "", "/payments");
    } else if (refresh === "true") {
      toast({
        title: "Setup Incomplete",
        description: "Please complete your Stripe account setup to continue.",
        variant: "destructive",
      });
      // Clear URL parameters
      window.history.replaceState({}, "", "/payments");
    } else if (error) {
      toast({
        title: "Setup Error",
        description: `There was an error setting up your account: ${error}`,
        variant: "destructive",
      });
      // Clear URL parameters
      window.history.replaceState({}, "", "/payments");
    }
  }, [searchParams, navigate, toast, isAuthenticated]);

  // const handleSetupComplete = () => {
  //   toast({
  //     title: "Payment Setup Complete",
  //     description: "You can now create paid events and collect payments!",
  //   });
  //   navigate("/create");
  // };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
              <h2 className="text-xl font-semibold mb-2">
                Authentication Required
              </h2>
              <p className="text-muted-foreground">
                Please log in to set up payment processing.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user already has a Stripe account
  const [hasStripeAccount, setHasStripeAccount] = useState(false);
  const [accountStatus, setAccountStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const checkStripeAccount = async () => {
    try {
      const { data, error } = await supabase
        .from("host_stripe_accounts")
        .select("account_status, onboarding_completed, payouts_enabled")
        .eq("user_id", user?.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No account found
          setHasStripeAccount(false);
        }
        return;
      }

      if (data) {
        setHasStripeAccount(true);
        setAccountStatus(data.account_status);

        // If account is active, show success message
        if (data.onboarding_completed && data.payouts_enabled) {
          toast({
            title: "Payment Processing Ready",
            description: "Your Stripe account is fully set up and ready to receive payments!",
          });
        }
      }
    } catch (err) {
      console.error("Error checking Stripe account:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkStripeAccount();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading payment setup...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <CreditCard className="h-8 w-8 text-purple-600" />
          Payment Setup
        </h1>
        <p className="text-muted-foreground text-lg">
          Set up your payment processing to start monetizing your events
        </p>
      </div>

      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid grid-cols-1 md:grid-cols-2 w-full max-w-md mb-6">
          <TabsTrigger value="setup">Account Setup</TabsTrigger>
          <TabsTrigger value="info">How It Works</TabsTrigger>
        </TabsList>

        <TabsContent value="setup">
          <div className="space-y-6">
            {hasStripeAccount ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                    Payment Processing Active
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="bg-green-50 border-green-200">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <AlertDescription>
                        <strong>Your account is ready!</strong>
                        <p className="mt-2 text-sm">
                          You can now create paid events and receive payments directly to your bank account.
                        </p>
                      </AlertDescription>
                    </div>
                  </Alert>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={() => navigate("/create")}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                      Create Paid Event
                    </Button>
                    <Button
                      onClick={() => window.open(`https://connect.stripe.com/express_login`, "_blank")}
                      variant="outline"
                      className="flex-1"
                    >
                      Manage Stripe Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <StripeAccountForm />
            )}
          </div>
        </TabsContent>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                How Payment Processing Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Secure Payment Flow</h3>
                <p className="text-muted-foreground">
                  PublicStreamer uses Stripe, a secure and trusted payment processor, to handle all financial transactions.
                  Here's how it works:
                </p>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="font-semibold text-purple-600">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Customer Purchases Ticket</h4>
                      <p className="text-sm text-muted-foreground">
                        Viewers purchase tickets to your events using their preferred payment method.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="font-semibold text-purple-600">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Secure Payment Processing</h4>
                      <p className="text-sm text-muted-foreground">
                        Stripe securely processes the payment and handles fraud prevention.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="font-semibold text-purple-600">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Platform Fee Deduction</h4>
                      <p className="text-sm text-muted-foreground">
                        PublicStreamer automatically deducts a 10% platform fee to support development and operations.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="font-semibold text-purple-600">4</span>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Direct Payout to You</h4>
                      <p className="text-sm text-muted-foreground">
                        The remaining 90% is transferred directly to your connected bank account according to Stripe's payout schedule.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Payout Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Platform Fee</span>
                    <span className="font-medium">10%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Your Earnings</span>
                    <span className="font-medium">90%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Payout Schedule</span>
                    <span className="font-medium">2-7 business days</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Supported Currencies</span>
                    <span className="font-medium">USD, EUR, GBP, +135 more</span>
                  </div>
                </div>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5" />
                  <AlertDescription>
                    <strong>Security & Compliance</strong>
                    <p className="mt-2 text-sm">
                      PublicStreamer never stores or has access to your customers' payment information.
                      All transactions are processed securely through Stripe's PCI-compliant infrastructure.
                    </p>
                  </AlertDescription>
                </div>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentSetup;
