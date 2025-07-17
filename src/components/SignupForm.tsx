import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Upload, Camera } from 'lucide-react';
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
    if (!signupData.agreeToTerms || !signupData.confirmAge) {
      setError('Please accept all terms and confirm your age.');
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
            <Label className="text-sm text-gray-600">Profile Photo</Label>
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
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
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
              <Label htmlFor="location">Location</Label>
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
          
          <div className="space-y-2">
            <Button type="submit" className="w-full" disabled={!signupData.agreeToTerms || !signupData.confirmAge || loading}>
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
    </>
  );
};

export default SignupForm;