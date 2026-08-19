# StudentHub

A full-stack student collaboration marketplace/community built with React + Vite, Express/Vercel Functions, Prisma, and PostgreSQL.

## Core features

- Email/password signup and login
- Forgot password + reset-password flow
- Protected dashboard
- Student profile
- Resource/book exchange listings
- Collaboration/team-mate discovery
- Job/opportunity board
- Search and category filters
- Create, edit, delete and browse listings
- Create collaboration posts
- Create job posts
- PostgreSQL persistence through Prisma
- JWT authentication in an HTTP-only cookie
- Responsive modern UI
- Vercel-ready deployment structure

## Stack

Frontend:
- React
- Vite
- React Router
- Lucide React

Backend:
- Express 5
- Vercel serverless adapter
- Prisma ORM
- PostgreSQL
- JWT
- bcryptjs
- Zod

## Local setup

1. Install Node.js 20+.
2. Create a PostgreSQL database, for example with Neon or Supabase.
3. Copy `.env.example` to `.env`.
4. Fill in:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `APP_URL`
   - optionally `RESEND_API_KEY` and `RESEND_FROM`
5. Install packages:

   `npm install`

6. Generate Prisma client and create the database:

   `npx prisma generate`

   `npx prisma migrate dev --name init`

7. Start the app:

   `npm run dev`

Frontend: http://localhost:5173
API: http://localhost:3000

## Vercel deployment

This repository is designed so the React app is built by Vite and `/api/*` is routed to the Express serverless function.

1. Push this folder to GitHub.
2. Import the repository into Vercel.
3. Add the environment variables from `.env.example`.
4. Use:
   - Build command: `npm run build`
   - Output directory: `frontend/dist`
5. For production database changes, run:

   `npx prisma migrate deploy`

You can run this locally against the production database or through your CI/CD pipeline.

## Password reset email

The API creates a secure, expiring reset token. If Resend variables are configured, it sends an email. If they are not configured in development, the API logs a reset URL so you can test the flow.

## Important production notes

Before a public launch, add:
- CAPTCHA/rate limiting on auth and password reset endpoints
- Email verification
- Moderation/reporting
- Object storage for listing images
- Content scanning
- Stronger audit logging
- CSRF protection if you change the cookie strategy
- A proper transactional email provider
- Database backups and monitoring
