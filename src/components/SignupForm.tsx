import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Camera } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';

interface SignupFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  inline?: boolean;
}

const SignupForm: React.FC<SignupFormProps> = ({ onClose, onSuccess, inline = false }) => {
  const { signUp } = useAppContext();
  const navigate = useNavigate();
  const [signupData, setSignupData] = useState({
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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSignupData(prev => ({ ...prev, profilePhoto: file }));
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
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
    if (signupData.password !== signupData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (calculateAge(signupData.birthDate) < 18) {
      alert('You must be at least 18 years old to create an account.');
      return;
    }
    setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupData.agreeToTerms || !signupData.confirmAge) {
      alert('Please accept all terms and confirm your age.');
      return;
    }
    
    setLoading(true);
    try {
      const result = await signUp(signupData.email, signupData.password, {
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        phone: signupData.phone,
        location: signupData.location,
        bio: signupData.bio,
        birthDate: signupData.birthDate,
        profilePhoto: photoPreview || undefined
      });
      
      if (result.error) {
        alert('Signup failed: ' + result.error);
      } else {
        if (onSuccess) {
          onSuccess();
        } else {
          onClose();
        }
      }
    } catch (error) {
      alert('Signup failed: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <>
      {step === 1 && (
        <form onSubmit={handleStep1Submit} className="space-y-4">
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
          
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">Continue</Button>
            {!inline && <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>}
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
                onChange={(e) => setSignupData(prev => ({ ...prev, phone: e.target.value }))}
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
              <Label htmlFor="birthDate">Birth Date (Must be 18+)</Label>
              <Input
                id="birthDate"
                type="date"
                value={signupData.birthDate}
                onChange={(e) => setSignupData(prev => ({ ...prev, birthDate: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={signupData.bio}
                onChange={(e) => setSignupData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
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
          
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={!signupData.agreeToTerms || !signupData.confirmAge || loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
          </div>
        </form>
      )}
    </>
  );

  if (inline) {
    return formContent;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Create Your Streamura Account</CardTitle>
        </CardHeader>
        <CardContent>
          {formContent}
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupForm;