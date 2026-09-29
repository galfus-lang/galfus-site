import * as v from 'valibot';

// Helper for SurrealDB Record IDs (e.g. "account:u3x9...")
export const RecordIdSchema = v.string();

// --------------------------------------------------
// 1. AUTH & IDENTITY
// --------------------------------------------------

export const AccountSchema = v.object({
  id: RecordIdSchema,
  name: v.string(),
  displayName: v.string(),
  createdAt: v.pipe(v.string(), v.isoDateTime()),
  updatedAt: v.pipe(v.string(), v.isoDateTime()),
});
export type Account = v.InferOutput<typeof AccountSchema>;

export const AccountIdentitySchema = v.object({
  id: RecordIdSchema,
  provider: v.union([
    v.literal('email'),
    v.literal('username'),
    v.literal('cpf'),
    v.literal('google'),
    v.literal('github'),
  ]),
  identifier: v.string(),
  account: RecordIdSchema,
  metadata: v.record(v.string(), v.any()),
  createdAt: v.pipe(v.string(), v.isoDateTime()),
});
export type AccountIdentity = v.InferOutput<typeof AccountIdentitySchema>;

export const AccountKeySchema = v.object({
  id: RecordIdSchema,
  type: v.union([
    v.literal('password'),
    v.literal('mfa_totp'),
    v.literal('passkey'),
    v.literal('recovery_code'),
  ]),
  value: v.string(),
  account: RecordIdSchema,
  expiresAt: v.nullable(v.pipe(v.string(), v.isoDateTime())),
  createdAt: v.pipe(v.string(), v.isoDateTime()),
});
export type AccountKey = v.InferOutput<typeof AccountKeySchema>;

// --------------------------------------------------
// 2. ORGANIZATIONS & PROJECTS
// --------------------------------------------------

export const OrganizationSchema = v.object({
  id: RecordIdSchema,
  type: v.union([v.literal('personal'), v.literal('business')]),
  name: v.string(),
  slug: v.string(),
  createdAt: v.pipe(v.string(), v.isoDateTime()),
  updatedAt: v.pipe(v.string(), v.isoDateTime()),
});
export type Organization = v.InferOutput<typeof OrganizationSchema>;

// Edge Relation (Account -> Organization)
export const BelongsToSchema = v.object({
  id: RecordIdSchema,
  in: RecordIdSchema, // account ID
  out: RecordIdSchema, // organization ID
  role: v.union([v.literal('owner'), v.literal('admin'), v.literal('member')]),
  joinedAt: v.pipe(v.string(), v.isoDateTime()),
});
export type BelongsTo = v.InferOutput<typeof BelongsToSchema>;

export const ProjectSchema = v.object({
  id: RecordIdSchema,
  name: v.string(),
  slug: v.string(),
  organization: RecordIdSchema,
  config: v.record(v.string(), v.any()), // Nested JSON for dynamic settings
  createdAt: v.pipe(v.string(), v.isoDateTime()),
});
export type Project = v.InferOutput<typeof ProjectSchema>;
