import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle } from 'lucide-react';

interface LegalDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (signature: string, date: string) => void;
  userEmail: string;
}

export const LegalDocumentModal: React.FC<LegalDocumentModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  userEmail
}) => {
  const [signature, setSignature] = useState('');
  const [acknowledgedRisks, setAcknowledgedRisks] = useState(false);
  const [acknowledgedLiability, setAcknowledgedLiability] = useState(false);
  const [acknowledgedCompliance, setAcknowledgedCompliance] = useState(false);

  const currentDate = new Date().toLocaleDateString();
  const canSubmit = signature.trim() && acknowledgedRisks && acknowledgedLiability && acknowledgedCompliance;

  const handleAccept = () => {
    if (canSubmit) {
      onAccept(signature, currentDate);
    }
  };

  console.log("LegalDocumentModal render - isOpen:", isOpen);
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            LEGAL AGREEMENT REQUIRED - STREAMURA PROTECTION WAIVER
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm">
            <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
              <h3 className="font-bold text-destructive mb-2">IMPORTANT LEGAL NOTICE</h3>
              <p className="text-destructive">
                This document contains critical legal terms that LIMIT STREAMURA'S LIABILITY and TRANSFER RISKS TO YOU. 
                Read carefully before signing. Consult legal counsel if needed.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold mb-4">STREAMURA PLATFORM USER AGREEMENT AND INDEMNIFICATION WAIVER</h2>
              
              <div className="space-y-4">
                <section>
                  <h3 className="font-semibold mb-2">1. COMPREHENSIVE LIABILITY WAIVER</h3>
                  <p className="mb-2">
                    By using the Streamura platform, you acknowledge and agree that Streamura, LLC, its officers, directors, 
                    employees, agents, and affiliates (collectively "Streamura Parties") shall NOT be liable for any:
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
                    You agree to DEFEND, INDEMNIFY, and HOLD HARMLESS all Streamura Parties from and against any and all 
                    claims, damages, costs, liabilities, and expenses (including reasonable attorneys' fees) arising from or 
                    relating to:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 mt-2">
                    <li>Your use or misuse of the Streamura platform</li>
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
                    against Streamura.
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
        </ScrollArea>

        <div className="space-y-4 border-t pt-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="risks"
                checked={acknowledgedRisks}
                onCheckedChange={(checked) => setAcknowledgedRisks(checked as boolean)}
              />
              <Label htmlFor="risks" className="text-sm font-medium">
                I acknowledge that I have read and understand the risks and liability waivers above
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="liability"
                checked={acknowledgedLiability}
                onCheckedChange={(checked) => setAcknowledgedLiability(checked as boolean)}
              />
              <Label htmlFor="liability" className="text-sm font-medium">
                I agree to indemnify and hold harmless Streamura from all claims and damages
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="compliance"
                checked={acknowledgedCompliance}
                onCheckedChange={(checked) => setAcknowledgedCompliance(checked as boolean)}
              />
              <Label htmlFor="compliance" className="text-sm font-medium">
                I certify that I will comply with all laws and platform terms
              </Label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="signature" className="text-sm font-medium">
                Electronic Signature (Type your full legal name)
              </Label>
              <Input
                id="signature"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Type your full legal name"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Date</Label>
              <Input value={currentDate} disabled className="mt-1" />
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Email: {userEmail} | By signing, you agree this electronic signature has the same legal effect as a handwritten signature.
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleAccept}
              disabled={!canSubmit}
              className="bg-destructive hover:bg-destructive/90"
            >
              I Accept and Electronically Sign
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};