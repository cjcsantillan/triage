import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { fromIni } from "@aws-sdk/credential-providers";

// A single shared client — the SDK pools connections internally, so there's
// no benefit to creating a new one per request. Credentials resolve through
// the default provider chain (env vars, EC2/ECS role, etc.) unless a named
// local profile is set, in which case we resolve from ~/.aws explicitly.
export const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  ...(process.env.AWS_PROFILE
    ? { credentials: fromIni({ profile: process.env.AWS_PROFILE }) }
    : {}),
});

export const BEDROCK_MODEL_ID =
  process.env.BEDROCK_MODEL_ID ?? "anthropic.claude-3-haiku-20240307-v1:0";
