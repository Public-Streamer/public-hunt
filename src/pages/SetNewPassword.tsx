import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!
);

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
      <p className="text-green-600">
        ✅ Password updated successfully. You can log in now.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-sm mx-auto bg-white p-6 rounded-lg shadow-md space-y-4"
    >
      <h2 className="text-xl font-semibold text-center">Set a New Password</h2>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div>
        <label className="block mb-1 text-sm font-medium">New Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
          required
        />
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium">
          Confirm Password
        </label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Updating..." : "Update Password"}
      </button>
    </form>
  );
};

export default SetNewPassword;
