import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { TooltipWrapper } from '@/components/ui/tooltip-wrapper';
import LegalAgreementBody from '@/components/legal/LegalAgreementBody';
import { LEGAL_VERSION } from '@/content/legal/terms';

interface LegalDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (signature: string, date: string) => void;
  userEmail: string;
  userFullName?: string;
}

export const LegalDocumentModal: React.FC<LegalDocumentModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  userEmail,
  userFullName,
}) => {
  const [signature, setSignature] = useState('');
  const [acknowledgedRisks, setAcknowledgedRisks] = useState(false);
  const [acknowledgedLiability, setAcknowledgedLiability] = useState(false);
  const [acknowledgedCompliance, setAcknowledgedCompliance] = useState(false);
  const [acknowledgedProhibited, setAcknowledgedProhibited] = useState(false);

  const currentDate = new Date().toLocaleDateString();

  // Validate signature matches user's full name
  const normalizeString = (str: string) =>
    str.trim().toLowerCase().replace(/\s+/g, ' ');

  console.log('[Legal Document] Signature validation:');
  console.log('- User Full Name:', userFullName);
  console.log('- Current Signature:', signature);
  console.log(
    '- Normalized Full Name:',
    userFullName ? normalizeString(userFullName) : 'N/A'
  );
  console.log('- Normalized Signature:', normalizeString(signature));

  const isValidSignature = userFullName
    ? normalizeString(signature) === normalizeString(userFullName)
    : signature.trim().length >= 3; // Fallback: at least 3 characters if no user name provided

  console.log('- Is Valid Signature:', isValidSignature);

  const canSubmit =
    isValidSignature &&
    acknowledgedRisks &&
    acknowledgedLiability &&
    acknowledgedCompliance &&
    acknowledgedProhibited;

  const getValidationMessage = () => {
    if (!signature.trim()) return 'Please enter your electronic signature';
    if (!isValidSignature)
      return userFullName
        ? `Signature must match exactly: ${userFullName}`
        : 'Please enter a valid signature (minimum 3 characters)';
    if (!acknowledgedRisks)
      return 'Please acknowledge that you understand the risks';
    if (!acknowledgedLiability)
      return 'Please agree to indemnify Public Streamer';
    if (!acknowledgedCompliance)
      return 'Please agree to comply with laws and platform terms';
    if (!acknowledgedProhibited)
      return 'Please confirm you have read and agree to the Terms of Service, including the prohibition on monetizing prohibited content categories listed above';
    return null;
  };

  const handleAccept = async () => {
    if (canSubmit) {
      try {
        // Save legal document to database
        const { error } = await supabase.from('legal_documents').insert({
          user_id: 'temp-user-id', // Will be updated when user actually signs up
          email: userEmail,
          signature,
          document_type: 'user_agreement',
          document_version: LEGAL_VERSION,
          ip_address: 'unknown', // Could be enhanced to get real IP
          user_agent: navigator.userAgent,
        });

        if (error) {
          console.error('Error saving legal document:', error);
        }

        // Call the accept callback with signature data
        onAccept(signature, currentDate);

        // Force close the modal completely
        onClose();
      } catch (error) {
        console.error('Error handling legal document acceptance:', error);
        // Still proceed with acceptance even if database save fails
        onAccept(signature, currentDate);
        onClose();
      }
    }
  };

  console.log('LegalDocumentModal render - isOpen:', isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-hidden touch-none">
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full overflow-hidden relative touch-none"
        style={{ maxWidth: '95vw' }}
      >
        <div className="p-6 border-b">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="text-lg font-bold">
              LEGAL AGREEMENT REQUIRED - PUBLIC STREAMER PROTECTION WAIVER
            </h2>
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-6 text-sm">
            <LegalAgreementBody size="sm" />
          </div>
        </div>

        <div className="p-6 border-t space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="risks"
                checked={acknowledgedRisks}
                onChange={(e) => setAcknowledgedRisks(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="risks" className="text-sm font-medium">
                I acknowledge that I have read and understand the risks and
                liability waivers above
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="liability"
                checked={acknowledgedLiability}
                onChange={(e) => setAcknowledgedLiability(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="liability" className="text-sm font-medium">
                I agree to indemnify and hold harmless Public Streamer from all
                claims and damages
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="compliance"
                checked={acknowledgedCompliance}
                onChange={(e) => setAcknowledgedCompliance(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="compliance" className="text-sm font-medium">
                I certify that I will comply with all laws and platform terms
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="prohibited"
                checked={acknowledgedProhibited}
                onChange={(e) => setAcknowledgedProhibited(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="prohibited" className="text-sm font-medium">
                I have read and agree to the Public Streamer Terms of Service,
                including the prohibition on monetizing prohibited content
                categories listed above.
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="signature"
                className="text-sm font-medium block mb-1"
              >
                Electronic Signature (Type your full legal name)
              </label>
              {userFullName && (
                <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
                  <p className="text-xs text-blue-700 font-medium">
                    Please type exactly as shown:
                  </p>
                  <p className="text-sm font-bold text-blue-800">
                    {userFullName}
                  </p>
                </div>
              )}
              <input
                id="signature"
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder={
                  userFullName
                    ? `Type: ${userFullName}`
                    : 'Type your full legal name'
                }
                className={`w-full p-2 border rounded ${
                  signature.trim() && !isValidSignature
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                }`}
              />
              {signature.trim() && !isValidSignature && userFullName && (
                <p className="text-red-500 text-xs mt-1">
                  Signature must match exactly: {userFullName}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Date</label>
              <input
                value={currentDate}
                disabled
                className="w-full p-2 border rounded bg-gray-100"
              />
            </div>
          </div>

          <div className="text-xs text-gray-600">
            Email: {userEmail} | By signing, you agree this electronic signature
            has the same legal effect as a handwritten signature.
          </div>

          <div className="flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border-2 border-gray-300 bg-white rounded hover:bg-gray-100 hover:border-gray-400 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Cancel
            </button>
            <TooltipWrapper
              content={
                !canSubmit
                  ? getValidationMessage()
                  : 'Sign the legal document electronically'
              }
              disabled={canSubmit}
            >
              <button
                onClick={handleAccept}
                disabled={!canSubmit}
                className={`px-4 py-2 rounded text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 ${
                  canSubmit
                    ? 'bg-green-600 hover:bg-green-700 border-2 border-green-500 hover:border-green-600 shadow-green-600/30'
                    : 'bg-gray-400 border-2 border-gray-300 cursor-not-allowed'
                }`}
              >
                I Accept and Electronically Sign
              </button>
            </TooltipWrapper>
          </div>
        </div>
      </div>
    </div>
  );
};
