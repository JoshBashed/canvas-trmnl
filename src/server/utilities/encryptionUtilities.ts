import crypto from 'node:crypto';
import { appEnv } from '@/server/appEnv.ts';

/**
 * Version number.
 */
const VERSION = 'aes1';

/**
 * Algorithm and parameters used for encryption metadata.
 */
const ALGORITHM = 'aes-256-gcm' as const;

/**
 * When decrypting data, this is used to validate the header.
 */
const ALLOWED_ALGORITHMS = ['aes-256-gcm'] as const;

/**
 * Maximum length of a section when decrypting.
 */
const MAX_SECTION_LEN = 10 * 1024 * 1024; // 10 MB

/**
 * Gets the encryption key as a Buffer.
 * @param salt The salt to use for key derivation.
 * @returns The encryption key buffer.
 */
const getEncryptionKeyBuffer = (salt: Buffer): Buffer => {
    // Use scrypt to derive a key from the encryption key string.
    return crypto.scryptSync(appEnv.encryptionKey, salt, 32);
};

/**
 * Get the version buffer.
 * @returns The version buffer.
 */
const getVersionBuffer = (): Buffer => {
    return Buffer.from(VERSION, 'utf-8');
};

/**
 * Convert a number to a buffer containing 1 u64.
 * @param num The number to convert.
 * @returns The buffer containing the u64.
 */
const numberToU64Buffer = (num: number): Buffer => {
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64LE(BigInt(num), 0);
    return buffer;
};

/**
 * Encrypts a buffer.
 * @param data The data to encrypt.
 */
const encryptBuffer = (data: Buffer): Buffer => {
    // Get the version buffer
    const versionBuffer = getVersionBuffer();

    // Define algorithm
    const algorithm = ALGORITHM;

    // Create the algorithm buffer
    const algorithmBuffer = Buffer.from(algorithm, 'utf-8');

    // Generate salt
    const salt = crypto.randomBytes(16);

    // Get key
    const key = getEncryptionKeyBuffer(salt);

    // Create the cipher
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    // Encrypt the data
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return Buffer.concat([
        numberToU64Buffer(versionBuffer.length),
        versionBuffer,
        numberToU64Buffer(algorithmBuffer.length),
        algorithmBuffer,
        numberToU64Buffer(salt.length),
        salt,
        numberToU64Buffer(iv.length),
        iv,
        numberToU64Buffer(authTag.length),
        authTag,
        numberToU64Buffer(encrypted.length),
        encrypted,
    ]);
};

/**
 * Decrypts a buffer.
 * @param encryptedData The data to decrypt.
 */
const decryptBuffer = (
    encryptedData: Uint8Array,
):
    | [true, Buffer]
    | [
          false,
          (
              | 'notEnoughData'
              | 'unknownVersion'
              | 'unsupportedAlgorithm'
              | 'decryptionFailed'
          ),
      ] => {
    let offset = 0;

    const canRead = (length: number): boolean => {
        return offset + length <= encryptedData.length;
    };

    const readU64 = (): bigint | null => {
        if (!canRead(8)) return null;
        const v = Buffer.from(
            encryptedData.slice(offset, offset + 8),
        ).readBigUInt64LE(0);
        offset += 8;
        return v;
    };

    const readBuffer = (length: number): Buffer | null => {
        if (!canRead(length)) return null;
        const buffer = Buffer.from(
            encryptedData.slice(offset, offset + length),
        );
        offset += length;
        return buffer;
    };

    const readSection = (): Buffer | null => {
        const len = readU64();
        if (len === null) return null;

        if (len > BigInt(MAX_SECTION_LEN)) return null;
        const n = Number(len);

        return readBuffer(n);
    };

    // Read version
    const versionBuffer = readSection();
    if (versionBuffer === null) return [false, 'notEnoughData'];
    if (versionBuffer.compare(getVersionBuffer()) !== 0)
        return [false, 'unknownVersion'];

    // Read algorithm
    const algorithmBuffer = readSection();
    if (algorithmBuffer === null) return [false, 'notEnoughData'];
    const algorithm = algorithmBuffer.toString(
        'utf-8',
    ) as (typeof ALLOWED_ALGORITHMS)[number];
    if (!ALLOWED_ALGORITHMS.includes(algorithm))
        return [false, 'unsupportedAlgorithm'];

    // Read salt
    const salt = readSection();
    if (salt === null) return [false, 'notEnoughData'];

    // Read iv
    const iv = readSection();
    if (iv === null) return [false, 'notEnoughData'];

    // Read auth tag
    const authTag = readSection();
    if (authTag === null) return [false, 'notEnoughData'];

    // Read encrypted data
    const encrypted = readSection();
    if (encrypted === null) return [false, 'notEnoughData'];

    // Get key
    const key = getEncryptionKeyBuffer(salt);

    // Decrypt the data
    try {
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([
            decipher.update(encrypted),
            decipher.final(),
        ]);
        return [true, decrypted];
    } catch {
        return [false, 'decryptionFailed'];
    }
};

/**
 * Encrypts a string to a base64 string.
 * @param data The data to encrypt.
 * @returns The encrypted base64 string.
 */
const encryptString = (data: string): string => {
    const buffer = Buffer.from(data, 'utf-8');
    const encryptedBuffer = encryptBuffer(buffer);
    return encryptedBuffer.toString('base64');
};

/**
 * Decrypts a base64 string.
 * @param encryptedData The data to decrypt.
 * @returns The decrypted string or an error.
 */
const decryptString = (
    encryptedData: string,
):
    | [true, string]
    | [
          false,
          (
              | 'notEnoughData'
              | 'unknownVersion'
              | 'unsupportedAlgorithm'
              | 'decryptionFailed'
          ),
      ] => {
    const encryptedBuffer = Buffer.from(encryptedData, 'base64');

    const [success, result] = decryptBuffer(encryptedBuffer);
    if (!success) {
        return [false, result];
    }

    return [true, result.toString('utf-8')];
};

export const encryptionUtilities = {
    decryptBuffer,
    decryptString,
    encryptBuffer,
    encryptString,
};
