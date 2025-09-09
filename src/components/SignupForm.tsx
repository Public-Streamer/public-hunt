import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Upload,
  Camera,
  Info,
  AlertTriangle,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import TooltipWrapper from "@/components/ui/tooltip-wrapper";
import LiveStreamLogo from "@/components/ui/live-stream-logo";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import { useAppContext } from "@/contexts/AppContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate, Link } from "react-router-dom";
import ResetPasswordForm from "./ResetPasswordForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ErrorDialog from "./ErrorDialog";
import UserSearchBox from "./UserSearchBox";
import { BirthdaySelector } from "./BirthdaySelector";
import ValidationMessage from "./ValidationMessage";
import { useFormValidation, validationRules } from "@/hooks/useFormValidation";
import LegalAgreementBody from "@/components/legal/LegalAgreementBody";

interface SignupFormProps {
  onClose: () => void;
  onSuccess?: () => void;
  inline?: boolean;
}

const SignupForm: React.FC<SignupFormProps> = ({
  onClose,
  onSuccess,
  inline = false,
}) => {
  const { signUp } = useAppContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { validateField, getFieldValidation, isFormValid } = useFormValidation({
    realTime: true,
  });

  const popupWindowRef = useRef<Window | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Listen for messages from popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Handle both old and new message types for legal document completion
      if (
        event.data.type === "LEGAL_AGREEMENT_SIGNED" ||
        event.data.type === "LEGAL_AGREEMENT_COMPLETED"
      ) {
        const { fullName, signature, signDate } = event.data.data;
        setSignatureData({ signature, date: signDate });
        setLegalDocumentSigned(true);

        console.log(
          "Legal document completed successfully, signature received:",
          { fullName, signature, signDate }
        );

        // Mobile-specific: Force close popup if it's still open
        if (popupWindowRef.current && !popupWindowRef.current.closed) {
          try {
            popupWindowRef.current.close();
          } catch (error) {
            console.log("Error closing popup:", error);
          }
        }
      } else if (
        event.data.type === "legal-document-cancelled" ||
        event.data.type === "LEGAL_DOCUMENT_CLOSE_REQUESTED"
      ) {
        // Handle cancellation - just close the popup
        if (popupWindowRef.current && !popupWindowRef.current.closed) {
          try {
            popupWindowRef.current.close();
          } catch (error) {
            console.log("Error closing popup:", error);
          }
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const [signupData, setSignupData] = useState({
    accountType: "individual" as
      | "individual"
      | "business/organization"
      | "group/team",
    companyName: "",
    companyAccountMaster: null as any,
    companyAccountMasterName: "",
    companyExecutorFirstName: "",
    companyExecutorLastName: "",
    companyExecutorAcknowledged: false,
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    location: "",
    bio: "",
    birthDate: "",
    profilePhoto: null as File | null,
    agreeToTerms: false,
    confirmAge: false,
  });

  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailVerification, setEmailVerification] = useState("");
  const [passwordVerification, setPasswordVerification] = useState("");
  const [legalDocumentSigned, setLegalDocumentSigned] = useState(false);
  const [signatureData, setSignatureData] = useState<{
    signature: string;
    date: string;
  } | null>(null);
  const [showLegalModal, setShowLegalModal] = useState(false);

  // Legal document states - embedded approach
  const [legalSignature, setLegalSignature] = useState("");
  const [acknowledgedRisks, setAcknowledgedRisks] = useState(false);
  const [acknowledgedLiability, setAcknowledgedLiability] = useState(false);
  const [acknowledgedCompliance, setAcknowledgedCompliance] = useState(false);
  const [acknowledgedProhibited, setAcknowledgedProhibited] = useState(false);
  const [debugStatus, setDebugStatus] = useState("");
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorDialogConfig, setErrorDialogConfig] = useState({
    title: "",
    message: "",
  });
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Real-time validation functions
  const validateFieldRealTime = useCallback(
    (fieldName: string, value: any) => {
      switch (fieldName) {
        case "email":
          validateField("email", value, [
            validationRules.required("Email address is required"),
            validationRules.email(),
          ]);
          break;
        case "password":
          validateField("password", value, [
            validationRules.required("Password is required"),
            validationRules.minLength(
              8,
              "Password must be at least 8 characters"
            ),
          ]);
          // Also revalidate confirm password if it exists
          if (signupData.confirmPassword) {
            validateField("confirmPassword", signupData.confirmPassword, [
              validationRules.required("Please confirm your password"),
              validationRules.passwordMatch(value, "Passwords do not match"),
            ]);
          }
          break;
        case "confirmPassword":
          validateField("confirmPassword", value, [
            validationRules.required("Please confirm your password"),
            validationRules.passwordMatch(
              signupData.password,
              "Passwords do not match"
            ),
          ]);
          break;
        case "firstName":
          validateField("firstName", value, [
            validationRules.required("First name is required"),
          ]);
          break;
        case "lastName":
          validateField("lastName", value, [
            validationRules.required("Last name is required"),
          ]);
          break;
        case "phone":
          validateField("phone", value, [
            validationRules.required("Phone number is required"),
            validationRules.phone(),
          ]);
          break;
        case "birthDate":
          validateField("birthDate", value, [
            validationRules.required("Birth date is required"),
            validationRules.age(
              18,
              value,
              "You must be 18 or older to create an account"
            ),
          ]);
          break;
        case "companyName":
          validateField("companyName", value, [
            validationRules.required(
              `${
                signupData.accountType === "business/organization"
                  ? "Business/organization"
                  : "Group/team"
              } name is required`
            ),
          ]);
          break;
        case "companyExecutorFirstName":
          validateField("companyExecutorFirstName", value, [
            validationRules.required("Executor first name is required"),
          ]);
          break;
        case "companyExecutorLastName":
          validateField("companyExecutorLastName", value, [
            validationRules.required("Executor last name is required"),
          ]);
          break;
        case "legalSignature": {
          const expectedName =
            signupData.accountType === "individual"
              ? `${signupData.firstName} ${signupData.lastName}`
              : `${signupData.companyExecutorFirstName} ${signupData.companyExecutorLastName}`;
          validateField("legalSignature", value, [
            validationRules.required("Electronic signature is required"),
            validationRules.exactMatch(
              expectedName.trim(),
              `Must match exactly: ${expectedName}`
            ),
          ]);
          break;
        }
      }
    },
    [signupData, validateField]
  );

  // Update validation when field values change
  const handleFieldChange = useCallback(
    (fieldName: string, value: any) => {
      setSignupData((prev) => ({ ...prev, [fieldName]: value }));

      // Add a small delay for real-time validation to avoid excessive calls
      setTimeout(() => {
        if (value !== "" || getFieldValidation(fieldName)) {
          validateFieldRealTime(fieldName, value);
        }
      }, 300);
    },
    [validateFieldRealTime, getFieldValidation]
  );

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age;
  };

  const isPasswordValid = (password: string): boolean => {
    return password.length >= 8;
  };

  // Helper function to check if field is required
  const isFieldRequired = (fieldName: string) => {
    const requiredFields = ["email", "password", "confirmPassword", "phone"];

    if (signupData.accountType === "individual") {
      requiredFields.push("firstName", "lastName", "birthDate");
    }

    if (
      signupData.accountType === "business/organization" ||
      signupData.accountType === "group/team"
    ) {
      requiredFields.push(
        "companyName",
        "companyExecutorFirstName",
        "companyExecutorLastName"
      );
    }

    return requiredFields.includes(fieldName);
  };

  // Helper function to check if field is completed
  const isFieldCompleted = (fieldName: string) => {
    switch (fieldName) {
      case "email":
        return signupData.email.trim() !== "" && signupData.email.includes("@");
      case "password":
        return isPasswordValid(signupData.password);
      case "confirmPassword":
        return (
          isPasswordValid(signupData.confirmPassword) &&
          signupData.password === signupData.confirmPassword
        );
      case "firstName":
        return signupData.firstName.trim() !== "";
      case "lastName":
        return signupData.lastName.trim() !== "";
      case "birthDate":
        return signupData.birthDate !== "";
      case "phone": {
        // Phone number should be in format XXX-XXX-XXXX (10 digits)
        const phoneDigits = signupData.phone.replace(/\D/g, "");
        return phoneDigits.length === 10;
      }
      case "companyName":
        return signupData.companyName.trim() !== "";
      case "companyExecutorFirstName":
        return signupData.companyExecutorFirstName.trim() !== "";
      case "companyExecutorLastName":
        return signupData.companyExecutorLastName.trim() !== "";
      default:
        return true;
    }
  };

  // Get field styling classes
  const getFieldErrorClass = (fieldName: string) => {
    if (!isFieldRequired(fieldName)) return "";

    const isEmpty = !isFieldCompleted(fieldName);
    if (isEmpty) {
      return "border-red-500 bg-red-50";
    } else {
      return "border-green-500 bg-green-50";
    }
  };

  // Comprehensive form validation
  const getFormValidationError = () => {
    // Basic fields validation
    if (!signupData.email) {
      return "Please enter your email address";
    }
    if (!signupData.email.includes("@")) {
      return "Please enter a valid email address";
    }
    if (!signupData.password) {
      return "Please enter your password";
    }
    if (!isPasswordValid(signupData.password)) {
      return "Password must be at least 8 characters long";
    }
    if (!signupData.confirmPassword) {
      return "Please confirm your password";
    }
    if (!isPasswordValid(signupData.confirmPassword)) {
      return "Confirm password must be at least 8 characters long";
    }
    if (signupData.password !== signupData.confirmPassword) {
      return "Passwords do not match";
    }

    if (signupData.accountType === "individual") {
      if (!signupData.firstName) {
        return "Please enter your first name";
      }
      if (!signupData.lastName) {
        return "Please enter your last name";
      }
      if (!signupData.birthDate) {
        return "Please enter your birth date";
      }
      const age = calculateAge(signupData.birthDate);
      if (age < 18) {
        return "You must be 18 years or older to join";
      }
    }
    if (!signupData.phone) {
      return "Please enter your cell phone number";
    }
    const phoneDigits = signupData.phone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      return "Please enter a valid 10-digit cell phone number";
    }

    // Company-specific validation
    if (
      signupData.accountType === "business/organization" ||
      signupData.accountType === "group/team"
    ) {
      if (!signupData.companyName) {
        return `Please enter your ${
          signupData.accountType === "business/organization"
            ? "business/organization"
            : "group/team"
        } name`;
      }
      if (!signupData.companyExecutorFirstName) {
        return "Please enter the executor's first name";
      }
      if (!signupData.companyExecutorLastName) {
        return "Please enter the executor's last name";
      }
      if (!signupData.companyExecutorAcknowledged) {
        return "Please acknowledge that the Account Master has executor authority";
      }
      if (!signupData.companyAccountMaster) {
        return "Please select an Account Master";
      }
    }

    // Final validation
    if (!signupData.agreeToTerms) {
      return "Please agree to the Terms of Service";
    }
    if (!signupData.confirmAge) {
      return "Please confirm you are 18 or older";
    }
    if (!legalDocumentSigned) {
      return "Please sign the legal document";
    }

    return null;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Remove non-digits
    let formattedValue = "";

    if (value.length >= 6) {
      formattedValue = `${value.slice(0, 3)}-${value.slice(3, 6)}-${value.slice(
        6,
        10
      )}`;
    } else if (value.length >= 3) {
      formattedValue = `${value.slice(0, 3)}-${value.slice(3)}`;
    } else {
      formattedValue = value;
    }

    setSignupData((prev) => ({ ...prev, phone: formattedValue }));
  };

  const handleProfilePhotoUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setSignupData((prev) => ({ ...prev, profilePhoto: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUserSelect = (user: any) => {
    setSignupData((prev) => ({
      ...prev,
      companyAccountMaster: user.id,
      companyAccountMasterName:
        user.display_name || user.username || "Unknown User",
    }));
  };

  // Validate legal document signature - use executor name for business accounts
  const userFullName =
    signupData.accountType === "individual"
      ? `${signupData.firstName} ${signupData.lastName}`
      : `${signupData.companyExecutorFirstName} ${signupData.companyExecutorLastName}`;
  const normalizeString = (str: string) =>
    str.trim().toLowerCase().replace(/\s+/g, " ");
  const isValidLegalSignature = userFullName.trim()
    ? normalizeString(legalSignature) === normalizeString(userFullName)
    : legalSignature.trim().length >= 3;
  const canSignLegal =
    isValidLegalSignature &&
    acknowledgedRisks &&
    acknowledgedLiability &&
    acknowledgedCompliance &&
    acknowledgedProhibited;

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
        title: "Form Validation Error",
        message: validationError,
      });
      setShowErrorDialog(true);
      return;
    }

    setLoading(true);
    setError("");

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
        ...(signupData.accountType !== "individual" && {
          companyName: signupData.companyName.trim(),
          companyExecutorFirstName: signupData.companyExecutorFirstName.trim(),
          companyExecutorLastName: signupData.companyExecutorLastName.trim(),
          companyAccountMaster: signupData.companyAccountMaster,
        }),
      };

      console.log("Attempting signup with data:", formattedData);

      const result = await signUp(formattedData.email, formattedData.password, {
        user_id: "", // This will be set by the signUp function
        display_name: `${formattedData.firstName} ${formattedData.lastName}`,
        username: formattedData.email.split("@")[0],
        location: formattedData.location || "",
        bio: formattedData.bio || "",
        birthday: formattedData.birthDate,
        company_id:
          formattedData.accountType !== "individual"
            ? formattedData.companyAccountMaster || ""
            : "",
        company_name:
          formattedData.accountType !== "individual"
            ? formattedData.companyName || ""
            : "",
        is_company_account: formattedData.accountType !== "individual",
        cover_photo_url: "",
        profile_picture_url: "",
        education: "",
        website: "",
        relationship_status: "",
        occupation: "",
        interests: [],
        followers_count: 0,
        following_count: 0,
        friends_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (result && !result.error) {
        // Handle profile photo upload after successful account creation
        if (signupData.profilePhoto) {
          try {
            // Get the current user to get their ID
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (user) {
              // Upload to Supabase storage with timestamp for cache busting
              const fileExt = signupData.profilePhoto.name.split(".").pop();
              const timestamp = Date.now();
              const fileName = `${user.id}-avatar-${timestamp}.${fileExt}`;
              const filePath = `avatars/${fileName}`;

              const { error: uploadError } = await supabase.storage
                .from("media")
                .upload(filePath, signupData.profilePhoto);

              if (!uploadError) {
                // Get public URL with cache busting parameter
                const { data: urlData } = supabase.storage
                  .from("media")
                  .getPublicUrl(filePath);

                const cacheBustedUrl = `${urlData.publicUrl}?t=${timestamp}`;

                // Update profile with new profile picture
                await supabase
                  .from("user_profiles")
                  .update({ profile_picture_url: cacheBustedUrl })
                  .eq("user_id", user.id);
              }
            }
          } catch (photoError) {
            console.error("Error uploading profile photo:", photoError);
            // Don't block account creation if photo upload fails
          }
        }

        toast({
          title: "Account created successfully!",
          description: "Welcome to DogHunt.tv.",
        });

        if (onSuccess) {
          onSuccess();
        } else {
          navigate("/");
        }
        onClose();
      } else {
        // Handle specific Supabase auth errors
        let errorMessage =
          result.error || "Failed to create account. Please try again.";
        let errorTitle = "Signup Error";

        // Parse common Supabase auth error messages
        if (result.error) {
          if (
            result.error.includes("User already registered") ||
            result.error.includes("Email already exists")
          ) {
            errorMessage =
              "An account with this email address already exists. Please try logging in instead, or use a different email address.";
            errorTitle = "Email Already Registered";
          } else if (result.error.includes("Invalid email")) {
            errorMessage = "Please enter a valid email address.";
            errorTitle = "Invalid Email";
          } else if (result.error.includes("Password should be at least")) {
            errorMessage = "Password must be at least 6 characters long.";
            errorTitle = "Password Too Short";
          } else if (result.error.includes("Signup is disabled")) {
            errorMessage =
              "Account registration is currently disabled. Please contact support.";
            errorTitle = "Registration Disabled";
          } else if (result.error.includes("Email not confirmed")) {
            errorMessage =
              "Please check your email and click the confirmation link before signing in.";
            errorTitle = "Email Confirmation Required";
          }
        }

        console.error("Signup failed:", result.error);
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage,
        });

        // Show error in dialog instead of just setting error state
        setErrorDialogConfig({
          title: errorTitle,
          message: errorMessage,
        });
        setShowErrorDialog(true);
      }
    } catch (error: any) {
      console.error("Signup error:", error);

      let errorMessage = "An unexpected error occurred. Please try again.";
      let errorTitle = "Signup Error";

      // Handle network and other errors
      if (error.message) {
        if (
          error.message.includes("User already registered") ||
          error.message.includes("already exists") ||
          error.message.includes("Email already exists")
        ) {
          errorMessage =
            "An account with this email address already exists. Please try logging in instead, or use a different email address.";
          errorTitle = "Email Already Registered";
        } else if (
          error.message.includes("Failed to fetch") ||
          error.message.includes("Network")
        ) {
          errorMessage =
            "Network error. Please check your internet connection and try again.";
          errorTitle = "Connection Error";
        } else {
          errorMessage = error.message;
        }
      }

      setErrorDialogConfig({
        title: errorTitle,
        message: errorMessage,
      });
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <div className="space-y-6 max-w-xs sm:max-w-2xl mx-auto px-2">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account Type Section */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Account Type</h3>
          <RadioGroup
            value={signupData.accountType}
            onValueChange={(
              value: "individual" | "business/organization" | "group/team"
            ) => setSignupData((prev) => ({ ...prev, accountType: value }))}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="individual" id="individual" />
              <Label htmlFor="individual" className="text-sm cursor-pointer">
                Individual
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="business/organization" id="business" />
              <Label htmlFor="business" className="text-sm cursor-pointer">
                Business/Organization
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="group/team" id="group" />
              <Label htmlFor="group" className="text-sm cursor-pointer">
                Group/Team
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Company Information (for business/organization and group/team) */}
        {(signupData.accountType === "business/organization" ||
          signupData.accountType === "group/team") && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <h3 className="text-lg font-semibold">
              {signupData.accountType === "business/organization"
                ? "Business/Organization Information"
                : "Group/Team Information"}
            </h3>

            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-sm">
                {signupData.accountType === "business/organization"
                  ? "Business/Organization Name"
                  : "Group/Team Name"}
              </Label>
              <Input
                id="companyName"
                value={signupData.companyName}
                onChange={(e) =>
                  handleFieldChange("companyName", e.target.value)
                }
                placeholder={
                  signupData.accountType === "business/organization"
                    ? "Enter business/organization name"
                    : "Enter group/team name"
                }
                className={`h-8 text-sm ${getFieldErrorClass("companyName")}`}
              />
              {getFieldValidation("companyName") && (
                <ValidationMessage
                  type={getFieldValidation("companyName").type}
                  message={getFieldValidation("companyName").message}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="companyExecutorFirstName" className="text-sm">
                  Executor First Name
                </Label>
                <Input
                  id="companyExecutorFirstName"
                  value={signupData.companyExecutorFirstName}
                  onChange={(e) =>
                    handleFieldChange(
                      "companyExecutorFirstName",
                      e.target.value
                    )
                  }
                  placeholder="First Name"
                  className={`h-8 text-sm ${getFieldErrorClass(
                    "companyExecutorFirstName"
                  )}`}
                />
                {getFieldValidation("companyExecutorFirstName") && (
                  <ValidationMessage
                    type={getFieldValidation("companyExecutorFirstName").type}
                    message={
                      getFieldValidation("companyExecutorFirstName").message
                    }
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyExecutorLastName" className="text-sm">
                  Executor Last Name
                </Label>
                <Input
                  id="companyExecutorLastName"
                  value={signupData.companyExecutorLastName}
                  onChange={(e) =>
                    handleFieldChange("companyExecutorLastName", e.target.value)
                  }
                  placeholder="Last Name"
                  className={`h-8 text-sm ${getFieldErrorClass(
                    "companyExecutorLastName"
                  )}`}
                />
                {getFieldValidation("companyExecutorLastName") && (
                  <ValidationMessage
                    type={getFieldValidation("companyExecutorLastName").type}
                    message={
                      getFieldValidation("companyExecutorLastName").message
                    }
                  />
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Account Master Selection
              </Label>
              <p className="text-xs text-muted-foreground">
                Choose who will be the Account Master for this{" "}
                {signupData.accountType === "business/organization"
                  ? "business/organization"
                  : "group/team"}
                .
              </p>
              <UserSearchBox
                onUserSelect={handleUserSelect}
                selectedUser={null}
              />
              {signupData.companyAccountMasterName && (
                <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                  <strong>Selected Account Master:</strong>{" "}
                  {signupData.companyAccountMasterName}
                </div>
              )}
            </div>

            <div
              className={`flex items-center space-x-2 p-2 rounded border ${
                !signupData.companyExecutorAcknowledged
                  ? "border-red-300 bg-red-50"
                  : "border-green-300 bg-green-50"
              }`}
            >
              <Checkbox
                id="executorAuth"
                checked={signupData.companyExecutorAcknowledged}
                onCheckedChange={(checked) =>
                  setSignupData((prev) => ({
                    ...prev,
                    companyExecutorAcknowledged: !!checked,
                  }))
                }
                className={
                  !signupData.companyExecutorAcknowledged
                    ? "border-red-400"
                    : "border-green-400"
                }
              />
              <Label
                htmlFor="executorAuth"
                className={`text-xs ${
                  !signupData.companyExecutorAcknowledged
                    ? "text-red-700"
                    : "text-green-700"
                }`}
              >
                I acknowledge that the selected Account Master has executor
                authority for this{" "}
                {signupData.accountType === "business/organization"
                  ? "business/organization"
                  : "group/team"}{" "}
                account.
              </Label>
            </div>
          </div>
        )}

        {/* Basic Account Information */}
        <div className="space-y-4 ">
          <h3 className="text-lg font-semibold">Account Information</h3>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={signupData.email}
              onChange={(e) => handleFieldChange("email", e.target.value)}
              placeholder="Enter your email (e.g., user@example.com)"
              className={`h-8 text-sm ${getFieldErrorClass("email")}`}
            />
            {getFieldValidation("email") && (
              <ValidationMessage
                type={getFieldValidation("email").type}
                message={getFieldValidation("email").message}
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={signupData.password}
                  onChange={(e) =>
                    handleFieldChange("password", e.target.value)
                  }
                  placeholder="Enter password"
                  className={`h-8 text-sm pr-10 ${getFieldErrorClass(
                    "password"
                  )}`}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {getFieldValidation("password") && (
                <ValidationMessage
                  type={getFieldValidation("password").type}
                  message={getFieldValidation("password").message}
                />
              )}
              {!getFieldValidation("password") &&
                signupData.password === "" && (
                  <div className="text-xs text-gray-500">
                    Must be at least 8 characters
                  </div>
                )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={signupData.confirmPassword}
                  onChange={(e) =>
                    handleFieldChange("confirmPassword", e.target.value)
                  }
                  placeholder="Confirm password"
                  className={`h-8 text-sm pr-10 ${getFieldErrorClass(
                    "confirmPassword"
                  )}`}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {getFieldValidation("confirmPassword") && (
                <ValidationMessage
                  type={getFieldValidation("confirmPassword").type}
                  message={getFieldValidation("confirmPassword").message}
                />
              )}
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
            <p className="text-xs text-muted-foreground text-center">
              Click to upload profile photo (optional)
            </p>
            <div className="flex items-center space-x-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded">
              <Info className="w-3 h-3" />
              <span>
                Tip: Uploading a profile photo increases interest and activity
                by over 300% on average!
              </span>
            </div>
          </div>

          {/* Only show first/last name for individual accounts since business accounts use executor fields */}
          {signupData.accountType === "individual" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  value={signupData.firstName}
                  onChange={(e) =>
                    handleFieldChange("firstName", e.target.value)
                  }
                  placeholder="First Name"
                  className={`h-8 text-sm ${getFieldErrorClass("firstName")}`}
                />
                {getFieldValidation("firstName") && (
                  <ValidationMessage
                    type={getFieldValidation("firstName").type}
                    message={getFieldValidation("firstName").message}
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  value={signupData.lastName}
                  onChange={(e) =>
                    handleFieldChange("lastName", e.target.value)
                  }
                  placeholder="Last Name"
                  className={`h-8 text-sm ${getFieldErrorClass("lastName")}`}
                />
                {getFieldValidation("lastName") && (
                  <ValidationMessage
                    type={getFieldValidation("lastName").type}
                    message={getFieldValidation("lastName").message}
                  />
                )}
              </div>
            </div>
          )}

          {/* Only show birth date for individual accounts */}
          {signupData.accountType === "individual" && (
            <div className="space-y-2">
              <Label htmlFor="birthDate" className="text-sm">
                Birth Date
              </Label>
              <BirthdaySelector
                value={signupData.birthDate}
                onChange={(date) => handleFieldChange("birthDate", date)}
                className={getFieldErrorClass("birthDate")}
              />
              {getFieldValidation("birthDate") && (
                <ValidationMessage
                  type={getFieldValidation("birthDate").type}
                  message={getFieldValidation("birthDate").message}
                />
              )}
              {signupData.birthDate && !getFieldValidation("birthDate") && (
                <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                  Age: {calculateAge(signupData.birthDate)} years old
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm">
              {signupData.accountType === "business/organization"
                ? "Business/Organization Cell Phone Number"
                : signupData.accountType === "group/team"
                ? "Group/Team Cell Phone Number"
                : "Cell Phone Number"}
            </Label>
            <Input
              id="phone"
              type="tel"
              value={signupData.phone}
              onChange={(e) => {
                handlePhoneChange(e);
                // Validate with a slight delay to allow formatting to complete
                setTimeout(() => {
                  handleFieldChange("phone", e.target.value);
                }, 100);
              }}
              placeholder="XXX-XXX-XXXX"
              className={`h-8 text-sm ${getFieldErrorClass("phone")}`}
            />
            {getFieldValidation("phone") && (
              <ValidationMessage
                type={getFieldValidation("phone").type}
                message={getFieldValidation("phone").message}
              />
            )}
            {!getFieldValidation("phone") && signupData.phone === "" && (
              <div className="text-xs text-gray-500">
                Format: XXX-XXX-XXXX (10 digits)
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="location" className="text-sm">
              Location (Optional)
            </Label>
            <Input
              id="location"
              value={signupData.location}
              onChange={(e) =>
                setSignupData((prev) => ({ ...prev, location: e.target.value }))
              }
              placeholder="City, State/Country"
              className="h-8 text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="bio" className="text-sm">
              Bio (Optional)
            </Label>
            <Textarea
              id="bio"
              value={signupData.bio}
              onChange={(e) =>
                setSignupData((prev) => ({ ...prev, bio: e.target.value }))
              }
              placeholder="Tell us about yourself..."
              className="text-sm min-h-[60px]"
            />
          </div>
        </div>

        {/* Legal Agreement Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Legal Agreement</h3>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="agreeTerms"
                checked={signupData.agreeToTerms}
                onCheckedChange={(checked) =>
                  setSignupData((prev) => ({
                    ...prev,
                    agreeToTerms: !!checked,
                  }))
                }
              />
              <Label htmlFor="agreeTerms" className="text-sm">
                I agree to the{" "}
                <Link to="/terms" className="underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="underline">
                  Privacy Policy
                </Link>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirmAge"
                checked={signupData.confirmAge}
                onCheckedChange={(checked) =>
                  setSignupData((prev) => ({ ...prev, confirmAge: !!checked }))
                }
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
                  <span className="text-green-600 text-sm font-medium ml-auto">
                    ✓ Signed
                  </span>
                )}
              </div>

              {!legalDocumentSigned && (
                <>
                  <div className="bg-red-100 p-3 rounded border border-red-300">
                    <p className="text-red-700 text-sm font-medium">
                      This document contains critical legal terms that LIMIT
                      PUBLIC STREAMER'S LIABILITY and TRANSFER RISKS TO YOU.
                      Read carefully before signing.
                    </p>
                  </div>

                  <div className="space-y-3 text-xs max-h-40 overflow-y-auto border p-3 bg-white">
                    <LegalAgreementBody size="xs" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="risks"
                        checked={acknowledgedRisks}
                        onCheckedChange={(checked) =>
                          setAcknowledgedRisks(!!checked)
                        }
                      />
                      <Label htmlFor="risks" className="text-xs">
                        I acknowledge that I have read and understand the risks
                        and liability waivers above
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="liability"
                        checked={acknowledgedLiability}
                        onCheckedChange={(checked) =>
                          setAcknowledgedLiability(!!checked)
                        }
                      />
                      <Label htmlFor="liability" className="text-xs">
                        I agree to indemnify and hold harmless Public Streamer
                        from all claims and damages
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="compliance"
                        checked={acknowledgedCompliance}
                        onCheckedChange={(checked) =>
                          setAcknowledgedCompliance(!!checked)
                        }
                      />
                      <Label htmlFor="compliance" className="text-xs">
                        I certify that I will comply with all laws and platform
                        terms
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="prohibited"
                        checked={acknowledgedProhibited}
                        onCheckedChange={(checked) =>
                          setAcknowledgedProhibited(!!checked)
                        }
                      />
                      <Label htmlFor="prohibited" className="text-xs">
                        I have read and agree to the Public Streamer Terms of
                        Service, including the prohibition on monetizing
                        prohibited content categories listed above.
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="legalSignature"
                      className="text-sm font-medium"
                    >
                      Electronic Signature (Type your full legal name exactly)
                    </Label>
                    {userFullName && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        <p className="text-xs text-blue-700 font-medium">
                          Please type exactly:{" "}
                          <span className="font-bold">{userFullName}</span>
                        </p>
                      </div>
                    )}
                    <Input
                      id="legalSignature"
                      value={legalSignature}
                      onChange={(e) => {
                        setLegalSignature(e.target.value);
                        handleFieldChange("legalSignature", e.target.value);
                      }}
                      placeholder={
                        userFullName
                          ? `Type: ${userFullName}`
                          : "Type your full legal name"
                      }
                      className={`h-8 text-sm ${
                        legalSignature.trim() && !isValidLegalSignature
                          ? "border-red-500 bg-red-50"
                          : ""
                      }`}
                    />
                    {getFieldValidation("legalSignature") && (
                      <ValidationMessage
                        type={getFieldValidation("legalSignature").type}
                        message={getFieldValidation("legalSignature").message}
                      />
                    )}
                  </div>

                  <Button
                    type="button"
                    onClick={handleLegalDocumentAccept}
                    disabled={!canSignLegal}
                    className={`w-full ${
                      canSignLegal
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-gray-400 text-gray-700 cursor-not-allowed"
                    }`}
                  >
                    {canSignLegal
                      ? "I Accept and Electronically Sign"
                      : "Complete All Fields Above"}
                  </Button>
                </>
              )}

              {legalDocumentSigned && signatureData && (
                <div className="text-xs text-green-700 bg-green-100 p-2 rounded">
                  ✓ Legal document signed by: {signatureData.signature} on{" "}
                  {signatureData.date}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 space-y-3">
          {getFormValidationError() && (
            <ValidationMessage
              type="error"
              message={getFormValidationError()!}
              className="w-full"
            />
          )}

          <Button
            type="submit"
            disabled={loading || !!getFormValidationError()}
            className="w-full h-10"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </Button>

          {/* Cancel Button */}
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full h-10 border-2 hover:bg-destructive/10 hover:border-destructive/50"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );

  if (inline) {
    return <div className="auth-template">{formContent}</div>;
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 auth-template"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="h-full w-full flex items-start justify-center overflow-auto p-2 sm:p-3">
          <div
            className="w-full max-w-4xl min-h-full bg-card rounded-lg border shadow-lg overflow-hidden mx-auto my-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ minHeight: "fit-content" }}
          >
            {/* Fixed Header */}
            <div className="sticky top-0 z-10 bg-card p-4 sm:p-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0 flex-1">
                  <LiveStreamLogo
                    size="md"
                    className="mr-2 sm:mr-3 flex-shrink-0"
                  />
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                    Create Your{" "}
                    <span className="font-orbitron font-black bg-gradient-to-r from-primary via-blue-500 to-purple-600 bg-clip-text text-transparent">
                      Public Streamer
                    </span>{" "}
                    Account
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground hover:bg-destructive/10 p-2"
                  aria-label="Close form"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              {error && (
                <Alert variant="destructive" className="mt-3">
                  <AlertDescription className="text-sm">
                    {error}
                  </AlertDescription>
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

            {/* Scrollable Content */}
            <div className="p-4 sm:p-3 pb-8">{formContent}</div>
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
