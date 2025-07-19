import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TooltipWrapper } from '@/components/ui/tooltip-wrapper';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const LegalDocumentPage: React.FC = () => {
  const [signature, setSignature] = useState('');
  const [acknowledgedRisks, setAcknowledgedRisks] = useState(false);
  const [acknowledgedLiability, setAcknowledgedLiability] = useState(false);
  const [acknowledgedCompliance, setAcknowledgedCompliance] = useState(false);
  const [documentSigned, setDocumentSigned] = useState(false);

  const currentDate = new Date().toLocaleDateString();
  const canSubmit = signature.trim() && acknowledgedRisks && acknowledgedLiability && acknowledgedCompliance;

  // Add mobile detection and force touch event handling
  useEffect(() => {
    // Force enable touch events for iOS Safari
    if (typeof window !== 'undefined') {
      const body = document.body as any;
      body.style.webkitTouchCallout = 'none';
      body.style.webkitUserSelect = 'none';
      body.style.userSelect = 'none';
      body.style.touchAction = 'manipulation';
    }
  }, []);

  const handleAccept = () => {
    console.log('Accept button clicked', { canSubmit, signature, acknowledgedRisks, acknowledgedLiability, acknowledgedCompliance });
    
    if (!canSubmit) {
      console.log('Form validation failed:', getValidationMessage());
      alert(getValidationMessage());
      return;
    }

    try {
      console.log('Processing signature...');
      setDocumentSigned(true);
      
      // Always send message first - even if no opener is detected
      const messageData = {
        type: 'LEGAL_AGREEMENT_SIGNED',
        data: {
          signature,
          signDate: currentDate,
          fullName: signature
        }
      };

      // Try multiple messaging approaches for mobile compatibility
      try {
        // Try parent window first
        if (window.parent && window.parent !== window) {
          console.log('Sending message to parent window...');
          window.parent.postMessage(messageData, '*');
        }
        
        // Try opener if exists
        if (window.opener && !window.opener.closed) {
          console.log('Sending message to opener window...');
          window.opener.postMessage(messageData, '*');
        }

        // Also try sending to all frames
        if (window.top && window.top !== window) {
          console.log('Sending message to top window...');
          window.top.postMessage(messageData, '*');
        }
      } catch (msgError) {
        console.log('Message sending failed:', msgError);
      }

      // For mobile: Show confirmation and allow manual close
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        alert('Legal document signed successfully! This window will now close. If it doesn\'t close automatically, please close it manually.');
      }
      
      // Try to close the window with multiple fallbacks
      setTimeout(() => {
        try {
          console.log('Attempting to close window...');
          
          // Method 1: Standard window.close()
          if (window.close) {
            window.close();
          }
          
          // Method 2: If that doesn't work, try navigation approaches
          setTimeout(() => {
            console.log('Trying navigation fallbacks...');
            try {
              // Try to navigate to blank page
              window.location.replace('about:blank');
            } catch (e) {
              try {
                // Try to go back
                window.history.back();
              } catch (e2) {
                console.log('All close attempts failed');
                // Show instructions for manual close
                document.body.innerHTML = `
                  <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
                    <h2 style="color: green;">✓ Legal Document Signed Successfully!</h2>
                    <p>Please close this window/tab manually to return to the main application.</p>
                    <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; background: #007cba; color: white; border: none; border-radius: 5px; cursor: pointer;">Close Window</button>
                  </div>
                `;
              }
            }
          }, 1000);
          
        } catch (error) {
          console.log('Close attempt failed:', error);
        }
      }, 500);
      
    } catch (error) {
      console.error('Error processing signature:', error);
      alert('Document signed successfully! Please close this window manually.');
    }
  };

  const getValidationMessage = () => {
    if (!signature.trim()) return 'Please enter your full legal name as your electronic signature';
    if (!acknowledgedRisks) return 'Please acknowledge that you understand the risks of live streaming';
    if (!acknowledgedLiability) return 'Please agree to release Public Streamer from liability and provide indemnification';
    if (!acknowledgedCompliance) return 'Please agree to comply with all applicable laws and platform terms';
    return null;
  };

  const handleCancel = () => {
    console.log('Close Window button clicked');
    
    try {
      // Enhanced mobile-specific close handling
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Send success message to parent windows with specific instructions
      const closeMessage = { 
        type: 'LEGAL_DOCUMENT_CLOSE_REQUESTED',
        action: 'close-and-return',
        mobile: isMobile,
        timestamp: Date.now()
      };
      
      console.log('Sending close message to all possible parents...', closeMessage);
      
      // Try all possible parent window references
      const windowTargets = [
        { name: 'parent', ref: window.parent },
        { name: 'opener', ref: window.opener },
        { name: 'top', ref: window.top }
      ];
      
      windowTargets.forEach(target => {
        try {
          if (target.ref && target.ref !== window && !target.ref.closed) {
            console.log(`Sending close message to ${target.name}...`);
            target.ref.postMessage(closeMessage, '*');
            
            // For mobile, also try to navigate the parent directly
            if (isMobile && target.name === 'parent') {
              try {
                // Try to navigate parent back to login/signup
                target.ref.location.href = target.ref.location.origin + '/';
              } catch (navError) {
                console.log('Parent navigation failed:', navError);
              }
            }
          }
        } catch (msgError) {
          console.log(`Message to ${target.name} failed:`, msgError);
        }
      });

      // Mobile-specific close attempts
      if (isMobile) {
        console.log('Mobile detected - using enhanced close methods...');
        
        // Method 1: Try immediate close
        setTimeout(() => {
          try {
            window.close();
          } catch (e) {
            console.log('window.close() failed:', e);
          }
        }, 100);
        
        // Method 2: Try navigation approaches
        setTimeout(() => {
          try {
            // Try to go back in history first
            if (window.history.length > 1) {
              window.history.back();
            } else {
              // Navigate to origin
              window.location.href = window.location.origin + '/';
            }
          } catch (e) {
            console.log('Navigation fallback failed:', e);
            // Final fallback - replace with blank
            try {
              window.location.replace('about:blank');
            } catch (e2) {
              console.log('All close methods failed');
              // Show success message with manual close instruction
              document.body.innerHTML = `
                <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif; background: #f0f9ff;">
                  <h2 style="color: green;">✓ Document Signed Successfully!</h2>
                  <p style="font-size: 18px; margin: 20px 0;">You can now close this window and return to the signup form.</p>
                  <button onclick="window.close(); window.history.back();" style="padding: 15px 30px; font-size: 16px; background: #007cba; color: white; border: none; border-radius: 8px; cursor: pointer; margin: 10px;">Close & Return</button>
                  <br>
                  <p style="font-size: 14px; color: #666; margin-top: 20px;">If the button doesn't work, please manually close this window/tab.</p>
                </div>
              `;
            }
          }
        }, 300);
        
      } else {
        // Desktop close methods
        setTimeout(() => {
          try {
            window.close();
          } catch (e) {
            window.location.replace('about:blank');
          }
        }, 200);
      }
      
    } catch (error) {
      console.error('Error in handleCancel:', error);
      // Show success state regardless of close issues
      document.body.innerHTML = `
        <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif; background: #f0f9ff;">
          <h2 style="color: green;">✓ Document Completed!</h2>
          <p>Please close this window to return to the signup form.</p>
          <button onclick="window.close(); window.history.back();" style="padding: 15px 30px; font-size: 16px; background: #007cba; color: white; border: none; border-radius: 8px; cursor: pointer;">Close Window</button>
        </div>
      `;
    }
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                className="w-full min-h-[48px]"
              />
            </div>
            <div>
              <Label className="text-sm font-medium block mb-1">Date</Label>
              <Input 
                value={currentDate} 
                disabled 
                className="w-full bg-gray-100 min-h-[48px]"
              />
            </div>
          </div>

          <div className="text-xs text-gray-600">
            By signing, you agree this electronic signature has the same legal effect as a handwritten signature.
          </div>

          {/* Validation Error Message */}
          {!canSubmit && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Unable to proceed:</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">{getValidationMessage()}</p>
            </div>
          )}

          {/* Professional centered button layout */}
          <div className="flex flex-col items-center space-y-4 pt-8">
            {/* Main action buttons - side by side and centered */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Cancel button clicked via onClick');
                  handleCancel();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Cancel button touched via onTouchEnd');
                  setTimeout(() => handleCancel(), 100);
                }}
                className="w-48 px-6 py-3 min-h-[48px] text-base font-medium border-2 border-gray-400 rounded-lg bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 transition-colors duration-200 cursor-pointer shadow-md"
                style={{ 
                  WebkitTapHighlightColor: 'rgba(0,0,0,0.1)',
                  touchAction: 'manipulation',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none'
                }}
              >
                Cancel
              </button>
              
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Accept button clicked via onClick', { canSubmit });
                  if (canSubmit) {
                    handleAccept();
                  } else {
                    alert(getValidationMessage());
                  }
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Accept button touched via onTouchEnd', { canSubmit });
                  if (canSubmit) {
                    setTimeout(() => handleAccept(), 100);
                  } else {
                    setTimeout(() => alert(getValidationMessage()), 100);
                  }
                }}
                disabled={!canSubmit}
                className={`w-48 px-6 py-3 min-h-[48px] text-base font-medium rounded-lg transition-colors duration-200 cursor-pointer shadow-md ${
                  canSubmit 
                    ? 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white border-2 border-green-600' 
                    : 'bg-gray-300 cursor-not-allowed text-gray-500 border-2 border-gray-300'
                }`}
                style={{ 
                  WebkitTapHighlightColor: canSubmit ? 'rgba(0,255,0,0.2)' : 'rgba(0,0,0,0.1)',
                  touchAction: 'manipulation',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none'
                }}
              >
                {canSubmit ? (
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Accept and Sign
                  </div>
                ) : (
                  'Accept and Sign'
                )}
              </button>
            </div>

            {/* Close Window Button - only visible after document is signed */}
            {documentSigned && (
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Close Window button clicked via onClick');
                  handleCancel();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Close Window button touched via onTouchEnd');
                  setTimeout(() => handleCancel(), 100);
                }}
                className="w-48 px-6 py-3 min-h-[48px] text-base font-medium rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white border-2 border-blue-600 shadow-md transition-colors duration-200 cursor-pointer"
                style={{ 
                  WebkitTapHighlightColor: 'rgba(0,123,255,0.2)',
                  touchAction: 'manipulation',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none'
                }}
              >
                Close Window
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalDocumentPage;