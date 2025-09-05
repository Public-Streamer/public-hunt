import { useState, useCallback } from 'react';

interface ValidationRule {
  test: (value: any) => boolean;
  message: string;
}

interface FormValidationOptions {
  realTime?: boolean;
  debounceMs?: number;
}

export const useFormValidation = (options: FormValidationOptions = {}) => {
  const [validationState, setValidationState] = useState<
    Record<
      string,
      {
        isValid: boolean;
        message: string;
        type: 'success' | 'error' | 'warning' | 'info';
      }
    >
  >({});

  const validateField = useCallback(
    (fieldName: string, value: any, rules: ValidationRule[]) => {
      for (const rule of rules) {
        if (!rule.test(value)) {
          setValidationState((prev) => ({
            ...prev,
            [fieldName]: {
              isValid: false,
              message: rule.message,
              type: 'error',
            },
          }));
          return false;
        }
      }

      setValidationState((prev) => ({
        ...prev,
        [fieldName]: {
          isValid: true,
          message: 'Valid',
          type: 'success',
        },
      }));
      return true;
    },
    []
  );

  const clearFieldValidation = useCallback((fieldName: string) => {
    setValidationState((prev) => {
      const newState = { ...prev };
      delete newState[fieldName];
      return newState;
    });
  }, []);

  const getFieldValidation = useCallback(
    (fieldName: string) => {
      return validationState[fieldName];
    },
    [validationState]
  );

  const isFormValid = useCallback(() => {
    return Object.values(validationState).every((field) => field.isValid);
  }, [validationState]);

  return {
    validateField,
    clearFieldValidation,
    getFieldValidation,
    isFormValid,
    validationState,
  };
};

// Common validation rules
export const validationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    test: (value) => value && value.toString().trim() !== '',
    message,
  }),

  email: (message = 'Please enter a valid email address'): ValidationRule => ({
    test: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return !value || emailRegex.test(value);
    },
    message,
  }),

  minLength: (length: number, message?: string): ValidationRule => ({
    test: (value) => !value || value.toString().length >= length,
    message: message || `Must be at least ${length} characters`,
  }),

  phone: (
    message = 'Please enter a valid phone number (XXX-XXX-XXXX)'
  ): ValidationRule => ({
    test: (value) => {
      if (!value) return false;
      const phoneDigits = value.replace(/\D/g, '');
      return phoneDigits.length === 10;
    },
    message,
  }),

  passwordMatch: (
    confirmPassword: string,
    message = 'Passwords do not match'
  ): ValidationRule => ({
    test: (password) =>
      !password || !confirmPassword || password === confirmPassword,
    message,
  }),

  age: (
    minAge: number,
    birthDate: string,
    message?: string
  ): ValidationRule => ({
    test: () => {
      if (!birthDate) return false;
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

      return age >= minAge;
    },
    message: message || `You must be ${minAge} or older`,
  }),

  exactMatch: (expectedValue: string, message?: string): ValidationRule => ({
    test: (value) => {
      if (!value || !expectedValue) return false;
      return (
        value.trim().toLowerCase().replace(/\s+/g, ' ') ===
        expectedValue.trim().toLowerCase().replace(/\s+/g, ' ')
      );
    },
    message: message || `Must match exactly: ${expectedValue}`,
  }),
};
