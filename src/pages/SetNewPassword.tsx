import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SetNewPasswordProps {
  onSuccess?: () => void;
}

const SetNewPassword: React.FC<SetNewPasswordProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      return setError("Password must be at least 8 characters.");
    }
    if (password !== confirm) {
      return setError("Passwords do not match.");
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      if (onSuccess) onSuccess();
    }
  };

  if (success) {
    return (
      <p className="text-success">
        ✅ Password updated successfully. You can log in now.
      </p>
    );
  }

  return (
    <div className="max-w-sm mx-auto bg-card p-6 rounded-lg border shadow-sm space-y-4">
      <h2 className="text-xl font-semibold text-center text-foreground">Set a New Password</h2>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div>
        <label className="block mb-1 text-sm font-medium text-foreground">New Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium text-foreground">
          Confirm Password
        </label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {loading ? "Updating..." : "Update Password"}
      </button>
    </div>
  );
};

export default SetNewPassword;
