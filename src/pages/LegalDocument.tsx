import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle } from 'lucide-react';

const LegalDocumentPage: React.FC = () => {
  const [signature, setSignature] = useState('');
  const [acknowledgedRisks, setAcknowledgedRisks] = useState(false);
  const [acknowledgedLiability, setAcknowledgedLiability] = useState(false);
  const [acknowledgedCompliance, setAcknowledgedCompliance] = useState(false);

  const currentDate = new Date().toLocaleDateString();
  const canSubmit = signature.trim() && acknowledgedRisks && acknowledgedLiability && acknowledgedCompliance;

  const handleAccept = () => {
    if (canSubmit && window.opener) {
      // Send signature data back to parent window
      window.opener.postMessage({
        type: 'legal-document-signed',
        signature,
        date: currentDate
      }, '*');
      window.close();
    }
  };

  const handleCancel = () => {
    if (window.opener) {
      window.opener.postMessage({
        type: 'legal-document-cancelled'
      }, '*');
    }
    window.close();
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="border-b pb-6 mb-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <h1 className="text-xl font-bold">Legal Agreement Required</h1>
          </div>
        </div>

        <ScrollArea className="h-96 mb-6 border rounded-lg p-4">
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
              
              <h3 className="font-bold text-red-600 mb-2">1. ASSUMPTION OF RISK</h3>
              <p className="mb-4">
                You acknowledge that live streaming involves inherent risks including but not limited to: technical failures, 
                content disputes, copyright claims, privacy violations, harassment, doxxing, financial losses, reputation damage, 
                legal liability, and personal safety concerns. You voluntarily assume ALL such risks.
              </p>

              <h3 className="font-bold text-red-600 mb-2">2. RELEASE AND WAIVER OF LIABILITY</h3>
              <p className="mb-4">
                You hereby RELEASE, WAIVE, DISCHARGE and COVENANT NOT TO SUE Public Streamer, its officers, directors, 
                employees, agents, and affiliates from ALL liability, claims, demands, losses, or damages arising from or 
                related to your use of the platform, including but not limited to any injuries, damages, or losses caused 
                by the negligence of Public Streamer.
              </p>

              <h3 className="font-bold text-red-600 mb-2">3. INDEMNIFICATION</h3>
              <p className="mb-4">
                You agree to INDEMNIFY, DEFEND, and HOLD HARMLESS Public Streamer from and against ALL claims, liabilities, 
                damages, losses, costs, expenses, and attorney fees arising out of or related to: (a) your use of the platform; 
                (b) your content; (c) your violation of these terms; (d) your violation of any rights of another; or 
                (e) your conduct in connection with the platform.
              </p>

              <h3 className="font-bold text-red-600 mb-2">4. LIMITATION OF LIABILITY</h3>
              <p className="mb-4">
                IN NO EVENT SHALL PUBLIC STREAMER BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, 
                OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER 
                INTANGIBLE LOSSES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>

              <h3 className="font-bold text-red-600 mb-2">5. CONTENT AND COPYRIGHT</h3>
              <p className="mb-4">
                You represent and warrant that you own or have the necessary rights to all content you stream. 
                You agree to comply with all applicable copyright laws and acknowledge that copyright infringement 
                may result in account termination and legal action against you personally.
              </p>

              <h3 className="font-bold text-red-600 mb-2">6. NO WARRANTIES</h3>
              <p className="mb-4">
                THE PLATFORM IS PROVIDED "AS IS" WITHOUT ANY WARRANTIES OF ANY KIND. PUBLIC STREAMER DISCLAIMS 
                ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR 
                PURPOSE, AND NON-INFRINGEMENT.
              </p>

              <h3 className="font-bold text-red-600 mb-2">7. GOVERNING LAW AND JURISDICTION</h3>
              <p className="mb-4">
                This agreement shall be governed by and construed in accordance with the laws of [JURISDICTION]. 
                Any disputes shall be resolved exclusively in the courts of [JURISDICTION].
              </p>

              <h3 className="font-bold text-red-600 mb-2">8. SEVERABILITY</h3>
              <p className="mb-4">
                If any provision of this agreement is found to be unenforceable, the remainder shall remain in full force and effect.
              </p>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-6">
                <h3 className="font-bold text-yellow-700 mb-2">ACKNOWLEDGMENT</h3>
                <p className="text-yellow-700">
                  BY SIGNING BELOW, YOU ACKNOWLEDGE THAT YOU HAVE READ AND UNDERSTOOD THIS AGREEMENT, 
                  THAT YOU HAVE BEEN ADVISED TO SEEK LEGAL COUNSEL, AND THAT YOU ARE VOLUNTARILY 
                  WAIVING SUBSTANTIAL LEGAL RIGHTS.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="acknowledge-risks" 
              checked={acknowledgedRisks}
              onCheckedChange={(checked) => setAcknowledgedRisks(checked === true)}
            />
            <Label htmlFor="acknowledge-risks" className="text-sm">
              I acknowledge and voluntarily assume all risks associated with live streaming
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="acknowledge-liability" 
              checked={acknowledgedLiability}
              onCheckedChange={(checked) => setAcknowledgedLiability(checked === true)}
            />
            <Label htmlFor="acknowledge-liability" className="text-sm">
              I release Public Streamer from all liability and agree to indemnify the platform
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="acknowledge-compliance" 
              checked={acknowledgedCompliance}
              onCheckedChange={(checked) => setAcknowledgedCompliance(checked === true)}
            />
            <Label htmlFor="acknowledge-compliance" className="text-sm">
              I agree to comply with all applicable laws and platform terms
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="signature" className="text-sm font-medium block mb-1">
                Electronic Signature (Type your full legal name)
              </Label>
              <Input
                id="signature"
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Your full legal name"
                className="w-full"
              />
            </div>
            <div>
              <Label className="text-sm font-medium block mb-1">Date</Label>
              <Input 
                value={currentDate} 
                disabled 
                className="w-full bg-gray-100"
              />
            </div>
          </div>

          <div className="text-xs text-gray-600">
            By signing, you agree this electronic signature has the same legal effect as a handwritten signature.
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="px-6"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAccept}
              disabled={!canSubmit}
              className="px-6 bg-green-600 hover:bg-green-700"
            >
              Accept and Sign
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalDocumentPage;