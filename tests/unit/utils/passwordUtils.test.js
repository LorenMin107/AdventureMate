const bcrypt = require('bcrypt');
const { hashPassword, comparePassword } = require('../../../utils/passwordUtils');

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('Password Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    test('should hash password successfully', async () => {
      const mockHash = '$2b$10$mockhash';
      bcrypt.hash.mockResolvedValue(mockHash);

      const result = await hashPassword('testpassword');

      expect(bcrypt.hash).toHaveBeenCalledWith('testpassword', 12);
      expect(result).toBe(mockHash);
    });

    test('should throw error on hashing failure', async () => {
      const error = new Error('Hashing failed');
      bcrypt.hash.mockRejectedValue(error);

      await expect(hashPassword('testpassword')).rejects.toThrow('Failed to hash password');
    });
  });

  describe('comparePassword', () => {
    test('should return true for matching password', async () => {
      bcrypt.compare.mockResolvedValue(true);

      const result = await comparePassword('testpassword', '$2b$10$mockhash');

      expect(bcrypt.compare).toHaveBeenCalledWith('testpassword', '$2b$10$mockhash');
      expect(result).toBe(true);
    });

    test('should return false for non-matching password', async () => {
      bcrypt.compare.mockResolvedValue(false);

      const result = await comparePassword('wrongpassword', '$2b$10$mockhash');

      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', '$2b$10$mockhash');
      expect(result).toBe(false);
    });

    test('should handle missing password', async () => {
      const result = await comparePassword('', '$2b$10$mockhash');

      expect(result).toBe(false);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    test('should handle missing hash', async () => {
      const result = await comparePassword('testpassword', '');

      expect(result).toBe(false);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    test('should handle null password', async () => {
      const result = await comparePassword(null, '$2b$10$mockhash');

      expect(result).toBe(false);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    test('should handle null hash', async () => {
      const result = await comparePassword('testpassword', null);

      expect(result).toBe(false);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    test('should throw error on comparison failure', async () => {
      const error = new Error('Comparison failed');
      bcrypt.compare.mockRejectedValue(error);

      await expect(comparePassword('testpassword', '$2b$10$mockhash')).rejects.toThrow(
        'Failed to compare password'
      );
    });
  });
});
