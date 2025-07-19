import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  userFullName
}) => {
  const [signature, setSignature] = useState('');
  const [acknowledgedRisks, setAcknowledgedRisks] = useState(false);
  const [acknowledgedLiability, setAcknowledgedLiability] = useState(false);
  const [acknowledgedCompliance, setAcknowledgedCompliance] = useState(false);

  const currentDate = new Date().toLocaleDateString();
  
  // Validate signature matches user's full name
  const isValidSignature = userFullName 
    ? signature.trim().toLowerCase() === userFullName.toLowerCase()
    : signature.trim().length >= 3; // Fallback: at least 3 characters if no user name provided
  
  const canSubmit = isValidSignature && acknowledgedRisks && acknowledgedLiability && acknowledgedCompliance;

  const handleAccept = async () => {
    if (canSubmit) {
      try {
        // Save legal document to database
        const { error } = await supabase
          .from('legal_documents')
          .insert({
            user_id: 'temp-user-id', // Will be updated when user actually signs up
            email: userEmail,
            signature: signature,
            document_type: 'user_agreement',
            document_version: '1.0',
            ip_address: 'unknown', // Could be enhanced to get real IP
            user_agent: navigator.userAgent
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

  console.log("LegalDocumentModal render - isOpen:", isOpen);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-hidden touch-none">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full overflow-hidden relative touch-none" style={{ maxWidth: '95vw' }}>
        <div className="p-6 border-b">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="text-lg font-bold">LEGAL AGREEMENT REQUIRED - PUBLIC STREAMER PROTECTION WAIVER</h2>
          </div>
        </div>
        
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-6 text-sm">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h3 className="font-bold text-red-700 mb-2">IMPORTANT LEGAL NOTICE</h3>
              <p className="text-red-700">
                This document contains critical legal terms that LIMIT PUBLIC STREAMER'S LIABILITY and TRANSFER RISKS TO YOU. 
                Read carefully before signing. Consult legal counsel if needed.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold mb-4">PUBLIC STREAMER PLATFORM USER AGREEMENT AND INDEMNIFICATION WAIVER</h2>
              
              <div className="space-y-4">
                <section>
                  <h3 className="font-semibold mb-2">1. COMPREHENSIVE LIABILITY WAIVER</h3>
                  <p className="mb-2">
                    By using the Public Streamer platform, you acknowledge and agree that Public Streamer, LLC, its officers, directors, 
                    employees, agents, and affiliates (collectively "Public Streamer Parties") shall NOT be liable for any:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Content you create, upload, stream, or distribute through the platform</li>
                    <li>Third-party claims arising from your use of the platform</li>
                    <li>Copyright, trademark, or intellectual property violations in your content</li>
                    <li>Defamatory, offensive, or illegal content you publish</li>
                    <li>Privacy violations or unauthorized disclosure of personal information</li>
                    <li>Financial losses, business interruption, or reputational damage</li>
                    <li>Any direct, indirect, incidental, consequential, or punitive damages</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">2. COMPLETE INDEMNIFICATION</h3>
                  <p>
                    You agree to DEFEND, INDEMNIFY, and HOLD HARMLESS all Public Streamer Parties from and against any and all 
                    claims, damages, costs, liabilities, and expenses (including reasonable attorneys' fees) arising from or 
                    relating to:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Your use or misuse of the Public Streamer platform</li>
                    <li>Any content you upload, stream, or make available through the platform</li>
                    <li>Your violation of any law, regulation, or third-party rights</li>
                    <li>Any breach of this agreement or platform terms of service</li>
                    <li>Any negligent or wrongful act or omission by you or your agents</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">3. CONTENT RESPONSIBILITY AND COMPLIANCE</h3>
                  <p className="mb-2">You represent, warrant, and covenant that:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>You own or have proper licenses for all content you upload or stream</li>
                    <li>Your content does not violate any copyright, trademark, privacy, or other rights</li>
                    <li>Your content complies with all applicable laws and regulations</li>
                    <li>You will not use the platform for any illegal or unauthorized purpose</li>
                    <li>You assume full responsibility for all content and activities under your account</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">4. DISPUTE RESOLUTION</h3>
                  <p>
                    Any disputes shall be resolved through binding arbitration in accordance with the rules of the 
                    American Arbitration Association. You waive any right to participate in class action lawsuits 
                    against Public Streamer.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold mb-2">5. SEVERABILITY AND ENFORCEABILITY</h3>
                  <p>
                    If any provision of this agreement is deemed unenforceable, the remaining provisions shall remain 
                    in full force and effect. This agreement shall be governed by the laws of Delaware, USA.
                  </p>
                </section>
              </div>
            </div>
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
                I acknowledge that I have read and understand the risks and liability waivers above
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
                I agree to indemnify and hold harmless Public Streamer from all claims and damages
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="signature" className="text-sm font-medium block mb-1">
                Electronic Signature (Type your full legal name)
              </label>
              <input
                id="signature"
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder={userFullName ? `Type: ${userFullName}` : "Type your full legal name"}
                className={`w-full p-2 border rounded ${
                  signature.trim() && !isValidSignature ? 'border-red-500 bg-red-50' : 'border-gray-300'
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
            Email: {userEmail} | By signing, you agree this electronic signature has the same legal effect as a handwritten signature.
          </div>

          <div className="flex justify-end space-x-2">
            <button 
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleAccept}
              disabled={!canSubmit}
              className={`px-4 py-2 rounded text-white ${
                canSubmit 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              I Accept and Electronically Sign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};