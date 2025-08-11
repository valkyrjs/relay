import * as bcrypt from "@felix/bcrypt";

export const password = { hash, verify };

async function hash(password: string): Promise<string> {
  return bcrypt.hash(password);
}

async function verify(password: string, hash: string): Promise<boolean> {
  return bcrypt.verify(password, hash);
}
