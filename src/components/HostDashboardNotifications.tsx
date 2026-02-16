import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, CreditCard, ArrowRight } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';

const HostDashboardNotifications: React.FC = () => {
    const { user } = useAppContext();
    const navigate = useNavigate();
    const [stripeStatus, setStripeStatus] = useState<'missing' | 'restricted' | 'active' | 'loading'>('loading');

    useEffect(() => {
        if (!user) return;

        const checkStatus = async () => {
            try {
                const { data, error } = await supabase
                    .from('host_stripe_accounts')
                    .select('account_status, onboarding_completed, payouts_enabled')
                    .eq('user_id', user.id)
                    .single();

                if (error && error.code === 'PGRST116') {
                    setStripeStatus('missing');
                    return;
                }

                if (data) {
                    if (data.onboarding_completed && data.payouts_enabled) {
                        setStripeStatus('active');
                    } else {
                        setStripeStatus('restricted');
                    }
                }
            } catch (error) {
                console.error("Error checking stripe status:", error);
            } finally {
                if (stripeStatus === 'loading') {
                    // Only update if still loading to avoid flicker
                }
            }
        };

        checkStatus();
    }, [user]);

    if (stripeStatus === 'active' || stripeStatus === 'loading') return null;

    return (
        <div className="space-y-4 mb-6">
            {stripeStatus === 'missing' && (
                <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div className="flex-1">
                        <AlertTitle className="text-red-900 font-semibold mb-1">Setup Payouts to Monetize</AlertTitle>
                        <AlertDescription className="text-red-800">
                            You haven't set up a Stripe account yet. You won't be able to sell tickets or receive payouts until this is completed.
                        </AlertDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/payments')}
                        className="bg-white border-red-200 text-red-700 hover:bg-red-50"
                    >
                        Setup Now <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Alert>
            )}

            {stripeStatus === 'restricted' && (
                <Alert className="bg-yellow-50 border-yellow-200 text-yellow-900">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <div className="flex-1">
                        <AlertTitle className="text-yellow-900 font-semibold mb-1">Action Required: Payouts Restricted</AlertTitle>
                        <AlertDescription className="text-yellow-800">
                            Your Stripe account has pending requirements. Please verify your information to enable payouts.
                        </AlertDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/payments')}
                        className="bg-white border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                    >
                        Complete Setup <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Alert>
            )}
        </div>
    );
};

export default HostDashboardNotifications;
