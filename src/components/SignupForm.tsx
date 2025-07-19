import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Upload, Camera } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import { useAppContext } from '@/contexts/AppContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import ResetPasswordForm from './ResetPasswordForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ErrorDialog from './ErrorDialog';
import UserSearchBox from './UserSearchBox';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';

interface SignupFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  inline?: boolean;
}

const SignupForm: React.FC<SignupFormProps> = ({ onClose, onSuccess, inline = false }) => {
  const { signUp } = useAppContext();
  const navigate = useNavigate();

  // Listen for messages from popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'LEGAL_AGREEMENT_SIGNED') {
        const { fullName, signature, signDate } = event.data.data;
        setSignatureData({ signature, date: signDate });
        setLegalDocumentSigned(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
  const [signupData, setSignupData] = useState({
    accountType: 'individual' as 'individual' | 'company',
    companyName: '',
    companyAccountMaster: null as any,
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    location: '',
    bio: '',
    birthDate: '',
    profilePhoto: null as File | null,
    agreeToTerms: false,
    confirmAge: false
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [legalDocumentSigned, setLegalDocumentSigned] = useState(false);
  const [signatureData, setSignatureData] = useState<{ signature: string; date: string } | null>(null);
  const [emailVerification, setEmailVerification] = useState("");
  const [passwordVerification, setPasswordVerification] = useState("");
  // Use state to control error dialog visibility
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorDialogConfig, setErrorDialogConfig] = useState<{
    title: string;
    message: string;
  }>({ title: '', message: '' });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSignupData(prev => ({ ...prev, profilePhoto: file }));
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };
  
  // Format phone number with hyphens (xxx-xxx-xxxx)
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format with hyphens
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhone = formatPhoneNumber(e.target.value);
    setSignupData(prev => ({ ...prev, phone: formattedPhone }));
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate company name if account type is company
    if (signupData.accountType === 'company' && !signupData.companyName.trim()) {
      setErrorDialogConfig({
        title: 'Company Name Required',
        message: 'Please enter a company name.'
      });
      setShowErrorDialog(true);
      return;
    }
    
    // Validate company account master if account type is company
    if (signupData.accountType === 'company' && !signupData.companyAccountMaster) {
      setErrorDialogConfig({
        title: 'Company Account Master Required',
        message: 'Please select a Company Account Master.'
      });
      setShowErrorDialog(true);
      return;
    }
    
    // Only validate personal info fields if individual account or company without master selected
    if (signupData.accountType === 'individual' || 
        (signupData.accountType === 'company' && !signupData.companyAccountMaster)) {
      
      // Validate passwords match
      if (signupData.password !== signupData.confirmPassword) {
        setErrorDialogConfig({
          title: 'Password Error',
          message: 'Passwords do not match.'
        });
        setShowErrorDialog(true);
        return;
      }
      
      // Validate first and last name
      if (!signupData.firstName || !signupData.lastName) {
        setErrorDialogConfig({
          title: 'Name Required',
          message: 'Please enter your first and last name.'
        });
        setShowErrorDialog(true);
        return;
      }
      
      // Age validation - ensure users are 18+
      if (!signupData.birthDate) {
        setErrorDialogConfig({
          title: 'Birth Date Required',
          message: 'Please enter your birth date.'
        });
        setShowErrorDialog(true);
        return;
      }
      
      const age = calculateAge(signupData.birthDate);
      if (age < 18) {
        setErrorDialogConfig({
          title: 'Age Restriction',
          message: 'Members must be 18 years old to join.'
        });
        setShowErrorDialog(true);
        return;
      }
    }
    
    setStep(2);
  };


  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For company accounts, verify email and password match
    if (signupData.accountType === 'company') {
      if (emailVerification !== signupData.email) {
        setError("Email verification does not match your account email");
        return;
      }
      if (passwordVerification !== signupData.password) {
        setError("Password verification does not match your account password");
        return;
      }
    }
    
    if (!signupData.agreeToTerms || !signupData.confirmAge || !legalDocumentSigned) {
      setError('Please complete the legal agreement and accept all terms.');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const result = await signUp(signupData.email, signupData.password, {
        accountType: signupData.accountType,
        companyName: signupData.companyName,
        companyAccountMaster: signupData.companyAccountMaster,
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        phone: signupData.phone,
        location: signupData.location,
        bio: signupData.bio,
        birthDate: signupData.birthDate,
        profilePhoto: photoPreview || undefined
      });
      
      if (result.error) {
        if (result.error.toLowerCase().includes('email already exists') || 
            result.error.toLowerCase().includes('user already registered')) {
          setError('An account with this email already exists.');
          setShowResetPassword(true);
        } else {
          setError(result.error);
        }
      } else {
        if (onSuccess) {
          onSuccess();
        } else {
          onClose();
        }
      }
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <div className="w-full max-w-sm mx-auto">
      {step === 1 && (
        <form onSubmit={handleStep1Submit} className="space-y-5">
          {/* Account Type Selection */}
          <div className="text-center space-y-3">
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-2">Account Type</h3>
              <p className="text-sm text-gray-600 px-2">Choose whether this account is for an individual or company</p>
            </div>
            <RadioGroup
              value={signupData.accountType}
              onValueChange={(value: 'individual' | 'company') => setSignupData(prev => ({ ...prev, accountType: value }))}
              className="flex justify-center gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="individual" />
                <Label htmlFor="individual" className="text-sm font-medium">Individual</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="company" id="company" />
                <Label htmlFor="company" className="text-sm font-medium">Company</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Company Fields */}
          {signupData.accountType === 'company' && (
            <div className="space-y-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 text-center">Company Information</h4>
              
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                  Company Name *
                </Label>
                <Input
                  id="companyName"
                  value={signupData.companyName}
                  onChange={(e) => setSignupData(prev => ({ ...prev, companyName: e.target.value }))}
                  className="w-full h-10 text-sm"
                  placeholder="Enter company name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Company Account Master *
                </Label>
                <UserSearchBox
                  onUserSelect={(user) => {
                    setSignupData(prev => ({ 
                      ...prev, 
                      companyAccountMaster: user
                    }));
                  }}
                  selectedUser={signupData.companyAccountMaster}
                  placeholder="Search for existing profile..."
                />
              </div>
            </div>
          )}

          {/* Profile Photo */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="relative">
                <Avatar className="w-20 h-20 border-2 border-gray-200">
                  <AvatarImage src={photoPreview || undefined} />
                  <AvatarFallback className="bg-gray-100">
                    <Camera className="w-6 h-6 text-gray-400" />
                  </AvatarFallback>
                </Avatar>
                <label className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 cursor-pointer shadow-md">
                  <Upload className="w-3 h-3" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <p className="text-xs text-gray-600">Profile Photo (Optional)</p>
          </div>

          {/* Personal Info - Only for individual or company without master */}
          {(signupData.accountType === 'individual' || 
            (signupData.accountType === 'company' && !signupData.companyAccountMaster)) && (
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="text-sm font-medium text-gray-900">Personal Information</h4>
              </div>
              
              {/* Name Fields */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    value={signupData.firstName}
                    onChange={(e) => setSignupData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full h-10 text-sm"
                    placeholder="John"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    value={signupData.lastName}
                    onChange={(e) => setSignupData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full h-10 text-sm"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              {/* Birth Date */}
              <div className="space-y-2">
                <Label htmlFor="birthDate" className="text-sm font-medium text-gray-700">
                  Birth Date *
                </Label>
                <p className="text-xs text-gray-600">Must be 18 years or older</p>
                <Input
                  id="birthDate"
                  type="date"
                  value={signupData.birthDate}
                  onChange={(e) => setSignupData(prev => ({ ...prev, birthDate: e.target.value }))}
                  className="w-full h-10 text-sm"
                  required
                />
              </div>
            </div>
          )}

          {/* Account Credentials */}
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-900">Account Credentials</h4>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={signupData.email}
                  onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full h-10 text-sm"
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password *
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={signupData.password}
                  onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full h-10 text-sm"
                  placeholder="Create a secure password"
                  required
                />
              </div>

              {/* Confirm Password - Only for individual or company without master */}
              {(signupData.accountType === 'individual' || 
                (signupData.accountType === 'company' && !signupData.companyAccountMaster)) && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirm Password *
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full h-10 text-sm"
                    placeholder="Re-enter your password"
                    required
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <Button 
              type="submit" 
              className="w-full h-10 text-sm font-medium bg-blue-600 hover:bg-blue-700"
            >
              Continue
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="w-full h-10 text-sm font-medium"
            >
              Cancel
            </Button>
          </div>

          {/* Login Link */}
          <div className="text-center pt-2 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {/* Add login navigation */}}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleFinalSubmit} className="space-y-4">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold mb-2">Complete Your Profile</h3>
          </div>

          <div className="space-y-4">
            {signupData.accountType === 'company' && (
              <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                <h4 className="font-medium text-sm text-blue-900">Company Account Master Verification</h4>
                <p className="text-xs text-blue-700">
                  Please re-enter your email and password to verify you are the Company Account Master
                </p>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="emailVerification" className="text-sm font-medium">Verify Email</Label>
                    <Input
                      id="emailVerification"
                      type="email"
                      value={emailVerification}
                      onChange={(e) => setEmailVerification(e.target.value)}
                      placeholder="Re-enter your email"
                      className="h-10 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="passwordVerification" className="text-sm font-medium">Verify Password</Label>
                    <Input
                      id="passwordVerification"
                      type="password"
                      value={passwordVerification}
                      onChange={(e) => setPasswordVerification(e.target.value)}
                      placeholder="Re-enter your password"
                      className="h-10 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                {signupData.accountType === 'company' ? 'Company Phone Number' : 'Phone Number'}
              </Label>
              <Input
                id="phone"
                type="tel"
                value={signupData.phone}
                onChange={handlePhoneChange}
                placeholder="XXX-XXX-XXXX"
                className="h-10 text-sm"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                {signupData.accountType === 'company' ? 'Company Location' : 'Location'}
              </Label>
              <Input
                id="location"
                value={signupData.location}
                onChange={(e) => setSignupData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="City, State/Country"
                className="h-10 text-sm"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium text-gray-700">
                {signupData.accountType === 'company' ? 'Company Story' : 'Bio'}
              </Label>
              <Textarea
                id="bio"
                value={signupData.bio}
                onChange={(e) => setSignupData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder={signupData.accountType === 'company' ? 'Tell the world about your company...' : 'Tell us about yourself...'}
                className="min-h-[80px] resize-none text-sm"
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="space-y-3">
              {legalDocumentSigned && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">
                    ✓ Legal Protection Agreement Signed
                  </p>
                  <p className="text-xs text-green-600">
                    Signed by: {signatureData?.signature} on {signatureData?.date}
                  </p>
                </div>
              )}
              
              {!legalDocumentSigned && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 font-medium">
                    ⚠️ Legal Protection Agreement Required
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      // Open legal document in new window for signing
                      const legalWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
                      if (legalWindow) {
                        legalWindow.document.write(`
                          <html>
                            <head>
                              <title>Legal Protection Agreement</title>
                              <style>
                                body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                                .header { text-align: center; margin-bottom: 30px; }
                                .signature-section { margin-top: 40px; padding: 20px; border: 2px solid #ddd; background: #f9f9f9; }
                                input[type="text"] { border: 1px solid #ccc; padding: 8px; margin: 5px; }
                                button { background: #4F46E5; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
                                button:hover { background: #3730A3; }
                                .terms { margin: 20px 0; }
                              </style>
                            </head>
                            <body>
                              <div class="header">
                                <h1>Legal Protection Agreement</h1>
                                <p><strong>Effective Date:</strong> ${new Date().toLocaleDateString()}</p>
                              </div>
                              
                              <div class="terms">
                                <h2>1. Risk Acknowledgment</h2>
                                <p>By using this platform, you acknowledge that live streaming events carry inherent risks including but not limited to technical failures, content disputes, and potential exposure to inappropriate content.</p>
                                
                                <h2>2. Liability Limitations</h2>
                                <p>The platform and its operators shall not be held liable for any damages, losses, or injuries resulting from your use of the service, participation in events, or interactions with other users.</p>
                                
                                <h2>3. User Compliance</h2>
                                <p>You agree to comply with all applicable laws, platform terms of service, and community guidelines. You are responsible for your actions and content on the platform.</p>
                                
                                <h2>4. Age Verification</h2>
                                <p>You confirm that you are at least 18 years of age and have the legal capacity to enter into this agreement.</p>
                                
                                <h2>5. Content Rights</h2>
                                <p>You retain ownership of your content but grant the platform necessary rights to host, distribute, and display your content as part of the service.</p>
                              </div>
                              
                              <div class="signature-section">
                                <h3>Electronic Signature</h3>
                                <p>By signing below, you acknowledge that you have read, understood, and agree to all terms in this Legal Protection Agreement.</p>
                                
                                <form onsubmit="submitSignature(event)">
                                  <p>
                                    <label>Full Name: </label>
                                    <input type="text" id="fullName" required style="width: 300px;" />
                                  </p>
                                  <p>
                                    <label>Electronic Signature: </label>
                                    <input type="text" id="signature" placeholder="Type your full name" required style="width: 300px;" />
                                  </p>
                                  <p>
                                    <label>Date: </label>
                                    <input type="text" id="signDate" value="${new Date().toLocaleDateString()}" readonly />
                                  </p>
                                  <p style="margin-top: 20px;">
                                    <button type="submit">Sign Agreement</button>
                                    <button type="button" onclick="window.close()" style="background: #6B7280; margin-left: 10px;">Cancel</button>
                                  </p>
                                </form>
                              </div>
                              
                              <script>
                                function submitSignature(event) {
                                  event.preventDefault();
                                  const fullName = document.getElementById('fullName').value;
                                  const signature = document.getElementById('signature').value;
                                  const signDate = document.getElementById('signDate').value;
                                  
                                  if (fullName && signature) {
                                    window.opener.postMessage({
                                      type: 'LEGAL_AGREEMENT_SIGNED',
                                      data: { fullName, signature, signDate }
                                    }, '*');
                                    alert('Agreement signed successfully! You can now close this window.');
                                    window.close();
                                  }
                                }
                              </script>
                            </body>
                          </html>
                        `);
                        legalWindow.document.close();
                      }
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors mt-2 text-sm"
                  >
                    📄 Open Legal Agreement to Sign
                  </button>
                </div>
              )}

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="confirmAge"
                  checked={signupData.confirmAge}
                  onCheckedChange={(checked) => setSignupData(prev => ({ ...prev, confirmAge: checked as boolean }))}
                />
                <Label htmlFor="confirmAge" className="text-sm leading-relaxed">
                  I confirm that I am at least 18 years old.
                </Label>
              </div>
              
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="agreeToTerms"
                  checked={signupData.agreeToTerms}
                  onCheckedChange={(checked) => setSignupData(prev => ({ ...prev, agreeToTerms: checked as boolean }))}
                />
                <Label htmlFor="agreeToTerms" className="text-sm leading-relaxed">
                  I agree to the Terms of Service and Privacy Policy.
                </Label>
              </div>
            </div>
          </div>
          
          <div className="space-y-3 pt-2">
            <Button 
              type="submit" 
              className="w-full h-10 text-sm font-medium bg-blue-600 hover:bg-blue-700"
              disabled={!signupData.agreeToTerms || !signupData.confirmAge || !legalDocumentSigned || loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-full h-10 text-sm font-medium">
              Back
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="w-full h-10 text-sm font-medium">
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );

  if (inline) {
    return (
      <div className="w-full max-w-md mx-auto">
        {formContent}
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-xl flex flex-col max-h-[95vh]">
          {/* Clean Header */}
          <div className="px-6 py-4 text-center border-b border-gray-200 shrink-0">
            <h2 className="text-xl font-bold text-gray-900">Create Account</h2>
            <p className="text-gray-600 mt-1 text-sm">Join Public Streamer today</p>
            
            {error && (
              <Alert variant="destructive" className="mt-3">
                <AlertDescription className="text-sm">{error}</AlertDescription>
                {showResetPassword && (
                  <Button
                    variant="link"
                    className="mt-2 p-0 text-sm underline"
                    onClick={() => setShowResetPassword(true)}
                  >
                    Reset Password
                  </Button>
                )}
              </Alert>
            )}
          </div>
          
          {/* Scrollable Content with Ultra-Thin Scrollbar */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400" 
               style={{
                 scrollbarWidth: 'thin',
                 scrollbarColor: '#d1d5db #f3f4f6'
               }}>
            {formContent}
          </div>
        </div>
      </div>
      {showResetPassword && (
        <ResetPasswordForm onClose={() => setShowResetPassword(false)} />
      )}
      <ErrorDialog
        open={showErrorDialog}
        onClose={() => setShowErrorDialog(false)}
        title={errorDialogConfig.title}
        message={errorDialogConfig.message}
        showResetPassword={false}
      />
    </>
  );
};

export default SignupForm;