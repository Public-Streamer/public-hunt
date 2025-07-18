import React, { useState } from 'react';
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
import { LegalDocumentModal } from "./LegalDocumentModal";
import { useAppContext } from '@/contexts/AppContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import ResetPasswordForm from './ResetPasswordForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ErrorDialog from './ErrorDialog';
import UserSearchBox from './UserSearchBox';

interface SignupFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  inline?: boolean;
}

const SignupForm: React.FC<SignupFormProps> = ({ onClose, onSuccess, inline = false }) => {
  const { signUp } = useAppContext();
  const navigate = useNavigate();
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
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalDocumentSigned, setLegalDocumentSigned] = useState(false);
  const [signatureData, setSignatureData] = useState<{ signature: string; date: string } | null>(null);
  const [emailVerification, setEmailVerification] = useState("");
  const [passwordVerification, setPasswordVerification] = useState("");
  const [acknowledgedRisks, setAcknowledgedRisks] = useState(false);
  const [acknowledgedLiability, setAcknowledgedLiability] = useState(false);
  const [acknowledgedCompliance, setAcknowledgedCompliance] = useState(false);
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

  const handleTermsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Legal button clicked, current showLegalModal:", showLegalModal);
    setShowLegalModal(true);
    console.log("setShowLegalModal called with true");
  };

  const handleLegalAccept = (signature: string, date: string) => {
    setSignatureData({ signature, date });
    setLegalDocumentSigned(true);
    setShowLegalModal(false);
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
    <>
      {step === 1 && (
        <form onSubmit={handleStep1Submit} className="space-y-4">
          <div className="space-y-3">
            <Label>Will this account be created for an individual or a company?</Label>
            <RadioGroup
              value={signupData.accountType}
              onValueChange={(value: 'individual' | 'company') => setSignupData(prev => ({ ...prev, accountType: value }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="individual" />
                <Label htmlFor="individual">Individual</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="company" id="company" />
                <Label htmlFor="company">Company</Label>
              </div>
            </RadioGroup>
          </div>
          
          {signupData.accountType === 'company' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company</Label>
                <Input
                  id="companyName"
                  value={signupData.companyName}
                  onChange={(e) => setSignupData(prev => ({ ...prev, companyName: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Select Company Account Master</Label>
                <UserSearchBox
                  onUserSelect={(user) => {
                    setSignupData(prev => ({ 
                      ...prev, 
                      companyAccountMaster: user
                    }));
                  }}
                  selectedUser={signupData.companyAccountMaster}
                  placeholder="Search for existing profile to designate as Company Account Master..."
                />
              </div>
            </div>
          )}
          
          <div className="flex flex-col items-center space-y-2">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={photoPreview || undefined} />
                <AvatarFallback>
                  <Camera className="w-8 h-8 text-gray-400" />
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 bg-purple-600 text-white rounded-full p-1 cursor-pointer hover:bg-purple-700">
                <Upload className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
            <Label className="text-sm text-gray-600">
              {signupData.accountType === 'company' ? 'Company Profile Photo' : 'Profile Photo'}
            </Label>
          </div>
          
          {/* Only show name fields for individual accounts or company accounts without master selected */}
          {(signupData.accountType === 'individual' || 
            (signupData.accountType === 'company' && !signupData.companyAccountMaster)) && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={signupData.firstName}
                  onChange={(e) => setSignupData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={signupData.lastName}
                  onChange={(e) => setSignupData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={signupData.email}
              onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={signupData.password}
              onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
              required
            />
          </div>
            
          {/* Only show confirm password and birth date for individual accounts or company accounts without master selected */}
          {(signupData.accountType === 'individual' || 
            (signupData.accountType === 'company' && !signupData.companyAccountMaster)) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={signupData.confirmPassword}
                  onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Birth Date (Must be 18+)</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={signupData.birthDate}
                  onChange={(e) => setSignupData(prev => ({ ...prev, birthDate: e.target.value }))}
                  required
                />
              </div>
            </>
          )}
          
          <div className="space-y-2">
            <Button type="submit" className="w-full">Continue</Button>
            <Button type="button" variant="outline" onClick={onClose} className="w-full">
              Cancel
            </Button>
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
              <div className="space-y-4 mb-4 p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium text-sm">Company Account Master Verification</h4>
                <p className="text-xs text-muted-foreground">
                  Please re-enter your email and password to verify you are the Company Account Master
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emailVerification">Verify Email</Label>
                    <Input
                      id="emailVerification"
                      type="email"
                      value={emailVerification}
                      onChange={(e) => setEmailVerification(e.target.value)}
                      placeholder="Re-enter your email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="passwordVerification">Verify Password</Label>
                    <Input
                      id="passwordVerification"
                      type="password"
                      value={passwordVerification}
                      onChange={(e) => setPasswordVerification(e.target.value)}
                      placeholder="Re-enter your password"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">
                {signupData.accountType === 'company' ? 'Company Phone Number' : 'Phone Number'}
              </Label>
              <Input
                id="phone"
                type="tel"
                value={signupData.phone}
                onChange={handlePhoneChange}
                placeholder="XXX-XXX-XXXX"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">
                {signupData.accountType === 'company' ? 'Company Location' : 'Location'}
              </Label>
              <Input
                id="location"
                value={signupData.location}
                onChange={(e) => setSignupData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="City, State/Country"
                required
              />
          </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">
                {signupData.accountType === 'company' ? 'Company Story' : 'Bio'}
              </Label>
              <Textarea
                id="bio"
                value={signupData.bio}
                onChange={(e) => setSignupData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder={signupData.accountType === 'company' ? 'Tell the world about your company...' : 'Tell us about yourself...'}
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
                    onClick={() => setShowLegalModal(true)}
                    className="text-blue-600 underline hover:text-blue-800 text-sm mt-1"
                  >
                    Click here to sign the Legal Protection Agreement
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
          
          <div className="space-y-2">
            <Button type="submit" className="w-full" disabled={!signupData.agreeToTerms || !signupData.confirmAge || !legalDocumentSigned || loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-full">
              Back
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="w-full">
              Cancel
            </Button>
          </div>
        </form>
      )}
    </>
  );

  if (inline) {
    return formContent;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md max-h-[90vh]">
          <CardHeader>
            <CardTitle>Create Your Streamura Account</CardTitle>
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
                {showResetPassword && (
                  <Button
                    variant="link"
                    className="mt-2 p-0"
                    onClick={() => setShowResetPassword(true)}
                  >
                    Reset Password
                  </Button>
                )}
              </Alert>
            )}
          </CardHeader>
          <CardContent className="h-[75vh] p-0">
            <ScrollArea className="h-full w-full px-6 pb-6">
              {formContent}
            </ScrollArea>
          </CardContent>
        </Card>
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

      {/* Simple direct modal - no external component */}
      {showLegalModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '30px',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }}
          >
            <h2 style={{ color: 'red', fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
              🚨 LEGAL AGREEMENT REQUIRED 🚨
            </h2>
            
            <div style={{ maxHeight: '400px', overflow: 'auto', marginBottom: '20px', padding: '15px', border: '2px solid #ccc' }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '10px' }}>STREAMURA PROTECTION WAIVER</h3>
              <p style={{ marginBottom: '15px' }}>
                By using Streamura, you agree to HOLD HARMLESS and INDEMNIFY Streamura from ALL claims, damages, and liability arising from your content or use of the platform.
              </p>
              <p style={{ marginBottom: '15px' }}>
                You acknowledge that Streamura is NOT LIABLE for any content you create, upload, or stream, including but not limited to copyright violations, defamatory content, privacy violations, or any damages whatsoever.
              </p>
              <p style={{ marginBottom: '15px' }}>
                This agreement includes complete liability waiver, indemnification, and binding arbitration. By signing, you waive rights to class action lawsuits.
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px' }}>
                <input 
                  type="checkbox" 
                  checked={acknowledgedRisks}
                  onChange={(e) => setAcknowledgedRisks(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                I acknowledge the risks and liability waivers
              </label>
              
              <label style={{ display: 'block', marginBottom: '10px' }}>
                <input 
                  type="checkbox" 
                  checked={acknowledgedLiability}
                  onChange={(e) => setAcknowledgedLiability(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                I agree to indemnify Streamura from all claims
              </label>
              
              <label style={{ display: 'block', marginBottom: '15px' }}>
                <input 
                  type="checkbox" 
                  checked={acknowledgedCompliance}
                  onChange={(e) => setAcknowledgedCompliance(e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                I will comply with all laws and platform terms
              </label>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Electronic Signature (Type your full legal name):
              </label>
              <input
                type="text"
                value={signatureData?.signature || ''}
                onChange={(e) => setSignatureData({ signature: e.target.value, date: new Date().toLocaleDateString() })}
                placeholder="Type your full legal name here"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '2px solid #ccc', 
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowLegalModal(false)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (acknowledgedRisks && acknowledgedLiability && acknowledgedCompliance && signatureData?.signature) {
                    setLegalDocumentSigned(true);
                    setShowLegalModal(false);
                  } else {
                    alert('Please complete all fields and checkboxes before signing.');
                  }
                }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                I ACCEPT AND SIGN
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SignupForm;