import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useHostStripeAccount = (hostId?: string) => {
    const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAccount = async () => {
            if (!hostId) return;

            setLoading(true);
            setError(null);
            try {
                const { data, error } = await supabase
                    .from("host_stripe_accounts")
                    .select("stripe_account_id")
                    .eq("user_id", hostId)
                    .single();

                if (error) {
                    // It's possible they don't have one set up
                    console.log("No stripe account found for host", hostId);
                }

                if (data) {
                    setStripeAccountId(data.stripe_account_id);
                }
            } catch (err) {
                console.error("Error fetching stripe account:", err);
                setError("Failed to load host payment info");
            } finally {
                setLoading(false);
            }
        };

        fetchAccount();
    }, [hostId]);

    return { stripeAccountId, loading, error };
};
