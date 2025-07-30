const {
  validateEmail,
  validatePassword,
  validateUsername,
} = require('../../../utils/validationUtils');

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    test('should validate correct email format', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.org')).toBe(true);
    });

    test('should reject invalid email format', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@example')).toBe(false);
      expect(validateEmail('')).toBe(false);
      expect(validateEmail(null)).toBe(false);
      expect(validateEmail(undefined)).toBe(false);
    });
  });

  describe('validatePassword', () => {
    test('should validate strong password', () => {
      expect(validatePassword('StrongPass123!')).toBe(true);
      expect(validatePassword('MySecureP@ssw0rd')).toBe(true);
      expect(validatePassword('Complex123!@#')).toBe(true);
      expect(validatePassword('Test123!')).toBe(true);
    });

    test('should reject weak password', () => {
      expect(validatePassword('weak')).toBe(false);
      expect(validatePassword('123456')).toBe(false);
      expect(validatePassword('password')).toBe(false);
      expect(validatePassword('')).toBe(false);
      expect(validatePassword(null)).toBe(false);
      expect(validatePassword(undefined)).toBe(false);
    });

    test('should require minimum length', () => {
      expect(validatePassword('Abc123!')).toBe(false); // too short
    });

    test('should require uppercase letter', () => {
      expect(validatePassword('lowercase123!')).toBe(false);
    });

    test('should require lowercase letter', () => {
      expect(validatePassword('UPPERCASE123!')).toBe(false);
    });

    test('should require number', () => {
      expect(validatePassword('NoNumbers!')).toBe(false);
    });

    test('should require special character', () => {
      expect(validatePassword('NoSpecialChar123')).toBe(false);
    });
  });

  describe('validateUsername', () => {
    test('should validate correct username format', () => {
      expect(validateUsername('testuser')).toBe(true);
      expect(validateUsername('user123')).toBe(true);
      expect(validateUsername('test_user')).toBe(true);
      expect(validateUsername('test-user')).toBe(true);
    });

    test('should reject invalid username format', () => {
      expect(validateUsername('')).toBe(false);
      expect(validateUsername('a')).toBe(false); // too short
      expect(validateUsername('verylongusername123456789')).toBe(false); // too long
      expect(validateUsername('user@name')).toBe(false); // invalid character
      expect(validateUsername('user name')).toBe(false); // space
      expect(validateUsername('user.name')).toBe(false); // dot
      expect(validateUsername(null)).toBe(false);
      expect(validateUsername(undefined)).toBe(false);
    });

    test('should require minimum length', () => {
      expect(validateUsername('ab')).toBe(false); // too short
    });

    test('should enforce maximum length', () => {
      expect(validateUsername('verylongusername123456789')).toBe(false); // too long
    });

    test('should allow alphanumeric and underscore', () => {
      expect(validateUsername('user123')).toBe(true);
      expect(validateUsername('test_user')).toBe(true);
      expect(validateUsername('user-name')).toBe(true);
    });
  });
});
