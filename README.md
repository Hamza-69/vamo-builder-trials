# Vamo

AI-powered project builder with a gamified pineapple 🍍 rewards system and a marketplace for listing and selling projects.

Built with **Next.js 14**, **Supabase** (auth, database, storage), **OpenAI**, and **Tailwind CSS v4**.

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** (comes with Node)
- A **Supabase** project ([supabase.com](https://supabase.com))
- An **OpenAI** API key ([platform.openai.com](https://platform.openai.com))

### 1. Clone the Repository

```bash
git clone https://github.com/Hamza-69/vamo-builder-trials
cd vamo
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example file and fill in the values:

```bash
cp .env.local.example .env.local
```

Open `.env.local` and set:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Your app URL (`http://localhost:3000` for local dev) |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your Supabase **anon / publishable** key |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `CSRF_SECRET` | A random 64-character hex string (e.g. `openssl rand -hex 32`) |

> [!IMPORTANT]
> **No service role key or secret key is required.** The app uses only the Supabase publishable (anon) key and relies entirely on Row Level Security (RLS) for data access control. See the [Security](#no-service-role-key) section below.

### 4. Run the Dev Server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Supabase Setup

### Run Migrations

All database migrations live in `supabase/migrations/`. Apply them using the Supabase CLI:

```bash
# Login
npx supabase login
# Link to your remote project
npx supabase link # Choose Your project

# Push all migrations
npx supabase db push
```

This will create all tables (`profiles`, `projects`, `messages`, `listings`, `offers`, `reward_ledger`, `redemptions`, etc.), RLS policies, RPC functions, and triggers.

### Enable Row Level Security (RLS)

RLS is enabled automatically by the migrations for every table. You can verify this in the Supabase Dashboard:

1. Go to **Table Editor** → select any table
2. Click **RLS Policies** — you should see policies already defined

If for any reason RLS is not enabled on a table, you can enable it manually:

```sql
ALTER TABLE your_table_name ENABLE ROW LEVEL SECURITY;
```

### Create the `handle_new_user` Trigger

This trigger is applied automatically by the `20260212191529_functions.sql` migration. It inserts a row into `profiles` whenever a new user signs up via Supabase Auth.

If you need to create it manually:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Setting Yourself as Admin

Admin status is controlled by the `is_admin` column on the `profiles` table. To make yourself an admin:

1. Open the **Supabase Dashboard** → **Table Editor** → **profiles**
2. Find your row (match by email)
3. Set `is_admin` to `true`
4. Click **Save**

Alternatively, run this SQL in the **SQL Editor**:

```sql
UPDATE profiles
SET is_admin = true
WHERE email = 'your-email@example.com';
```

> [!NOTE]
> The `is_admin` column is protected by a database trigger (`protect_profile_fields_trigger`) that prevents regular users from modifying it via the API. It can only be changed directly in the database or via the dashboard.

---

## No Service Role Key

**The codebase does not use a Supabase service role key anywhere.**

- The `.env.local.example` contains only `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and non-Supabase secrets.
- All API routes use the **authenticated client** (backed by the user's session cookie), not a service client.
- Data access is enforced entirely through **RLS policies** defined in the migrations.
- The only references to `service_role` in the codebase are standard PostgreSQL `GRANT` statements inside SQL migrations, which grant the built-in `service_role` database role execute permission on RPC functions — this is default Supabase behavior and does not require or expose a service role key.

---

## Known Limitations

- **No email provider configured by default** — Supabase's built-in email (rate-limited to ~4 emails/hour) is used for auth. For production, configure a custom SMTP provider in the Supabase Dashboard under **Auth → Email**. (In the vercel production I am using a custom email provider)
- **OpenAI dependency** — The AI chat and reward features require a valid OpenAI API key with sufficient quota.
- **Single admin model** — Admin privileges are granted manually via the database. There is no admin management UI.
- **No automated tests** — The project does not currently include a test suite.
- **Local Supabase not pre-configured** — The `supabase/config.toml` is present but the project is designed to run against a hosted Supabase instance. Running `supabase start` locally may require additional configuration.
- **Image storage** — Project and listing images are stored in Supabase Storage buckets (`avatars`, `projects`, `listings`). These buckets and their policies are created by the migrations, but file size limits and allowed MIME types may need tuning for production use.
---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
