# All-See-Guard Deployment Guide

## Pre-Deployment Checklist

This guide outlines the steps required to deploy the All-See-Guard unified cyber security framework.

### Security Architecture

The system implements multi-layered security:

1. **Frontend Security**
   - Input validation and sanitization
   - Rate limiting for login attempts
   - Password strength enforcement
   - XSS and SQL injection prevention

2. **Authentication & Authorization**
   - Supabase Auth with JWT tokens
   - Session management with auto-logout on inactivity (2 hours)
   - Token refresh before expiry
   - Audit logging for all auth events

3. **Database Security**
   - Row-Level Security (RLS) on all tables
   - Audit triggers on sensitive tables
   - Security logs table for compliance
   - Encrypted connections only

4. **API Validation**
   - Server-side validation of all inputs
   - Supabase Edge Functions for validation
   - Real-time audit logging
   - Format and business rule validation

5. **Intrusion Detection**
   - Pattern-based threat detection
   - Automatic IP blocking for critical threats
   - Real-time threat monitoring
   - Security event logging

## Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account and project
- Git for version control
- PostgreSQL compatible database (via Supabase)

## Installation Steps

### 1. Clone Repository

```bash
git clone https://github.com/comradedemafia/all-see-guard.git
cd all-see-guard
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Configuration

Create a `.env.local` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
# or
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> If verification emails do not arrive, verify your Supabase Authentication email settings and make sure your app origin is allowed as a redirect URL. In local development, real email delivery may require SMTP configuration or Supabase CLI email logs.

### 4. Database Setup

#### Apply Migrations

```bash
# Initialize Supabase locally (optional)
supabase start

# Link to Supabase project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

The migrations will:
- Create all required tables (security_incidents, firewall_logs, threat_alerts, blocked_ips, security_logs)
- Set up Row-Level Security policies
- Create audit triggers
- Create security functions for querying audit logs

#### Verify Tables

Connect to Supabase and verify these tables exist:
- `auth.users` - Supabase Auth users
- `public.profiles` - User profiles
- `public.security_incidents` - Detected security incidents
- `public.firewall_logs` - Firewall activity
- `public.threat_alerts` - Threat detection alerts
- `public.blocked_ips` - IP blocklist
- `public.security_logs` - Audit trail (comprehensive)

### 5. Deploy Supabase Functions

```bash
# Deploy validation function
supabase functions deploy validate-data

# Deploy alert function
supabase functions deploy send-critical-alert
```

Functions handle:
- `validate-data`: Server-side validation of all inputs
- `send-critical-alert`: Admin notification for critical events

### 6. Build Frontend

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### 7. Security Configuration

#### Content Security Policy (CSP)

The CSP header is configured in `index.html`:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.supabase.com; frame-ancestors 'none';">
```

#### HTTPS

Ensure your deployment uses HTTPS only. The system will warn if deployed over HTTP.

#### Session Management

- Auto-logout after 2 hours of inactivity
- Session validation every 5 minutes
- Automatic token refresh before expiry

### 8. Testing

#### Run Tests

```bash
npm run test
npm run test:watch  # For development
```

#### Manual Testing Checklist

1. **Authentication**
   - Sign up with valid email and strong password
   - Verify email received and account activated
   - Sign in with correct credentials
   - Attempt login with wrong password (rate limit after 5 attempts)
   - Suggest password on weak password

2. **Dashboard**
   - View security statistics
   - Check system health status
   - Send test alerts
   - Verify automated incident response

3. **SIEM**
   - View firewall logs
   - Check threat alerts
   - See blocked IPs
   - Access intrusion detection module

4. **Security Monitoring**
   - Verify SecurityMonitor shows HTTPS, CSP, Auth status
   - Check real-time threat detection
   - Review audit logs

## Deployment Platforms

### Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod

# Or connect GitHub for automatic deployments
```

### Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

Build and run:

```bash
docker build -t all-see-guard .
docker run -p 3000:3000 \
  -e VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
  -e VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
  all-see-guard
```

### Traditional Server (Node.js + Nginx)

```bash
# Build
npm run build

# Copy dist/ to server
# Configure Nginx as reverse proxy

# Start server
npm run preview
```

## Post-Deployment

### 1. Verify Deployment

- Check HTTPS certificate is valid
- Verify CSP headers are present
- Test authentication workflow
- Check database connectivity

### 2. Monitor Security

- Review audit logs regularly
- Check for suspicious authentication patterns
- Monitor threat alerts
- Review auto-blocked IPs

### 3. Backup Strategy

```bash
# Backup Supabase database
supabase db pull

# Store backups securely
```

### 4. Update Plan

- Keep dependencies updated
- Monitor security advisories
- Review audit logs for trends
- Update threat detection patterns

## Troubleshooting

### Database Connection Issues

```bash
# Verify connection
supabase status

# Check migrations applied
supabase db ls --linked
```

### Function Deployment Issues

```bash
# Check function logs
supabase functions logs validate-data

# Redeploy specific function
supabase functions deploy validate-data
```

### Authentication Issues

- Clear browser cookies/localStorage
- Check Supabase Auth configuration
- Verify email is confirmed
- Check RLS policies on profiles table

### Performance Issues

- Check React Query cache configuration
- Optimize realtime subscriptions
- Review database indexes
- Monitor Supabase usage metrics

## Security Best Practices

1. **Never commit secrets**
   - Use `.env.local` (not in git)
   - Use Supabase environment variables
   - Rotate keys regularly

2. **Regular Updates**
   - Keep dependencies current
   - Monitor CVE advisories
   - Update security patches

3. **Audit Logs**
   - Review security_logs table regularly
   - Set up alerts for critical events
   - Archive logs for compliance

4. **Database Backup**
   - Implement automated backups
   - Test restore procedures
   - Store backups securely

5. **Access Control**
   - Use strong passwords
   - Enable 2FA on Supabase account
   - Limit service key exposure
   - Regular access reviews

## Compliance

### GDPR Compliance

- User can request data export (implement data access endpoint)
- User can request deletion (cascading deletes configured)
- Privacy policy clearly states data handling
- Consent tracking for cookies/analytics

### Security Standards

- Implements OWASP Top 10 protections
- CSP header configured
- HTTPS enforced
- Input validation on client and server
- Audit logging for compliance

## Support & Documentation

- **Issues**: GitHub Issues
- **Documentation**: See README.md
- **Security**: Report to security contacts
- **Community**: Ruaha Catholic University ICT Faculty

## Version Control

Current version: 1.0.0
Last updated: April 14, 2026

---

**Ready to deploy!** Follow the Pre-Deployment Checklist above and ensure all security configurations are in place before going live.