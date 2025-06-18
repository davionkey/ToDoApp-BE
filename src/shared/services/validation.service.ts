import { Injectable } from '@nestjs/common';

@Injectable()
export class ValidationService {
  /**
   * Validates if a string is a valid email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validates password strength
   * At least 8 characters, 1 uppercase, 1 lowercase, 1 number
   */
  isValidPassword(password: string): boolean {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  /**
   * Validates if a string is not empty after trimming
   */
  isNotEmpty(value: string): boolean {
    return Boolean(value && value.trim().length > 0);
  }

  /**
   * Validates UUID format
   */
  isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}
