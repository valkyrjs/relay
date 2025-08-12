import { ConflictError } from "@spec/relay/mod.ts";

export class AccountEmailClaimedError extends ConflictError {
  constructor(email: string) {
    super(`Email '${email}' is already claimed by another account.`);
  }
}
