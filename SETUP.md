# QuantPrep — Launch Setup Guide

Follow these steps in order. Each section tells you exactly what to do in your browser,
and which value to paste into `.env.local` when you're done.

---

## Prerequisites

- Node.js 18+ installed on your Mac
- The project cloned/accessible locally on your Mac
- A browser open

---

## Step 1 — Supabase (Database + Auth)

**Time: ~10 minutes**

### 1a. Create a project

1. Go to **https://supabase.com** → click **Start your project** → sign up/log in
2. Click **New project**
3. Fill in:
   - **Name**: `quantprep` (or anything you like)
   - **Database Password**: generate a strong password and save it somewhere safe
   - **Region**: pick the closest to you (US East if unsure)
4. Click **Create new project** — wait ~1 minute for it to provision

### 1b. Run the database schema

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `supabase/schema.sql` from this project and **copy all its contents**
4. Paste into the SQL editor → click **Run** (green button, or Cmd+Enter)
5. You should see `Success. No rows returned` — that's correct

### 1c. Run the seed data

1. In SQL Editor, click **New query** again
2. Open `supabase/seed.sql` from this project and **copy all its contents**
3. Paste and run — this inserts the 14 topics and 12 companies

### 1d. Get your API keys

1. In the left sidebar, go to **Project Settings** (gear icon) → **API**
2. Copy the following into `.env.local`:

| `.env.local` variable | Where to find it in Supabase |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Project URL** (looks like `https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Project API keys → anon / public** |
| `SUPABASE_SERVICE_ROLE_KEY` | **Project API keys → service_role** (keep this secret) |

---

## Step 2 — Stripe (Payments)

**Time: ~10 minutes**

### 2a. Create an account

1. Go to **https://dashboard.stripe.com** → sign up / log in
2. Make sure **Test mode** is on — there's a toggle in the top-right that says "Test mode"

### 2b. Create the product and prices

1. In the left sidebar, click **Product catalog** → **Add product**
2. Fill in:
   - **Name**: `QuantPrep Pro`
   - **Description**: `Full access to answers, explanations, and company tags`
3. Under **Pricing**, you'll add 3 prices. Click **Add another price** for each:

   | Price | Amount | Billing period | Resulting env var |
   |---|---|---|---|
   | First price | $9.99 | Weekly | `STRIPE_PRICE_WEEK_ID` |
   | Second price | $24.99 | Monthly | `STRIPE_PRICE_MONTH_ID` |
   | Third price | $59.99 | Every 3 months | `STRIPE_PRICE_THREE_MONTH_ID` |

   For each price: set **Recurring**, choose the period, enter the amount.

4. Click **Save product**
5. Click on each price you just created → copy its **Price ID** (starts with `price_...`) into `.env.local`

### 2c. Get your secret key

1. Left sidebar → **Developers** → **API keys**
2. Copy **Secret key** (starts with `sk_test_...`) → paste as `STRIPE_SECRET_KEY` in `.env.local`

> **Webhook secret** — leave `STRIPE_WEBHOOK_SECRET` blank for now. You'll fill it in **after** you deploy to Vercel in Step 5.

---

## Step 3 — Anthropic API Key (AI Question Generation)

**Time: ~2 minutes**

1. Go to **https://console.anthropic.com** → log in (create account if needed)
2. Click **API Keys** in the left sidebar → **Create Key**
3. Name it `quantprep` → copy the key (starts with `sk-ant-...`)
4. Paste as `ANTHROPIC_API_KEY` in `.env.local`

> This is only used for the admin AI question generator. The app works without it — you can fill this in later.

---

## Step 4 — Run Locally

**Time: ~2 minutes**

In your terminal, from the project root:

```bash
npm run dev
```

Open **http://localhost:3000** in your browser. You should see the QuantPrep homepage.

### 4a. Sign up for an account

1. Click **Get started** → fill in your email and a password → submit
2. Check your email for a confirmation link from Supabase → click it
3. Sign back in at http://localhost:3000/login

### 4b. Make yourself an admin

1. In Supabase → **SQL Editor** → **New query**
2. Run this (replace with your actual email):

```sql
UPDATE public.profiles
SET is_admin = true
WHERE email = 'your@email.com';
```

3. Refresh the app → you should see an **Admin Panel** link in your user menu
4. Go to **http://localhost:3000/admin** to confirm it works

### 4c. Test a payment flow (optional but recommended)

1. Go to http://localhost:3000/pricing → click a plan
2. You'll be redirected to Stripe Checkout
3. Use Stripe's test card: **4242 4242 4242 4242**, any future expiry, any CVC
4. After payment, your account should show "Pro" in the dashboard

---

## Step 5 — Deploy to Vercel

**Time: ~10 minutes**

### 5a. Push to GitHub

If the repo isn't on GitHub yet:

```bash
# In the project root
git remote add github https://github.com/YOUR_USERNAME/quantprep.git
git push github main
```

### 5b. Import to Vercel

1. Go to **https://vercel.com/new** → log in with GitHub
2. Click **Import** next to your `quantprep` repository
3. Leave the framework as **Next.js** — Vercel auto-detects it
4. Before clicking **Deploy**, click **Environment Variables** and add every variable
   from your `.env.local` (except the `STRIPE_WEBHOOK_SECRET` — you'll add that next)

   > Change `NEXT_PUBLIC_APP_URL` to your Vercel production URL:
   > `https://your-project-name.vercel.app`

5. Click **Deploy** — takes ~2 minutes

### 5c. Set up the Stripe webhook

1. Open your deployed app URL to confirm it's live
2. Go to **Stripe Dashboard** → **Developers** → **Webhooks** → **Add endpoint**
3. Fill in:
   - **Endpoint URL**: `https://your-project-name.vercel.app/api/stripe/webhook`
   - **Events to listen for** — click **Select events** and add:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
4. Click **Add endpoint**
5. On the webhook page that appears, click **Reveal signing secret** → copy it
6. In Vercel → your project → **Settings** → **Environment Variables**
   → add `STRIPE_WEBHOOK_SECRET` with that value
7. Go to Vercel → **Deployments** → click the three dots on the latest → **Redeploy**

### 5d. Test the live site

1. Sign up on the live URL
2. Repeat the admin SQL in Supabase for your production email
3. Test a payment with the Stripe test card

---

## Step 6 — Import Your Question Files

> **Do this from your Mac**, not from the Linux environment, because your files are at:
> `/Users/yashpatel/Desktop/Resumes, Applications, Interview Tools`

Run this in your terminal from the project root on your Mac:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
npx tsx scripts/import-questions.ts \
  "/Users/yashpatel/Desktop/Resumes, Applications, Interview Tools"
```

The importer will:
- Parse `.txt`, `.md`, and `.json` files
- Extract company names and interview rounds from filenames automatically
- Insert all questions + answers into your Supabase database
- Print a summary of what was imported vs. skipped

After import, go to **http://localhost:3000/admin/questions** to review and edit
anything that needs adjusting.

---

## Checklist

- [ ] Supabase project created
- [ ] `schema.sql` run
- [ ] `seed.sql` run
- [ ] `.env.local` filled in (Supabase keys)
- [ ] Stripe product + 3 prices created
- [ ] `.env.local` filled in (Stripe keys)
- [ ] Anthropic key added
- [ ] `npm run dev` works locally
- [ ] Admin access confirmed at /admin
- [ ] Deployed to Vercel
- [ ] Stripe webhook configured
- [ ] Question files imported from Mac
