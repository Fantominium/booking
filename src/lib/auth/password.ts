import bcrypt from "bcryptjs";

export const hashPassword = async (plainText: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plainText, salt);
};

export const verifyPassword = async (plainText: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(plainText, hash);
};
