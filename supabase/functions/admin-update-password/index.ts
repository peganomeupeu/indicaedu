import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const { user_id, email, password, confirm_email } = await req.json();
  
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const updates: any = {};
  if (email) updates.email = email;
  if (password) updates.password = password;
  if (confirm_email) updates.email_confirm = true;

  const { data, error } = await supabase.auth.admin.updateUserById(user_id, updates);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  return new Response(JSON.stringify({ success: true, user: data.user }));
});
