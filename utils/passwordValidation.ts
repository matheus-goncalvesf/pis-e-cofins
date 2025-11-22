/**
 * Validates password strength requirements
 * Password must contain at least:
 * - 1 letter (uppercase or lowercase)
 * - 1 number
 * - 1 special symbol
 * - Minimum 6 characters
 */
export function validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    // Check minimum length
    if (password.length < 6) {
        errors.push('A senha deve ter pelo menos 6 caracteres');
    }

    // Check for at least one letter
    if (!/[a-zA-Z]/.test(password)) {
        errors.push('A senha deve conter pelo menos 1 letra');
    }

    // Check for at least one number
    if (!/[0-9]/.test(password)) {
        errors.push('A senha deve conter pelo menos 1 número');
    }

    // Check for at least one special symbol
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('A senha deve conter pelo menos 1 símbolo especial (!@#$%^&* etc)');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Gets a user-friendly message for password requirements
 */
export function getPasswordRequirementsMessage(): string {
    return 'A senha deve ter pelo menos 6 caracteres, incluindo 1 letra, 1 número e 1 símbolo especial';
}
