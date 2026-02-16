import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CreditCard,
  ExternalLink,
  CheckCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
  Info,
  ShieldCheck,
  DollarSign,
  Clock,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/contexts/AppContext";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface StripeAccount {
  id: string;
  stripe_account_id: string;
  account_status: string;
  onboarding_completed: boolean;
  payouts_enabled: boolean;
}

interface SetupStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ReactNode;
}

const StripeAccountForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [error, setError] = useState("");
  const [stripeAccount, setStripeAccount] = useState<StripeAccount | null>(
    null
  );
  const [checkingAccount, setCheckingAccount] = useState(true);
  const [setupProgress, setSetupProgress] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const { toast } = useToast();
  const { user } = useAppContext();

  const checkExistingStripeAccount = useCallback(async () => {
    try {
      setCheckingAccount(true);
      const { data, error } = await supabase
        .from("host_stripe_accounts")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.log("no record found");
        return;
      }

      // if any record exist
      if (data) {
        console.log("record found");
        // if onboarding is completed
        if (data.onboarding_completed) {
          // Account is fully set up
          console.log("onboarding completed");
          setStripeAccount(data);

          return;
        } else {
          // if onboarding is not completed
          console.log("onboarding not completed, checking latest from stripe");
          checkStripeAccountStatus();
        }
      }
    } catch (err) {
      console.error("Error checking existing account:", err);
    } finally {
      setCheckingAccount(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      checkExistingStripeAccount();
    }
  }, [user, checkExistingStripeAccount]);

  const handleCreateStripeAccount = async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.functions.invoke(
        "create-stripe-express-account",
        {
          body: {
            email: user?.email,
            firstName: user?.user_metadata?.first_name || "",
            lastName: user?.user_metadata?.last_name || "",
          },
        }
      );

      if (error) throw error;

      if (data.url) {
        // Redirect to Stripe onboarding
        window.open(data.url, "_blank");

        toast({
          title: "Redirecting to Stripe",
          description: "Complete your account setup in the new window.",
        });

        // Start polling for account status
        pollAccountStatus(data.accountId);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to create Stripe account. Please try again.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: "Failed to create Stripe account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const pollAccountStatus = async (accountId: string) => {
    const maxAttempts = 30; // Poll for 5 minutes
    let attempts = 0;
    setIsPolling(true);

    const poll = async () => {
      try {
        const { data, error } = await supabase
          .from("host_stripe_accounts")
          .select("*")
          .eq("stripe_account_id", accountId)
          .single();

        if (error) throw error;

        // If status changed to active/completed
        if (data.onboarding_completed && data.payouts_enabled) {
          setStripeAccount(data); // Update local state
          toast({
            title: "Account Setup Complete",
            description: "Your Stripe account is now ready for payments!",
          });
          setIsPolling(false);
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        } else {
          setIsPolling(false);
        }
      } catch (err) {
        console.error("Error polling account status:", err);
        setIsPolling(false);
      }
    };

    poll();
  };

  const checkStripeAccountStatus = async () => {
    // if (!stripeAccount) return;

    setIsCheckingStatus(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "check-stripe-account-status"
      );

      console.log(data);

      if (error) throw error;

      // Refresh account data
      // await checkExistingStripeAccount();

      // toast({
      //   title: "Status Updated",
      //   description: `Account status: ${data.accountStatus}`,
      // // });

      // if (data.accountStatus === "active") {
      //   //set active
      // }
    } catch (error: unknown) {
      console.error("Error checking account status:", error);
      toast({
        title: "Error",
        description: "Failed to check account status",
        variant: "destructive",
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Unknown
          </span>
        );
    }
  };

  if (checkingAccount) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Checking account status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show existing account status if available
  if (stripeAccount) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Stripe Account Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Account Status</h3>
              <p className="text-sm text-muted-foreground">
                Account ID: {stripeAccount.stripe_account_id}
              </p>
            </div>
            {getStatusBadge(stripeAccount.account_status)}
          </div>

          <Alert>
            <AlertDescription>
              {stripeAccount.onboarding_completed &&
                stripeAccount.payouts_enabled
                ? "Your Stripe account is fully set up and ready to receive payments!"
                : "Complete your Stripe account setup to start receiving payments."}
            </AlertDescription>
          </Alert>

          <Button
            onClick={() =>
              window.open(`https://connect.stripe.com/express_login`, "_blank")
            }
            className="w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Login to Stripe
          </Button>
          <Button
            onClick={checkStripeAccountStatus}
            disabled={isCheckingStatus}
            variant="outline"
            className="w-full"
          >
            {isCheckingStatus ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking Status...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Account Status
              </>
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  // Setup steps for new account creation
  const setupSteps: SetupStep[] = [
    {
      id: 1,
      title: "Create Account",
      description: "Set up your Stripe Express account",
      completed: false,
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      id: 2,
      title: "Verify Identity",
      description: "Complete identity verification",
      completed: false,
      icon: <ShieldCheck className="h-5 w-5" />,
    },
    {
      id: 3,
      title: "Add Bank Account",
      description: "Set up your payout bank account",
      completed: false,
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      id: 4,
      title: "Enable Payouts",
      description: "Activate your account for payments",
      completed: false,
      icon: <CheckCircle className="h-5 w-5" />,
    },
  ];

  // If no account exists, show the enhanced setup guide
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Stripe Account Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <AlertDescription className="text-blue-800">
              <strong>Secure Payment Processing</strong>
              <p className="mt-2 text-sm">
                PublicStreamer uses Stripe to securely process payments. Your financial
                information is protected and never stored on our servers.
              </p>
              <p className="mt-2 text-sm">
                Setup takes about 5 minutes and requires identity verification.
              </p>
            </AlertDescription>
          </div>
        </Alert>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Setup Process</h3>
          <div className="space-y-3">
            {setupSteps.map((step) => (
              <div key={step.id} className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${step.completed ? "bg-green-100" : "bg-gray-100"
                  }`}>
                  {step.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{step.title}</h4>
                    {step.completed && (
                      <Badge variant="success" className="text-xs">
                        Completed
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Secure & Compliant</h4>
                <p className="text-sm text-muted-foreground">
                  PCI-compliant payment processing with fraud protection
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Fast Payouts</h4>
                <p className="text-sm text-muted-foreground">
                  Receive payments directly to your bank account
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Automatic Processing</h4>
                <p className="text-sm text-muted-foreground">
                  Instant payment confirmation for your customers
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Multiple Payment Methods</h4>
                <p className="text-sm text-muted-foreground">
                  Support for cards, digital wallets, and more
                </p>
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={handleCreateStripeAccount}
          disabled={loading}
          className="w-full text-lg py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Starting Setup...
            </>
          ) : (
            <>
              <ExternalLink className="h-5 w-5 mr-2" />
              Start Stripe Setup
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Alert variant="info" className="text-sm">
          <AlertDescription>
            <strong>Note:</strong> After completing the setup in the new window,
            refresh this page to see your updated account status.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default StripeAccountForm;
