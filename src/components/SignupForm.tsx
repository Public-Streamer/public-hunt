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
import { Upload, Camera, Info, AlertTriangle } from 'lucide-react';
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
import { BirthdaySelector } from './BirthdaySelector';

interface SignupFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  inline?: boolean;
}

const SignupForm: React.FC<SignupFormProps> = ({ onClose, onSuccess, inline = false }) => {
  const { signUp } = useAppContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const popupWindowRef = useRef<Window | null>(null);

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
    accountType: 'individual' as 'individual' | 'business/organization' | 'group/team',
    companyName: '',
    companyAccountMaster: null as any,
    companyAccountMasterName: '',
    companyExecutorFirstName: '',
    companyExecutorLastName: '',
    companyExecutorAcknowledged: false,
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

  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailVerification, setEmailVerification] = useState('');
  const [passwordVerification, setPasswordVerification] = useState('');
  const [legalDocumentSigned, setLegalDocumentSigned] = useState(false);
  const [signatureData, setSignatureData] = useState<{ signature: string; date: string } | null>(null);
  const [showLegalModal, setShowLegalModal] = useState(false);
  
  // Legal document states - embedded approach
  const [legalSignature, setLegalSignature] = useState('');
  const [acknowledgedRisks, setAcknowledgedRisks] = useState(false);
  const [acknowledgedLiability, setAcknowledgedLiability] = useState(false);
  const [acknowledgedCompliance, setAcknowledgedCompliance] = useState(false);
  const [debugStatus, setDebugStatus] = useState('');
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorDialogConfig, setErrorDialogConfig] = useState({
    title: '',
    message: ''
  });
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const isPasswordValid = (password: string): boolean => {
    return password.length >= 8;
  };

  // Helper function to check if field is required
  const isFieldRequired = (fieldName: string) => {
    const requiredFields = ['email', 'password', 'confirmPassword', 'firstName', 'lastName', 'birthDate', 'phone'];
    if (signupData.accountType === 'business/organization' || signupData.accountType === 'group/team') {
      requiredFields.push('companyName', 'companyExecutorFirstName', 'companyExecutorLastName');
    }
    return requiredFields.includes(fieldName);
  };

  // Helper function to check if field is completed
  const isFieldCompleted = (fieldName: string) => {
    switch (fieldName) {
      case 'email':
        return signupData.email.trim() !== '' && signupData.email.includes('@');
      case 'password':
        return isPasswordValid(signupData.password);
      case 'confirmPassword':
        return isPasswordValid(signupData.confirmPassword) && signupData.password === signupData.confirmPassword;
      case 'firstName':
        return signupData.firstName.trim() !== '';
      case 'lastName':
        return signupData.lastName.trim() !== '';
      case 'birthDate':
        return signupData.birthDate !== '';
      case 'phone':
        // Phone number should be in format XXX-XXX-XXXX (10 digits)
        const phoneDigits = signupData.phone.replace(/\D/g, '');
        return phoneDigits.length === 10;
      case 'companyName':
        return signupData.companyName.trim() !== '';
      case 'companyExecutorFirstName':
        return signupData.companyExecutorFirstName.trim() !== '';
      case 'companyExecutorLastName':
        return signupData.companyExecutorLastName.trim() !== '';
      default:
        return true;
    }
  };

  // Get field styling classes
  const getFieldErrorClass = (fieldName: string) => {
    if (!isFieldRequired(fieldName)) return '';
    
    const isEmpty = !isFieldCompleted(fieldName);
    if (isEmpty) {
      return 'border-red-500 bg-red-50';
    } else {
      return 'border-green-500 bg-green-50';
    }
  };

  // Comprehensive form validation
  const getFormValidationError = () => {
    // Basic fields validation
    if (!signupData.email) {
      return 'Please enter your email address';
    }
    if (!signupData.email.includes('@')) {
      return 'Please enter a valid email address';
    }
    if (!signupData.password) {
      return 'Please enter your password';
    }
    if (!isPasswordValid(signupData.password)) {
      return 'Password must be at least 8 characters long';
    }
    if (!signupData.confirmPassword) {
      return 'Please confirm your password';
    }
    if (!isPasswordValid(signupData.confirmPassword)) {
      return 'Confirm password must be at least 8 characters long';
    }
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
    if (!signupData.phone) {
      return 'Please enter your cell phone number';
    }
    const phoneDigits = signupData.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      return 'Please enter a valid 10-digit cell phone number';
    }

    // Company-specific validation
    if (signupData.accountType === 'business/organization' || signupData.accountType === 'group/team') {
      if (!signupData.companyName) {
        return `Please enter your ${signupData.accountType === 'business/organization' ? 'business/organization' : 'group/team'} name`;
      }
      if (!signupData.companyExecutorFirstName) {
        return 'Please enter the executor\'s first name';
      }
      if (!signupData.companyExecutorLastName) {
        return 'Please enter the executor\'s last name';
      }
      if (!signupData.companyExecutorAcknowledged) {
        return 'Please acknowledge that the Account Master has executor authority';
      }
      if (!signupData.companyAccountMaster) {
        return 'Please select an Account Master';
      }
      if (emailVerification !== signupData.email) {
        return 'Email verification does not match';
      }
      if (passwordVerification !== signupData.password) {
        return 'Password verification does not match';
      }
    }

    // Final validation
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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    let formattedValue = '';
    
    if (value.length >= 6) {
      formattedValue = `${value.slice(0, 3)}-${value.slice(3, 6)}-${value.slice(6, 10)}`;
    } else if (value.length >= 3) {
      formattedValue = `${value.slice(0, 3)}-${value.slice(3)}`;
    } else {
      formattedValue = value;
    }
    
    setSignupData(prev => ({ ...prev, phone: formattedValue }));
  };

  const handleProfilePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSignupData(prev => ({ ...prev, profilePhoto: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUserSelect = (user: any) => {
    setSignupData(prev => ({
      ...prev,
      companyAccountMaster: user.id,
      companyAccountMasterName: `${user.firstName} ${user.lastName}`
    }));
  };

  // Validate legal document signature
  const userFullName = `${signupData.firstName} ${signupData.lastName}`;
  const normalizeString = (str: string) => str.trim().toLowerCase().replace(/\s+/g, ' ');
  const isValidLegalSignature = userFullName.trim() 
    ? normalizeString(legalSignature) === normalizeString(userFullName)
    : legalSignature.trim().length >= 3;
  const canSignLegal = isValidLegalSignature && acknowledgedRisks && acknowledgedLiability && acknowledgedCompliance;
  
  const handleLegalDocumentAccept = () => {
    if (canSignLegal) {
      const currentDate = new Date().toLocaleDateString();
      setSignatureData({ signature: legalSignature, date: currentDate });
      setLegalDocumentSigned(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = getFormValidationError();
    if (validationError) {
      setErrorDialogConfig({
        title: 'Form Validation Error',
        message: validationError
      });
      setShowErrorDialog(true);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Format the signup data for submission
      const formattedData = {
        email: signupData.email.trim(),
        password: signupData.password,
        firstName: signupData.firstName.trim(),
        lastName: signupData.lastName.trim(),
        phone: signupData.phone,
        birthDate: signupData.birthDate,
        location: signupData.location.trim(),
        bio: signupData.bio.trim(),
        accountType: signupData.accountType,
        ...(signupData.accountType !== 'individual' && {
          companyName: signupData.companyName.trim(),
          companyExecutorFirstName: signupData.companyExecutorFirstName.trim(),
          companyExecutorLastName: signupData.companyExecutorLastName.trim(),
          companyAccountMaster: signupData.companyAccountMaster,
        })
      };

      console.log('Attempting signup with data:', formattedData);
      
      const result = await signUp(
        formattedData.email,
        formattedData.password,
        {
          firstName: formattedData.firstName,
          lastName: formattedData.lastName,
          phone: formattedData.phone,
          location: formattedData.location,
          bio: formattedData.bio,
          birthDate: formattedData.birthDate,
          ...(formattedData.accountType !== 'individual' && {
            accountType: formattedData.accountType,
            companyName: formattedData.companyName,
            companyAccountMaster: formattedData.companyAccountMaster,
          })
        }
      );
      
      if (result && !result.error) {
        toast({
          title: "Account created successfully!",
          description: "Welcome to Public Streamer.",
        });
        
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/');
        }
        onClose();
      } else {
        console.error('Signup failed:', result.error);
        setError(result.error || 'Failed to create account. Please try again.');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      setError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <div className="space-y-6 max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Account Type Section */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Account Type</h3>
          <RadioGroup
            value={signupData.accountType}
            onValueChange={(value: 'individual' | 'business/organization' | 'group/team') => setSignupData(prev => ({ ...prev, accountType: value }))}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="individual" id="individual" />
              <Label htmlFor="individual" className="text-sm cursor-pointer">Individual</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="business/organization" id="business" />
              <Label htmlFor="business" className="text-sm cursor-pointer">Business/Organization</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="group/team" id="group" />
              <Label htmlFor="group" className="text-sm cursor-pointer">Group/Team</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Company Information (for business/organization and group/team) */}
        {(signupData.accountType === 'business/organization' || signupData.accountType === 'group/team') && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <h3 className="text-lg font-semibold">
              {signupData.accountType === 'business/organization' ? 'Business/Organization Information' : 'Group/Team Information'}
            </h3>
            
            <div className="space-y-1">
              <Label htmlFor="companyName" className="text-sm">
                {signupData.accountType === 'business/organization' ? 'Business/Organization Name' : 'Group/Team Name'}
              </Label>
              <Input
                id="companyName"
                value={signupData.companyName}
                onChange={(e) => setSignupData(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder={signupData.accountType === 'business/organization' ? 'Enter business/organization name' : 'Enter group/team name'}
                className={`h-8 text-sm ${getFieldErrorClass('companyName')}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="companyExecutorFirstName" className="text-sm">Executor First Name</Label>
                <Input
                  id="companyExecutorFirstName"
                  value={signupData.companyExecutorFirstName}
                  onChange={(e) => setSignupData(prev => ({ ...prev, companyExecutorFirstName: e.target.value }))}
                  placeholder="First Name"
                  className={`h-8 text-sm ${getFieldErrorClass('companyExecutorFirstName')}`}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="companyExecutorLastName" className="text-sm">Executor Last Name</Label>
                <Input
                  id="companyExecutorLastName"
                  value={signupData.companyExecutorLastName}
                  onChange={(e) => setSignupData(prev => ({ ...prev, companyExecutorLastName: e.target.value }))}
                  placeholder="Last Name"
                  className={`h-8 text-sm ${getFieldErrorClass('companyExecutorLastName')}`}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Account Master Selection</Label>
              <p className="text-xs text-muted-foreground">
                Choose who will be the Account Master for this {signupData.accountType === 'business/organization' ? 'business/organization' : 'group/team'}.
              </p>
              <UserSearchBox onUserSelect={handleUserSelect} selectedUser={null} />
              {signupData.companyAccountMasterName && (
                <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                  <strong>Selected Account Master:</strong> {signupData.companyAccountMasterName}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="executorAuth"
                checked={signupData.companyExecutorAcknowledged}
                onCheckedChange={(checked) => setSignupData(prev => ({ ...prev, companyExecutorAcknowledged: !!checked }))}
              />
              <Label htmlFor="executorAuth" className="text-xs">
                I acknowledge that the selected Account Master has executor authority for this {signupData.accountType === 'business/organization' ? 'business/organization' : 'group/team'} account.
              </Label>
            </div>
          </div>
        )}

        {/* Basic Account Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Account Information</h3>
          
          <div className="space-y-1">
            <Label htmlFor="email" className="text-sm">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={signupData.email}
              onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter your email"
              className={`h-8 text-sm ${getFieldErrorClass('email')}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="password" className="text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                value={signupData.password}
                onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
                className={`h-8 text-sm ${getFieldErrorClass('password')}`}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={signupData.confirmPassword}
                onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm password"
                className={`h-8 text-sm ${getFieldErrorClass('confirmPassword')}`}
              />
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Personal Information</h3>
          
          {/* Profile Photo */}
          <div className="flex flex-col items-center space-y-2">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profilePhotoPreview || undefined} />
                <AvatarFallback>
                  <Camera className="w-8 h-8 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePhotoUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                <Upload className="w-3 h-3" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">Click to upload profile photo (optional)</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="firstName" className="text-sm">First Name</Label>
              <Input
                id="firstName"
                value={signupData.firstName}
                onChange={(e) => setSignupData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="First Name"
                className={`h-8 text-sm ${getFieldErrorClass('firstName')}`}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName" className="text-sm">Last Name</Label>
              <Input
                id="lastName"
                value={signupData.lastName}
                onChange={(e) => setSignupData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Last Name"
                className={`h-8 text-sm ${getFieldErrorClass('lastName')}`}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="birthDate" className="text-sm">Birth Date</Label>
            <BirthdaySelector
              value={signupData.birthDate}
              onChange={(date) => setSignupData(prev => ({ ...prev, birthDate: date }))}
              className={getFieldErrorClass('birthDate')}
            />
          </div>

          <div className="space-y-1">
            <TooltipWrapper 
              content={validationErrors.phone || "Enter your cell phone number"}
              disabled={!validationErrors.phone}
            >
              <Label htmlFor="phone" className="text-sm">
                {signupData.accountType === 'business/organization' ? 'Business/Organization Cell Phone Number' : 
                 signupData.accountType === 'group/team' ? 'Group/Team Cell Phone Number' : 'Cell Phone Number'}
              </Label>
            </TooltipWrapper>
            <Input
              id="phone"
              type="tel"
              value={signupData.phone}
              onChange={handlePhoneChange}
              placeholder="XXX-XXX-XXXX"
              className={`h-8 text-sm ${getFieldErrorClass('phone')}`}
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="location" className="text-sm">Location (Optional)</Label>
            <Input
              id="location"
              value={signupData.location}
              onChange={(e) => setSignupData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="City, State/Country"
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
              className="text-sm min-h-[60px]"
            />
          </div>
        </div>

        {/* Verification Section (for business/organization and group/team) */}
        {(signupData.accountType === 'business/organization' || signupData.accountType === 'group/team') && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <h3 className="text-lg font-semibold">
              Verify {signupData.accountType === 'business/organization' ? 'Business/Organization' : 'Group/Team'} Account Master
            </h3>
            {signupData.companyAccountMasterName && (
              <p className="text-sm text-muted-foreground">
                Account Master: <span className="font-medium">{signupData.companyAccountMasterName}</span>
              </p>
            )}
            
            <div className="space-y-1">
              <Label htmlFor="emailVerification" className="text-sm">Re-enter Email Address</Label>
              <Input
                id="emailVerification"
                type="email"
                value={emailVerification}
                onChange={(e) => setEmailVerification(e.target.value)}
                placeholder="Confirm email address"
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="passwordVerification" className="text-sm">Re-enter Password</Label>
              <Input
                id="passwordVerification"
                type="password"
                value={passwordVerification}
                onChange={(e) => setPasswordVerification(e.target.value)}
                placeholder="Confirm password"
                className="h-8 text-sm"
              />
            </div>
          </div>
        )}

        {/* Legal Agreement Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Legal Agreement</h3>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="agreeTerms"
                checked={signupData.agreeToTerms}
                onCheckedChange={(checked) => setSignupData(prev => ({ ...prev, agreeToTerms: !!checked }))}
              />
              <Label htmlFor="agreeTerms" className="text-sm">
                I agree to the Terms of Service and Privacy Policy
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirmAge"
                checked={signupData.confirmAge}
                onCheckedChange={(checked) => setSignupData(prev => ({ ...prev, confirmAge: !!checked }))}
              />
              <Label htmlFor="confirmAge" className="text-sm">
                I confirm that I am 18 years of age or older
              </Label>
            </div>

            {/* Legal Document Section - Embedded */}
            <div className="space-y-4 p-4 border rounded-lg bg-red-50 border-red-200">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-lg font-bold">LEGAL AGREEMENT REQUIRED</h3>
                {legalDocumentSigned && (
                  <span className="text-green-600 text-sm font-medium ml-auto">✓ Signed</span>
                )}
              </div>
              
              {!legalDocumentSigned && (
                <>
                  <div className="bg-red-100 p-3 rounded border border-red-300">
                    <p className="text-red-700 text-sm font-medium">
                      This document contains critical legal terms that LIMIT PUBLIC STREAMER'S LIABILITY and TRANSFER RISKS TO YOU. 
                      Read carefully before signing.
                    </p>
                  </div>

                  <div className="space-y-3 text-xs max-h-40 overflow-y-auto border p-3 bg-white">
                    <h4 className="font-bold">PUBLIC STREAMER PLATFORM USER AGREEMENT</h4>
                    
                    <div>
                      <h5 className="font-semibold">1. LIABILITY WAIVER</h5>
                      <p>Public Streamer, LLC shall NOT be liable for any content you create, third-party claims, copyright violations, privacy violations, financial losses, or any damages arising from your use of the platform.</p>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold">2. INDEMNIFICATION</h5>
                      <p>You agree to DEFEND, INDEMNIFY, and HOLD HARMLESS Public Streamer from all claims, damages, and expenses arising from your use of the platform or content you upload.</p>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold">3. CONTENT RESPONSIBILITY</h5>
                      <p>You represent that you own all content you upload, that it complies with all laws, and you assume full responsibility for all activities under your account.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="risks"
                        checked={acknowledgedRisks}
                        onCheckedChange={(checked) => setAcknowledgedRisks(!!checked)}
                      />
                      <Label htmlFor="risks" className="text-xs">
                        I acknowledge that I have read and understand the risks and liability waivers above
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="liability"
                        checked={acknowledgedLiability}
                        onCheckedChange={(checked) => setAcknowledgedLiability(!!checked)}
                      />
                      <Label htmlFor="liability" className="text-xs">
                        I agree to indemnify and hold harmless Public Streamer from all claims and damages
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="compliance"
                        checked={acknowledgedCompliance}
                        onCheckedChange={(checked) => setAcknowledgedCompliance(!!checked)}
                      />
                      <Label htmlFor="compliance" className="text-xs">
                        I certify that I will comply with all laws and platform terms
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="legalSignature" className="text-sm font-medium">
                      Electronic Signature (Type your full legal name exactly)
                    </Label>
                    {userFullName && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        <p className="text-xs text-blue-700 font-medium">
                          Please type exactly: <span className="font-bold">{userFullName}</span>
                        </p>
                      </div>
                    )}
                    <Input
                      id="legalSignature"
                      value={legalSignature}
                      onChange={(e) => setLegalSignature(e.target.value)}
                      placeholder={userFullName ? `Type: ${userFullName}` : "Type your full legal name"}
                      className={`h-8 text-sm ${
                        legalSignature.trim() && !isValidLegalSignature ? 'border-red-500 bg-red-50' : ''
                      }`}
                    />
                    {legalSignature.trim() && !isValidLegalSignature && userFullName && (
                      <p className="text-red-500 text-xs">
                        Signature must match exactly: {userFullName}
                      </p>
                    )}
                  </div>

                  <Button
                    type="button"
                    onClick={handleLegalDocumentAccept}
                    disabled={!canSignLegal}
                    className={`w-full ${
                      canSignLegal 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-gray-400 text-gray-700 cursor-not-allowed'
                    }`}
                  >
                    {canSignLegal ? 'I Accept and Electronically Sign' : 'Complete All Fields Above'}
                  </Button>
                </>
              )}
              
              {legalDocumentSigned && signatureData && (
                <div className="text-xs text-green-700 bg-green-100 p-2 rounded">
                  ✓ Legal document signed by: {signatureData.signature} on {signatureData.date}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <TooltipWrapper 
            content={getFormValidationError() || "Create your account"}
            disabled={!getFormValidationError()}
          >
            <Button 
              type="submit" 
              disabled={loading || !!getFormValidationError()}
              className="w-full h-10"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </TooltipWrapper>
        </div>
      </form>
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
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 auth-template"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div 
          className="w-full max-w-4xl max-h-[95vh] bg-card rounded-lg border shadow-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <LiveStreamLogo size="md" className="mr-3" />
                <h2 className="text-xl sm:text-2xl font-bold">
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
              <Alert variant="destructive" className="mt-3">
                <AlertDescription className="text-sm">{error}</AlertDescription>
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
            {debugStatus && (
              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                <strong>Debug Status:</strong> {debugStatus}
              </div>
            )}
          </div>
          
          <ScrollArea className="h-[calc(95vh-120px)] p-6">
            {formContent}
          </ScrollArea>
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