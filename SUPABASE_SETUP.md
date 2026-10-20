# Supabase setup

1. Create a Supabase project and open **SQL Editor**.
2. Run [`supabase/schema.sql`](supabase/schema.sql). Row-level security restricts each save to its authenticated owner.
3. In **Authentication → Providers**, enable Email. Set the site URL and allowed redirect URL to the address used to open the game, for example `http://localhost:4173`.
4. Copy the project URL and the browser-safe **Publishable key** (or legacy anon key) into [`supabase-config.js`](supabase-config.js):

```js
window.ZFC_SUPABASE_CONFIG = {
  url: 'https://YOUR_PROJECT_REF.supabase.co',
  anonKey: 'YOUR_PUBLISHABLE_OR_ANON_KEY'
};
```

Never put a `service_role` key in this browser project. The browser uses Supabase Auth and the RLS policies; the service-role key bypasses those policies and must remain server-side.

Email confirmation can be enabled in Supabase Auth. With confirmation enabled, a new player must confirm the email and sign in before creating a cloud-linked empire. Until a real URL and key are configured, the game continues with a local guest save.
