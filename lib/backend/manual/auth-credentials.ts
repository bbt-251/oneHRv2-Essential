import crypto from "node:crypto";

const SCRYPT_KEY_LENGTH = 64;

export const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .scryptSync(password, salt, SCRYPT_KEY_LENGTH)
    .toString("hex");
  return `${salt}:${hash}`;
};

export const verifyPassword = (
  password: string,
  storedHash: string,
): boolean => {
  const [salt, hash] = storedHash.split(":");

  if (!salt || !hash) {
    return false;
  }

  const calculated = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH);
  const expected = Buffer.from(hash, "hex");

  if (expected.length !== calculated.length) {
    return false;
  }

  return crypto.timingSafeEqual(calculated, expected);
};
