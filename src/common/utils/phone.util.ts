/**
 * Phone number utility functions
 * Handles E.164 format phone numbers (e.g., +918266831757)
 */

/**
 * Format phone number to E.164 format
 * E.164 format: +[country code][number] (e.g., +918266831757 for India)
 */
export function formatPhoneToE164(phoneNumber: string, defaultCountryCode: string = '+91'): string {
  // Remove all spaces, dashes, and parentheses
  let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');

  // If already starts with +, return as is
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // If starts with 0, remove it (common in India: 08266831757 -> 8266831757)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // If doesn't start with country code, add it
  if (!cleaned.startsWith(defaultCountryCode.replace('+', ''))) {
    cleaned = defaultCountryCode.replace('+', '') + cleaned;
  }

  // Add + prefix
  return '+' + cleaned;
}

/**
 * Validate phone number in E.164 format
 */
export function validateE164Format(phoneNumber: string): boolean {
  // E.164 format: +[country code][number], max 15 digits after +
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
}

/**
 * Validate Indian phone number
 * Indian mobile numbers: +91 followed by 10 digits (first digit should be 6-9)
 */
export function validateIndianPhone(phoneNumber: string): boolean {
  const indianPhoneRegex = /^\+91[6-9]\d{9}$/;
  return indianPhoneRegex.test(phoneNumber);
}

/**
 * Extract country code from E.164 phone number
 */
export function extractCountryCode(phoneNumber: string): string | null {
  if (!phoneNumber.startsWith('+')) {
    return null;
  }

  // For India, country code is +91
  if (phoneNumber.startsWith('+91')) {
    return '+91';
  }

  // Extract first 1-3 digits after + as country code
  const match = phoneNumber.match(/^\+(\d{1,3})/);
  return match ? '+' + match[1] : null;
}

/**
 * Format phone number for display (add spaces/dashes for readability)
 * E.g., +918266831757 -> +91 82668 31757
 */
export function formatPhoneForDisplay(phoneNumber: string): string {
  if (!phoneNumber.startsWith('+')) {
    return phoneNumber;
  }

  // For Indian numbers: +91 82668 31757
  if (phoneNumber.startsWith('+91')) {
    const number = phoneNumber.substring(3);
    if (number.length === 10) {
      return `+91 ${number.substring(0, 5)} ${number.substring(5)}`;
    }
  }

  return phoneNumber;
}

