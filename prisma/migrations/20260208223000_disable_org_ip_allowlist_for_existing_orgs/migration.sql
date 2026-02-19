-- Disable organization IP allowlist for existing tenants.
-- This is idempotent and only modifies records where the flag is currently true.
UPDATE "hr"."organizations"
SET "settings" = jsonb_set(
    jsonb_set(
        COALESCE("settings", '{}'::jsonb),
        '{security}',
        COALESCE("settings"->'security', '{}'::jsonb),
        true
    ),
    '{security,ipAllowlistEnabled}',
    'false'::jsonb,
    true
)
WHERE COALESCE(("settings"->'security'->>'ipAllowlistEnabled')::boolean, false) = true;

