# OAuth Setup Guide for OrgCentral

## Issue Diagnosis

OAuth login buttons are visible but not functional because the OAuth provider credentials are not configured.

## Current Status

- ✅ Better Auth configured with OAuth providers
- ✅ API routes set up (`/api/auth/[...all]`)
- ✅ UI components implemented with OAuth buttons
- ❌ Environment variables missing (providers disabled)

## Setup Instructions

### 1. Google OAuth Setup

#### Create OAuth Application
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select an existing one
3. Navigate to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
4. Configure OAuth consent screen if not already done
5. Application type: "Web application"
6. Authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`

#### Add Credentials to `.env.local`
```env
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 2. Microsoft OAuth Setup

#### Create Azure AD Application
1. Go to [Azure Portal](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Click "New registration"
3. Name: "OrgCentral"
4. Supported account types: Choose based on your needs
   - Single tenant (organization only)
   - Multi-tenant (any Azure AD)
   - Multi-tenant + personal Microsoft accounts
5. Redirect URI: "Web" → `http://localhost:3000/api/auth/callback/microsoft`

#### Configure Application
1. Go to "Certificates & secrets"
2. Create a new client secret
3. Copy the secret value (shown only once!)
4. Go to "Overview" and copy:
   - Application (client) ID
   - Directory (tenant) ID

#### Add Credentials to `.env.local`
```env
MICROSOFT_CLIENT_ID="your-application-client-id"
MICROSOFT_CLIENT_SECRET="your-client-secret-value"
MICROSOFT_TENANT_ID="your-tenant-id-or-common"
```

**Tenant ID Options:**
- `common` - Allow any Microsoft account (personal + work)
- `organizations` - Only work/school accounts
- `consumers` - Only personal Microsoft accounts
- `{tenant-id}` - Specific organization only

### 3. Update Redirect URIs for Production

When deploying to production, add production callback URLs:

**Google:**
- `https://yourdomain.com/api/auth/callback/google`

**Microsoft:**
- `https://yourdomain.com/api/auth/callback/microsoft`

### 4. Restart Development Server

After adding environment variables:
```bash
pnpm run dev
```

## Testing OAuth

1. Navigate to `/login`
2. Click "Google" or "Microsoft" button
3. You should be redirected to the provider's login page
4. After successful authentication, redirected back to `/dashboard`

## Troubleshooting

### OAuth buttons don't do anything
- Check browser console for errors
- Verify environment variables are set in `.env.local`
- Restart dev server after adding variables

### "Redirect URI mismatch" error
- Ensure callback URLs in provider console exactly match:
  - Development: `http://localhost:3000/api/auth/callback/{provider}`
  - Production: `https://yourdomain.com/api/auth/callback/{provider}`
- Check for trailing slashes
- Verify protocol (http vs https)

### "Invalid client" error
- Double-check `CLIENT_ID` and `CLIENT_SECRET`
- Ensure no extra spaces or quotes
- Verify credentials are for the correct environment

### Provider login succeeds but user not created
- Check database connection
- Verify Prisma schema includes Better Auth tables
- Run `pnpm db:migrate` if needed
- Check server logs for errors

## Security Notes

1. **Never commit OAuth credentials** to version control
2. `.env.local` is already in `.gitignore`
3. Use different credentials for development and production
4. Rotate secrets regularly
5. Enable MFA on Google/Microsoft admin accounts
6. Monitor OAuth usage in provider dashboards

## Better Auth Configuration

Current configuration in `src/server/lib/auth.ts`:

```typescript
socialProviders: {
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID ?? '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        enabled: Boolean(process.env.GOOGLE_CLIENT_ID),
    },
    microsoft: {
        clientId: process.env.MICROSOFT_CLIENT_ID ?? '',
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET ?? '',
        tenantId: process.env.MICROSOFT_TENANT_ID ?? 'common',
        enabled: Boolean(process.env.MICROSOFT_CLIENT_ID),
    },
}
```

Providers are automatically enabled when credentials are present.

## Additional Features

### Two-Factor Authentication
Already configured! After OAuth login, users can enable 2FA in their profile settings.

### Organization Access Control
OAuth users are subject to organization-based access control:
- Only `.gov.uk` emails can create organizations (configurable)
- Role-based permissions resolved from DB-driven roles and ABAC policies (role-template fallback during migration)
- Multi-tenant isolation

## Next Steps

1. Set up OAuth credentials in Google/Microsoft consoles
2. Add environment variables to `.env.local`
3. Restart dev server
4. Test OAuth login
5. Configure organization creation rules if needed
6. Set up production OAuth apps when deploying
