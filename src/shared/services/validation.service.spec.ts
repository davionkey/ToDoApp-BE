import { Test, TestingModule } from '@nestjs/testing';
import { ValidationService } from './validation.service';

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValidationService],
    }).compile();

    service = module.get<ValidationService>(ValidationService);
  });

  describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
      // Arrange
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'firstname.lastname@subdomain.example.com',
      ];

      // Act & Assert
      validEmails.forEach((email) => {
        expect(service.isValidEmail(email)).toBe(true);
      });
    });

    it('should return false for invalid email addresses', () => {
      // Arrange
      const invalidEmails = ['invalid-email', '@example.com', 'user@', ''];

      // Act & Assert
      invalidEmails.forEach((email) => {
        expect(service.isValidEmail(email)).toBe(false);
      });
    });

    it('should handle null and undefined inputs', () => {
      // Act & Assert
      expect(service.isValidEmail(null as any)).toBe(false);
      expect(service.isValidEmail(undefined as any)).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should return true for valid passwords', () => {
      // Arrange
      const validPasswords = [
        'StrongP@ssw0rd',
        'MySecure123',
        'C0mpl3xPass',
        'ValidPass1',
      ];

      // Act & Assert
      validPasswords.forEach((password) => {
        expect(service.isValidPassword(password)).toBe(true);
      });
    });

    it('should return false for weak passwords', () => {
      // Arrange
      const weakPasswords = [
        'weak',
        '12345678',
        'password',
        'PASSWORD',
        'Pass123',
        'Pass!@#',
        'weakpassword123',
      ];

      // Act & Assert
      weakPasswords.forEach((password) => {
        expect(service.isValidPassword(password)).toBe(false);
      });
    });

    it('should handle null and undefined inputs', () => {
      // Act & Assert
      expect(service.isValidPassword(null as any)).toBe(false);
      expect(service.isValidPassword(undefined as any)).toBe(false);
    });
  });

  describe('isValidUUID', () => {
    it('should return true for valid UUIDs', () => {
      // Arrange
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        'a1b2c3d4-e5f6-1890-8bcd-ef1234567890',
      ];

      // Act & Assert
      validUUIDs.forEach((uuid) => {
        expect(service.isValidUUID(uuid)).toBe(true);
      });
    });

    it('should return false for invalid UUIDs', () => {
      // Arrange
      const invalidUUIDs = [
        'not-a-uuid',
        '123e4567-e89b-12d3-a456',
        '123e4567-e89b-12d3-a456-426614174000-extra',
        'gggggggg-gggg-gggg-gggg-gggggggggggg',
        '',
        '123',
      ];

      // Act & Assert
      invalidUUIDs.forEach((uuid) => {
        expect(service.isValidUUID(uuid)).toBe(false);
      });
    });

    it('should handle null and undefined inputs', () => {
      // Act & Assert
      expect(service.isValidUUID(null as any)).toBe(false);
      expect(service.isValidUUID(undefined as any)).toBe(false);
    });
  });

  describe('isNotEmpty', () => {
    it('should return true for non-empty strings', () => {
      // Arrange
      const validStrings = [
        'Hello World',
        'test',
        'a',
        '123',
        'special@characters!',
      ];

      // Act & Assert
      validStrings.forEach((str) => {
        expect(service.isNotEmpty(str)).toBe(true);
      });
    });

    it('should return false for empty or whitespace strings', () => {
      // Arrange
      const emptyStrings = ['', '   ', '\t', '\n', '  \t  \n  '];

      // Act & Assert
      emptyStrings.forEach((str) => {
        expect(service.isNotEmpty(str)).toBe(false);
      });
    });

    it('should handle null and undefined inputs', () => {
      // Act & Assert
      expect(service.isNotEmpty(null as any)).toBe(false);
      expect(service.isNotEmpty(undefined as any)).toBe(false);
    });
  });
});
