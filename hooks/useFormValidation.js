import { useCallback } from 'react';

export function useFormValidation() {
  const validateEmailFormat = useCallback((email) => {
    if (!email) return 'Vul een geldig e-mailadres in';
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email) ? '' : 'Vul een geldig e-mailadres in';
  }, []);

  const validatePassword = useCallback((password) => {
    if (!password) return 'Je wachtwoord moet minstens 8 tekens, een hoofdletter, een cijfer en een speciaal teken bevatten';
    const re = /(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}/;
    return re.test(password) ? '' : 'Je wachtwoord moet minstens 8 tekens, een hoofdletter, een cijfer en een speciaal teken bevatten';
  }, []);

  const passwordStrength = useCallback((password) => {
    if (!password) return '';
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return 'weak';
    if (score === 2 || score === 3) return 'medium';
    return 'strong';
  }, []);

  return {
    validateEmailFormat,
    validatePassword,
    passwordStrength,
  };
}
