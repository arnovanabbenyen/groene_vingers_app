import { useState, useCallback, useMemo } from 'react';
import { useFormValidation } from './useFormValidation';

export function useRegisterForm() {
  const { validateEmailFormat, validatePassword, passwordStrength } = useFormValidation();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // { field: 'email'|'password'|null, message: string } | null
  const [serverError, setServerErrorState] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const strength = useMemo(
    () => (password ? passwordStrength(password) : ''),
    [password, passwordStrength],
  );

  const errors = useMemo(() => {
    const result = {};

    if (emailTouched || attemptedSubmit) {
      if (serverError?.field === 'email') {
        result.email = serverError.message;
      } else {
        const err = validateEmailFormat(email);
        if (err) result.email = err;
      }
    }

    if (passwordTouched || attemptedSubmit) {
      if (serverError?.field === 'password') {
        result.password = serverError.message;
      } else {
        const err = validatePassword(password);
        if (err) result.password = err;
      }
    }

    if (attemptedSubmit && !acceptedTerms) {
      result.terms = 'Je moet akkoord gaan met de voorwaarden';
    }

    return result;
  }, [
    email, password, acceptedTerms, serverError,
    emailTouched, passwordTouched, attemptedSubmit,
    validateEmailFormat, validatePassword,
  ]);

  const errorCount = Object.keys(errors).length;

  const bannerError = useMemo(() => {
    if (serverError && !serverError.field) {
      return serverError.message;
    }
    if (errorCount >= 2) {
      return `${errorCount} velden hebben een fout`;
    }
    return null;
  }, [errorCount, serverError]);

  const handleEmailChange = useCallback((val) => {
    setEmail(val);
    if (serverError?.field === 'email') setServerErrorState(null);
  }, [serverError]);

  const handlePasswordChange = useCallback((val) => {
    setPassword(val);
    if (serverError?.field === 'password') setServerErrorState(null);
  }, [serverError]);

  const handleEmailBlur = useCallback(() => setEmailTouched(true), []);
  const handlePasswordBlur = useCallback(() => setPasswordTouched(true), []);
  const toggleTerms = useCallback(() => setAcceptedTerms((v) => !v), []);

  const validate = useCallback(() => {
    setAttemptedSubmit(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    const formatError = validateEmailFormat(email);
    const pwdError = validatePassword(password);
    return !formatError && !pwdError && acceptedTerms;
  }, [email, password, acceptedTerms, validateEmailFormat, validatePassword]);

  const setSignupError = useCallback((error) => {
    if (!error) { setServerErrorState(null); return; }
    const msg = error.message || '';
    if (/already.*registered|already.*exists|user.*exists/i.test(msg)) {
      setServerErrorState({ field: 'email', message: 'Dit e-mailadres is al in gebruik' });
    } else if (/password/i.test(msg)) {
      setServerErrorState({ field: 'password', message: msg });
    } else {
      setServerErrorState({ field: null, message: 'Account aanmaken mislukt. Probeer opnieuw.' });
    }
  }, []);

  return {
    values: { firstName, lastName, email, password, acceptedTerms },
    setFirstName,
    setLastName,
    toggleTerms,
    handleEmailChange,
    handlePasswordChange,
    handleEmailBlur,
    handlePasswordBlur,
    errors,
    bannerError,
    strength,
    submitting,
    setSubmitting,
    validate,
    setSignupError,
  };
}
