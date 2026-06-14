import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, generateBlindIndex } from '@/lib/crypto';
import { encryptAsync, decryptAsync } from '@/lib/crypto-client';

describe('Cryptography Helpers', () => {
    describe('Encryption and Decryption', () => {
        it('should encrypt a string and return it in the versioned format', () => {
            const secret = '0901234567';
            const encrypted = encrypt(secret);
            
            expect(encrypted).not.toBeNull();
            expect(encrypted).toBeTypeOf('string');
            expect(encrypted!.startsWith('v1:')).toBe(true);
            
            // Format: v1:ivHex:ciphertextHex:tagHex
            const parts = encrypted!.split(':');
            expect(parts.length).toBe(4);
            expect(parts[0]).toBe('v1');
            expect(parts[1]).toHaveLength(24); // 12-byte IV in hex
            expect(parts[3]).toHaveLength(32); // 16-byte Auth Tag in hex
        });

        it('should decrypt an encrypted string back to its original value', () => {
            const originalText = 'Hello Secure World! 123';
            const encrypted = encrypt(originalText);
            const decrypted = decrypt(encrypted);
            
            expect(decrypted).toBe(originalText);
        });

        it('should return null when encrypting or decrypting null/undefined/empty input', () => {
            expect(encrypt(null)).toBeNull();
            expect(encrypt(undefined)).toBeNull();
            expect(decrypt(null)).toBeNull();
            expect(decrypt(undefined)).toBeNull();
            expect(decrypt('')).toBeNull();
        });

        it('should return the original text directly if not encrypted (backward compatibility)', () => {
            const plainText = '0901234567';
            const decrypted = decrypt(plainText);
            expect(decrypted).toBe(plainText);
        });

        it('should return null and log an error if format is invalid but starts with v1:', () => {
            const badEncrypted = 'v1:badiv:badcipher';
            expect(decrypt(badEncrypted)).toBeNull();
        });
    });

    describe('Client Async Crypto Compatibility', () => {

        it('should encrypt asynchronously and decrypt asynchronously', async () => {
            const originalText = 'Hello Client Crypto 123!';
            const encrypted = await encryptAsync(originalText);
            expect(encrypted).not.toBeNull();
            expect(encrypted!.startsWith('v1:')).toBe(true);
            
            const decrypted = await decryptAsync(encrypted);
            expect(decrypted).toBe(originalText);
        });

        it('should decrypt server-encrypted data with client-decryptAsync', async () => {
            const originalText = 'Server to Client payload';
            const serverEncrypted = encrypt(originalText);
            const clientDecrypted = await decryptAsync(serverEncrypted);
            expect(clientDecrypted).toBe(originalText);
        });

        it('should decrypt client-encrypted data with server-decrypt', async () => {
            const originalText = 'Client to Server payload';
            const clientEncrypted = await encryptAsync(originalText);
            const serverDecrypted = decrypt(clientEncrypted);
            expect(serverDecrypted).toBe(originalText);
        });

        it('should handle empty/null inputs in async helpers', async () => {
            expect(await encryptAsync(null)).toBeNull();
            expect(await encryptAsync(undefined)).toBeNull();
            expect(await decryptAsync(null)).toBeNull();
            expect(await decryptAsync(undefined)).toBeNull();
            expect(await decryptAsync('')).toBeNull();
            expect(await decryptAsync('plain')).toBe('plain');
        });
    });

    describe('Blind Index Generation', () => {
        it('should generate a deterministic hash for identical input values', () => {
            const phone1 = '090 123 4567';
            const phone2 = ' 0901234567 ';
            const phone3 = '0901-234-567';
            
            // Note: generateBlindIndex only trims, lowercases, and removes spaces.
            // It does not remove dashes by default unless we pass sanitized values.
            const index1 = generateBlindIndex(phone1);
            const index2 = generateBlindIndex(phone2);
            
            expect(index1).toBeTypeOf('string');
            expect(index1).toHaveLength(64); // SHA256 hex digest length
            expect(index1).toBe(index2); // Both normalize spaces to '0901234567'
        });

        it('should return different hashes for different phone numbers', () => {
            const index1 = generateBlindIndex('0901234567');
            const index2 = generateBlindIndex('0907654321');
            
            expect(index1).not.toBe(index2);
        });

        it('should return null for null/undefined inputs', () => {
            expect(generateBlindIndex(null)).toBeNull();
            expect(generateBlindIndex(undefined)).toBeNull();
        });
    });
});
