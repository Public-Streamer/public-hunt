import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Upload, Camera, Info } from 'lucide-react';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';
import LiveStreamLogo from '@/components/ui/live-stream-logo';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  

  // Listen for messages from popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Handle both old and new message types for legal document completion
      if (event.data.type === 'LEGAL_AGREEMENT_SIGNED' || event.data.type === 'LEGAL_AGREEMENT_COMPLETED') {
        const { fullName, signature, signDate } = event.data.data;
        setSignatureData({ signature, date: signDate });
        setLegalDocumentSigned(true);
        
        console.log('Legal document completed successfully, signature received:', { fullName, signature, signDate });
        
        // Mobile-specific: Force close popup if it's still open
        if (popupWindowRef.current && !popupWindowRef.current.closed) {
          try {
            popupWindowRef.current.close();
          } catch (error) {
            console.log('Error closing popup:', error);
          }
        }
      } else if (event.data.type === 'legal-document-cancelled' || event.data.type === 'LEGAL_DOCUMENT_CLOSE_REQUESTED') {
        // Handle cancellation - just close the popup
        if (popupWindowRef.current && !popupWindowRef.current.closed) {
          try {
            popupWindowRef.current.close();
          } catch (error) {
            console.log('Error closing popup:', error);
          }
        }
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

  // Restore form data and step from sessionStorage if returning from mobile legal document
  useEffect(() => {
    const savedFormData = sessionStorage.getItem('signupFormData');
    const savedStep = sessionStorage.getItem('signupStep');
    const legalCompleted = sessionStorage.getItem('legalDocumentCompleted');
    
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        setSignupData(parsedData);
        sessionStorage.removeItem('signupFormData'); // Clean up
        console.log('Restored signup form data from sessionStorage:', parsedData);
      } catch (error) {
        console.error('Error restoring signup form data:', error);
      }
    }
    
    if (savedStep) {
      const stepNumber = parseInt(savedStep, 10);
      if (stepNumber >= 1 && stepNumber <= 3) {
        setStep(stepNumber);
        sessionStorage.removeItem('signupStep');
        console.log('Restored signup step:', stepNumber);
      }
    }
    
    if (legalCompleted === 'true') {
      setLegalDocumentSigned(true);
      sessionStorage.removeItem('legalDocumentCompleted');
      console.log('Restored legal document completion status');
    }
  }, []);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const totalSteps = 3;
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
  
  // Keep reference to popup window for mobile closing
  const popupWindowRef = useRef<Window | null>(null);
  
  // Validation error states for real-time feedback
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  // Helper function to check if a field has an error
  const hasFieldError = (fieldName: string) => {
    return validationErrors[fieldName] !== undefined;
  };

  // Helper function to get field error class
  const getFieldErrorClass = (fieldName: string) => {
    return hasFieldError(fieldName) ? 'border-red-500 bg-red-50 ring-red-500' : '';
  };

  // Real-time validation effect - optimized to prevent focus issues
  useEffect(() => {
    // Only validate on blur or form submission, not during typing
    const timeoutId = setTimeout(() => {
      // Skip validation if any input is currently focused to prevent cursor jumping
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      const errors: { [key: string]: string } = {};

      // Step 1 validations
      if (step >= 1) {
        if (signupData.accountType === 'company' && !signupData.companyName.trim()) {
          errors.companyName = 'Company name is required';
        }
        if (signupData.accountType === 'company' && !signupData.companyAccountMaster) {
          errors.companyAccountMaster = 'Company Account Master is required';
        }
        if (!signupData.email) {
          errors.email = 'Email is required';
        }
        if (!signupData.password) {
          errors.password = 'Password is required';
        }
      }

      // Step 2 validations
      if (step >= 2 && (signupData.accountType === 'individual' || 
          (signupData.accountType === 'company' && !signupData.companyAccountMaster))) {
        if (signupData.password !== signupData.confirmPassword && signupData.confirmPassword) {
          errors.confirmPassword = 'Passwords do not match';
        }
        if (!signupData.firstName) {
          errors.firstName = 'First name is required';
        }
        if (!signupData.lastName) {
          errors.lastName = 'Last name is required';
        }
        if (!signupData.birthDate) {
          errors.birthDate = 'Birth date is required';
        }
        if (signupData.birthDate && calculateAge(signupData.birthDate) < 18) {
          errors.birthDate = 'You must be at least 18 years old';
        }
      }

      // Step 3 validations
      if (step >= 3) {
        if (signupData.accountType === 'company') {
          if (emailVerification && emailVerification !== signupData.email) {
            errors.emailVerification = 'Email verification does not match';
          }
          if (passwordVerification && passwordVerification !== signupData.password) {
            errors.passwordVerification = 'Password verification does not match';
          }
        }
        if (!signupData.agreeToTerms) {
          errors.agreeToTerms = 'You must agree to the Terms of Service';
        }
        if (!signupData.confirmAge) {
          errors.confirmAge = 'You must confirm you are 18 or older';
        }
        if (!legalDocumentSigned) {
          errors.legalDocument = 'Legal document must be signed';
        }
      }

      setValidationErrors(errors);
    }, 1000); // Increased debounce time to 1 second

    return () => clearTimeout(timeoutId);
  }, [signupData, emailVerification, passwordVerification, legalDocumentSigned, step]);

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

  // Validation helper functions
  const getStep1ValidationError = () => {
    if (signupData.accountType === 'company' && !signupData.companyName.trim()) {
      return 'Please enter a company name';
    }
    if (signupData.accountType === 'company' && !signupData.companyAccountMaster) {
      return 'Please select a Company Account Master';
    }
    if (!signupData.email) {
      return 'Please enter your email';
    }
    if (!signupData.password) {
      return 'Please enter your password';
    }
    return null;
  };

  const getStep2ValidationError = () => {
    if (signupData.accountType === 'individual' || 
        (signupData.accountType === 'company' && !signupData.companyAccountMaster)) {
      if (signupData.password !== signupData.confirmPassword) {
        return 'Passwords do not match';
      }
      if (!signupData.firstName) {
        return 'Please enter your first name';
      }
      if (!signupData.lastName) {
        return 'Please enter your last name';
      }
      if (!signupData.birthDate) {
        return 'Please enter your birth date';
      }
      const age = calculateAge(signupData.birthDate);
      if (age < 18) {
        return 'You must be 18 years or older to join';
      }
    }
    return null;
  };

  const getStep3ValidationError = () => {
    if (signupData.accountType === 'company') {
      if (emailVerification !== signupData.email) {
        return 'Email verification does not match';
      }
      if (passwordVerification !== signupData.password) {
        return 'Password verification does not match';
      }
    }
    if (!signupData.agreeToTerms) {
      return 'Please agree to the Terms of Service';
    }
    if (!signupData.confirmAge) {
      return 'Please confirm you are 18 or older';
    }
    if (!legalDocumentSigned) {
      return 'Please sign the legal document';
    }
    return null;
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate account type and basic info
    if (signupData.accountType === 'company' && !signupData.companyName.trim()) {
      setErrorDialogConfig({
        title: 'Company Name Required',
        message: 'Please enter a company name.'
      });
      setShowErrorDialog(true);
      return;
    }
    
    if (signupData.accountType === 'company' && !signupData.companyAccountMaster) {
      setErrorDialogConfig({
        title: 'Company Account Master Required',
        message: 'Please select a Company Account Master.'
      });
      setShowErrorDialog(true);
      return;
    }
    
    // Validate email and password
    if (!signupData.email || !signupData.password) {
      setErrorDialogConfig({
        title: 'Required Fields',
        message: 'Please enter your email and password.'
      });
      setShowErrorDialog(true);
      return;
    }
    
    setStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    
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
    
    setStep(3);
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
    <div className="w-full">
      {/* Progress indicator */}
      <div className="flex items-center justify-center mb-4">
        {[1, 2, 3].map((pageNum) => (
          <div key={pageNum} className="flex items-center">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                step >= pageNum
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {pageNum}
            </div>
            {pageNum < 3 && (
              <div
                className={`w-8 h-0.5 mx-1 ${
                  step > pageNum ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Page 1: Account Type & Basic Info */}
      {step === 1 && (
        <form onSubmit={handleStep1Submit} className="space-y-3">
          <div className="text-center mb-3">
            <h3 className="text-base font-semibold">Account Setup</h3>
            <p className="text-xs text-muted-foreground">Choose your account type and enter basic information</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Account Type</Label>
            <RadioGroup
              value={signupData.accountType}
              onValueChange={(value: 'individual' | 'company') => setSignupData(prev => ({ ...prev, accountType: value }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="individual" />
                <Label htmlFor="individual" className="text-sm">Individual</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="company" id="company" />
                <Label htmlFor="company" className="text-sm">Company</Label>
              </div>
            </RadioGroup>
          </div>
          
          {signupData.accountType === 'company' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="companyName" className="text-sm">Company Name</Label>
                <TooltipWrapper 
                  content={validationErrors.companyName || "Enter your company name"}
                  disabled={!validationErrors.companyName}
                >
                  <Input
                    id="companyName"
                    value={signupData.companyName}
                    onChange={(e) => setSignupData(prev => ({ ...prev, companyName: e.target.value }))}
                    required
                    className={`h-8 text-sm ${getFieldErrorClass('companyName')}`}
                  />
                </TooltipWrapper>
              </div>
              
              <div className="space-y-1">
                <Label className="text-sm">Company Account Master</Label>
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
          
          <div className="space-y-1">
            <Label htmlFor="email" className="text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              value={signupData.email}
              onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
              required
              className={`h-8 text-sm ${getFieldErrorClass('email')}`}
              autoComplete="email"
              placeholder="Enter your email address"
            />
            {validationErrors.email && (
              <p className="text-xs text-destructive mt-1">{validationErrors.email}</p>
            )}
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="password" className="text-sm">Password</Label>
            <Input
              id="password"
              type="password"
              value={signupData.password}
              onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
              required
              className={`h-8 text-sm ${getFieldErrorClass('password')}`}
              autoComplete="new-password"
              placeholder="Create a secure password"
            />
            {validationErrors.password && (
              <p className="text-xs text-destructive mt-1">{validationErrors.password}</p>
            )}
          </div>
          
          <div className="flex space-x-2 pt-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-8 text-sm">
              Cancel
            </Button>
            <TooltipWrapper 
              content={getStep1ValidationError() || "Continue to personal details"}
              disabled={!getStep1ValidationError()}
            >
              <Button 
                type="submit" 
                className="flex-1 h-8 text-sm"
                disabled={!!getStep1ValidationError()}
              >
                Next
              </Button>
            </TooltipWrapper>
          </div>
        </form>
      )}

      {/* Page 2: Personal Details */}
      {step === 2 && (
        <form onSubmit={handleStep2Submit} className="space-y-3">
          <div className="text-center mb-3">
            <h3 className="text-base font-semibold">Personal Details</h3>
            <p className="text-xs text-muted-foreground">Complete your profile information</p>
          </div>

          {/* Profile photo section */}
          <div className="flex flex-col items-center space-y-2 mb-3">
            <div className="relative">
              <Avatar className="w-16 h-16">
                <AvatarImage src={photoPreview || undefined} />
                <AvatarFallback>
                  <Camera className="w-6 h-6 text-gray-400" />
                </AvatarFallback>
              </Avatar>
              <TooltipWrapper content="Upload a profile photo to increase your profile visibility and engagement by up to 300%">
                <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer hover:bg-primary/90 transition-colors">
                  <Upload className="w-3 h-3" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </TooltipWrapper>
            </div>
            <div className="flex items-center space-x-1">
              <Label className="text-xs text-muted-foreground">
                {signupData.accountType === 'company' ? 'Company Logo' : 'Profile Photo'}
              </Label>
              <TooltipWrapper content="Profiles with photos receive significantly more interest and interaction from other users">
                <Info className="w-3 h-3 text-muted-foreground hover:text-primary cursor-help transition-colors" />
              </TooltipWrapper>
            </div>
          </div>

          {/* Only show name fields for individual accounts or company accounts without master selected */}
          {(signupData.accountType === 'individual' || 
            (signupData.accountType === 'company' && !signupData.companyAccountMaster)) && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="firstName" className="text-sm">First Name</Label>
                  <TooltipWrapper 
                    content={validationErrors.firstName || "Enter your first name"}
                    disabled={!validationErrors.firstName}
                  >
                    <Input
                      id="firstName"
                      value={signupData.firstName}
                      onChange={(e) => setSignupData(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                      className={`h-8 text-sm ${getFieldErrorClass('firstName')}`}
                    />
                  </TooltipWrapper>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName" className="text-sm">Last Name</Label>
                  <TooltipWrapper 
                    content={validationErrors.lastName || "Enter your last name"}
                    disabled={!validationErrors.lastName}
                  >
                    <Input
                      id="lastName"
                      value={signupData.lastName}
                      onChange={(e) => setSignupData(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                      className={`h-8 text-sm ${getFieldErrorClass('lastName')}`}
                    />
                  </TooltipWrapper>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={signupData.confirmPassword}
                  onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  className={`h-8 text-sm ${getFieldErrorClass('confirmPassword')}`}
                  placeholder="Re-enter your password to confirm"
                />
                {validationErrors.confirmPassword && (
                  <p className="text-xs text-destructive mt-1">{validationErrors.confirmPassword}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="birthDate" className="text-sm">Birth Date (Must be 18+)</Label>
                <TooltipWrapper 
                  content={validationErrors.birthDate || "You must be at least 18 years old to join"}
                  disabled={!validationErrors.birthDate}
                >
                  <Input
                    id="birthDate"
                    type="date"
                    value={signupData.birthDate}
                    onChange={(e) => {
                      e.stopPropagation();
                      setSignupData(prev => ({ ...prev, birthDate: e.target.value }));
                    }}
                    onFocus={(e) => e.stopPropagation()}
                    onBlur={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    required
                    className={`h-8 text-sm ${getFieldErrorClass('birthDate')}`}
                  />
                </TooltipWrapper>
              </div>
            </>
          )}
          
          <div className="flex space-x-2 pt-3">
            <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 h-8 text-sm">
              Back
            </Button>
            <TooltipWrapper 
              content={getStep2ValidationError() || "Continue to final details"}
              disabled={!getStep2ValidationError()}
            >
              <Button 
                type="submit" 
                className="flex-1 h-8 text-sm"
                disabled={!!getStep2ValidationError()}
              >
                Next
              </Button>
            </TooltipWrapper>
          </div>
        </form>
      )}

      {/* Page 3: Final Details & Legal */}
      {step === 3 && (
        <form onSubmit={handleFinalSubmit} className="space-y-3">
          <div className="text-center mb-3">
            <h3 className="text-base font-semibold">Final Details</h3>
            <p className="text-xs text-muted-foreground">Complete your registration</p>
          </div>

          {signupData.accountType === 'company' && (
            <div className="space-y-3 mb-3 p-3 border rounded-lg bg-muted/50">
              <h4 className="font-medium text-xs">Verify Account Master</h4>
               <div className="grid grid-cols-1 gap-2">
                <div>
                  <Label htmlFor="emailVerification" className="text-sm">Verify Email</Label>
                  <TooltipWrapper 
                    content={validationErrors.emailVerification || "Re-enter your email to confirm"}
                    disabled={!validationErrors.emailVerification}
                  >
                    <Input
                      id="emailVerification"
                      type="email"
                      value={emailVerification}
                      onChange={(e) => setEmailVerification(e.target.value)}
                      placeholder="Re-enter your email"
                      className={`h-8 text-sm ${getFieldErrorClass('emailVerification')}`}
                    />
                  </TooltipWrapper>
                </div>
                <div>
                  <Label htmlFor="passwordVerification" className="text-sm">Verify Password</Label>
                  <TooltipWrapper 
                    content={validationErrors.passwordVerification || "Re-enter your password to confirm"}
                    disabled={!validationErrors.passwordVerification}
                  >
                    <Input
                      id="passwordVerification"
                      type="password"
                      value={passwordVerification}
                      onChange={(e) => setPasswordVerification(e.target.value)}
                      placeholder="Re-enter your password"
                      className={`h-8 text-sm ${getFieldErrorClass('passwordVerification')}`}
                    />
                  </TooltipWrapper>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="phone" className="text-sm">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={signupData.phone}
              onChange={handlePhoneChange}
              placeholder="XXX-XXX-XXXX"
              required
              className="h-8 text-sm"
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="location" className="text-sm">Location</Label>
            <Input
              id="location"
              value={signupData.location}
              onChange={(e) => setSignupData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="City, State"
              required
              className="h-8 text-sm"
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="bio" className="text-sm">Bio (Optional)</Label>
            <Textarea
              id="bio"
              value={signupData.bio}
              onChange={(e) => setSignupData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell us about yourself..."
              className="min-h-[40px] text-sm"
            />
          </div>
          
          <div className="space-y-2 pt-2">
            <TooltipWrapper 
              content={validationErrors.agreeToTerms || "You must agree to continue"}
              disabled={!validationErrors.agreeToTerms}
            >
              <div className={`flex items-center space-x-2 p-2 rounded ${hasFieldError('agreeToTerms') ? 'bg-red-50 border border-red-500' : ''}`}>
                <Checkbox
                  id="agreeToTerms"
                  checked={signupData.agreeToTerms}
                  onCheckedChange={(checked) => setSignupData(prev => ({ ...prev, agreeToTerms: checked as boolean }))}
                />
                <Label htmlFor="agreeToTerms" className="text-xs">
                  I agree to the Terms of Service and Privacy Policy
                </Label>
              </div>
            </TooltipWrapper>
            
            <TooltipWrapper 
              content={validationErrors.confirmAge || "You must be 18 or older to join"}
              disabled={!validationErrors.confirmAge}
            >
              <div className={`flex items-center space-x-2 p-2 rounded ${hasFieldError('confirmAge') ? 'bg-red-50 border border-red-500' : ''}`}>
                <Checkbox
                  id="confirmAge"
                  checked={signupData.confirmAge}
                  onCheckedChange={(checked) => setSignupData(prev => ({ ...prev, confirmAge: checked as boolean }))}
                />
                <Label htmlFor="confirmAge" className="text-xs">
                  I confirm that I am 18 years of age or older
                </Label>
              </div>
            </TooltipWrapper>
            
            <div className="text-center">
              <TooltipWrapper 
                content={validationErrors.legalDocument || "Sign the legal document to proceed"}
                disabled={!validationErrors.legalDocument}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Use modal instead of popup on mobile to prevent sliding issues
                    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                    
                    if (isMobile) {
                       // Save form data and current step for mobile legal document flow
                       sessionStorage.setItem('signupFormData', JSON.stringify(signupData));
                       sessionStorage.setItem('signupStep', step.toString());
                       window.location.href = '/legal?mobile=true&return=signup&tab=signup';
                    } else {
                      // Desktop: use popup as before
                      const popupFeatures = 'width=800,height=600,scrollbars=yes,resizable=yes';
                      const popup = window.open('/legal', '_blank', popupFeatures);
                      if (!popup) {
                        alert('Please allow popups to view the legal document');
                      } else {
                        popupWindowRef.current = popup;
                      }
                    }
                  }}
                  className={`text-xs h-8 transition-all duration-300 ${
                    legalDocumentSigned 
                      ? 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200' 
                      : 'bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200'
                  } ${hasFieldError('legalDocument') ? 'border-red-500 bg-red-50' : ''}`}
                >
                  {legalDocumentSigned ? '✓ Legal Document Signed' : 'Sign Legal Document'}
                </Button>
              </TooltipWrapper>
            </div>
          </div>
          
          <div className="flex space-x-2 pt-3">
            <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1 h-8 text-sm">
              Back
            </Button>
            <TooltipWrapper 
              content={getStep3ValidationError() || "Complete your account registration"}
              disabled={!getStep3ValidationError()}
            >
              <Button 
                type="submit" 
                disabled={loading || !!getStep3ValidationError()}
                className="flex-1 h-8 text-sm"
              >
                {loading ? 'Creating...' : 'Create Account'}
              </Button>
            </TooltipWrapper>
          </div>
        </form>
      )}
    </div>
  );

  if (inline) {
    return (
      <div className="auth-template">
        {formContent}
      </div>
    );
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="w-full max-w-sm bg-card rounded-lg border shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <LiveStreamLogo size="md" className="mr-3" />
                <h2 className="text-lg font-semibold">
                  Create Your <span className="font-orbitron font-black bg-gradient-to-r from-primary via-blue-500 to-purple-600 bg-clip-text text-transparent">Public Streamer</span> Account
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
            </div>
            {error && (
              <Alert variant="destructive" className="mb-3">
                <AlertDescription className="text-xs">{error}</AlertDescription>
                {showResetPassword && (
                  <Button
                    variant="link"
                    className="mt-1 p-0 text-xs"
                    onClick={() => setShowResetPassword(true)}
                  >
                    Reset Password
                  </Button>
                )}
              </Alert>
            )}
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