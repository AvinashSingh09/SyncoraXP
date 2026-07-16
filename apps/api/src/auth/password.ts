import { randomBytes, scrypt as scryptCallback, timingSafeEqual, type ScryptOptions } from "node:crypto";
const KEY_LENGTH = 64;
const COST = 16_384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;

function scrypt(password: string, salt: Buffer, length: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, length, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, KEY_LENGTH, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELIZATION,
    maxmem: 64 * 1024 * 1024,
  });
  return ["scrypt", COST, BLOCK_SIZE, PARALLELIZATION, salt.toString("base64"), derived.toString("base64")].join("$");
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [algorithm, cost, blockSize, parallelization, saltValue, hashValue] = encoded.split("$");
  if (!algorithm || algorithm !== "scrypt" || !cost || !blockSize || !parallelization || !saltValue || !hashValue) {
    return false;
  }
  const expected = Buffer.from(hashValue, "base64");
  const actual = await scrypt(password, Buffer.from(saltValue, "base64"), expected.length, {
    N: Number(cost),
    r: Number(blockSize),
    p: Number(parallelization),
    maxmem: 64 * 1024 * 1024,
  });
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
