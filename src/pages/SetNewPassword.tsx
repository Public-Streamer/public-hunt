import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SetNewPasswordProps {
  onSuccess?: () => void;
}

const SetNewPassword: React.FC<SetNewPasswordProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      return setError('Password must be at least 8 characters.');
    }
    if (password !== confirm) {
      return setError('Passwords do not match.');
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
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div
          role="alert"
          className="w-full max-w-md sm:max-w-lg md:max-w-xl
                     rounded-xl border bg-green-50/90 border-green-300
                     dark:bg-green-900/20 dark:border-green-700
                     text-green-900 dark:text-green-100
                     shadow-sm backdrop-blur
                     p-4 sm:p-6 md:p-8"
        >
          <div className="flex items-start gap-3 sm:gap-4">
            <svg
              aria-hidden="true"
              className="mt-0.5 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8
                         text-green-600 dark:text-green-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-7.364 7.364a1 1 0 01-1.414 0L3.293 9.414a1 1 0 111.414-1.414L8.5 11.793l6.793-6.793a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>

            <div className="flex-1">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold">
                Password updated successfully!
              </h2>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base md:text-lg leading-relaxed">
                You can now log in with your new password.
              </p>

              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
                <a
                  href="/login"
                  className="inline-flex items-center justify-center rounded-lg
                             bg-green-600 hover:bg-green-700
                             text-white font-medium
                             px-4 py-2 sm:px-5 sm:py-2.5
                             transition-colors
                             focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                             dark:focus:ring-offset-transparent"
                >
                  Go to Login
                </a>
                <a
                  href="/"
                  className="inline-flex items-center justify-center rounded-lg
                             border border-green-300 dark:border-green-700
                             text-green-800 dark:text-green-100
                             bg-white/70 dark:bg-transparent
                             hover:bg-green-100/60 dark:hover:bg-green-900/30
                             font-medium
                             px-4 py-2 sm:px-5 sm:py-2.5
                             transition-colors
                             focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                             dark:focus:ring-offset-transparent"
                >
                  Back to Home
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto bg-card p-6 rounded-lg border shadow-sm space-y-4">
      <h2 className="text-xl font-semibold text-center text-foreground">
        Set a New Password
      </h2>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div>
        <label className="block mb-1 text-sm font-medium text-foreground">
          New Password
        </label>
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
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Updating...' : 'Update Password'}
      </button>
    </div>
  );
};

export default SetNewPassword;
