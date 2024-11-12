// src/shared/utils/utils.ts
import * as crypto from "crypto";

export const generateStrongPassword = (): string => {
  return crypto.randomBytes(12).toString("hex");
};

export const generateToken = (): string => {
  return crypto.randomBytes(16).toString("hex");
};
