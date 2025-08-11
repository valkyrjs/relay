import { z } from "zod";

export const PasskeyStrategySchema = z.object({
  type: z.literal("passkey").describe("Authentication strategy type for WebAuthn/Passkey"),
  payload: z
    .object({
      id: z.string().describe("Base64URL encoded credential ID"),
      rawId: z.string().describe("Raw credential ID as base64URL encoded string"),
      response: z
        .object({
          clientDataJSON: z.string().describe("Base64URL encoded client data JSON"),
          authenticatorData: z.string().describe("Base64URL encoded authenticator data"),
          signature: z.string().optional().describe("Signature for authentication responses"),
          userHandle: z.string().optional().describe("Optional user handle identifier"),
          attestationObject: z.string().optional().describe("Attestation object for registration responses"),
        })
        .describe("WebAuthn response data"),
      clientExtensionResults: z
        .record(z.string(), z.unknown())
        .default({})
        .describe("Results from WebAuthn extension inputs"),
      authenticatorAttachment: z
        .enum(["platform", "cross-platform"])
        .optional()
        .describe("Type of authenticator used (platform or cross-platform)"),
    })
    .describe("WebAuthn credential payload"),
});

export const EmailStrategySchema = z.object({
  type: z.literal("email").describe("Authentication strategy type for email"),
  payload: z
    .object({
      email: z.email().describe("User's email address for authentication"),
    })
    .describe("Email authentication payload"),
});

export const PasswordStrategySchema = z.object({
  type: z.literal("password").describe("Authentication strategy type for password"),
  payload: z
    .object({
      identifier: z.string().describe("User identifier (username or email)"),
      password: z.string().describe("User's password"),
    })
    .describe("Password authentication payload"),
});

export const StrategyPayloadSchema = z
  .union([PasskeyStrategySchema, EmailStrategySchema, PasswordStrategySchema])
  .describe("Union of all available authentication strategy schemas");
