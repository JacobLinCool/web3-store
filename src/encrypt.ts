import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Hash password
 */
export function hash(password: string): string {
    const salt = process.env.ENCRYPTION_SALT || "";
    return createHash("sha256")
        .update(salt + password + salt)
        .digest("base64")
        .substring(0, 32);
}

/**
 * Encrypt data
 */
export function encrypt(buffer: Buffer, password: string): Buffer {
    const algo = process.env.ENCRYPTION_ALGO || "aes-256-ctr";
    const iv = randomBytes(16);
    const cipher = createCipheriv(algo, hash(password), iv);
    return Buffer.concat([iv, cipher.update(buffer), cipher.final()]);
}

/**
 * Decrypt data
 */
export function decrypt(buffer: Buffer, password: string): Buffer {
    const algo = process.env.ENCRYPTION_ALGO || "aes-256-ctr";
    const iv = buffer.slice(0, 16);
    const decipher = createDecipheriv(algo, hash(password), iv);
    return Buffer.concat([decipher.update(buffer.slice(16)), decipher.final()]);
}
