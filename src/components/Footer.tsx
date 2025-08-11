import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="border-t bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-sm">© {new Date().getFullYear()} Public Streamer</p>
        </div>
        <nav className="flex items-center justify-start sm:justify-end gap-6 text-sm">
          <Link to="/terms" className="hover:underline">Terms of Service</Link>
          <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
          <Link to="/report" className="hover:underline">Report / DMCA</Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
