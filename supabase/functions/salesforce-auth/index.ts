import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

export interface SalesforceToken {
  access_token: string;
  instance_url: string;
  token_type: string;
  issued_at: string;
  signature: string;
}

/**
 * Authenticates with Salesforce using OAuth 2.0 Resource Owner Password Credentials flow.
 *
 * NOTE: Salesforce is gradually deprecating this flow in favor of JWT Bearer Flow.
 * For now we keep Password flow as a placeholder; migrate to JWT once the Connected App
 * has the X.509 certificate configured.
 *
 * Required env vars:
 *  - SALESFORCE_CLIENT_ID
 *  - SALESFORCE_CLIENT_SECRET
 *  - SALESFORCE_USERNAME
 *  - SALESFORCE_PASSWORD (password + security token concatenated)
 *  - SALESFORCE_LOGIN_URL (defaults to https://login.salesforce.com)
 */
export async function getSalesforceToken(): Promise<SalesforceToken> {
  const clientId = Deno.env.get("SALESFORCE_CLIENT_ID");
  const clientSecret = Deno.env.get("SALESFORCE_CLIENT_SECRET");
  const username = Deno.env.get("SALESFORCE_USERNAME");
  const password = Deno.env.get("SALESFORCE_PASSWORD");
  const loginUrl = Deno.env.get("SALESFORCE_LOGIN_URL") ?? "https://login.salesforce.com";

  const missing: string[] = [];
  if (!clientId) missing.push("SALESFORCE_CLIENT_ID");
  if (!clientSecret) missing.push("SALESFORCE_CLIENT_SECRET");
  if (!username) missing.push("SALESFORCE_USERNAME");
  if (!password) missing.push("SALESFORCE_PASSWORD");

  if (missing.length > 0) {
    throw new Error(
      `Missing Salesforce credentials: ${missing.join(", ")}. ` +
        `Add them as Edge Function secrets in your Supabase project.`,
    );
  }

  const body = new URLSearchParams({
    grant_type: "password",
    client_id: clientId!,
    client_secret: clientSecret!,
    username: username!,
    password: password!,
  });

  let response: Response;
  try {
    response = await fetch(`${loginUrl}/services/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  } catch (err) {
    throw new Error(
      `Failed to reach Salesforce at ${loginUrl}: ${(err as Error).message}`,
    );
  }

  const text = await response.text();
  if (!response.ok) {
    let errMsg = text;
    try {
      const json = JSON.parse(text);
      errMsg = `${json.error}: ${json.error_description ?? "unknown error"}`;
    } catch {
      // text already set
    }
    throw new Error(`Salesforce auth failed (${response.status}): ${errMsg}`);
  }

  const token = JSON.parse(text) as SalesforceToken;
  if (!token.access_token || !token.instance_url) {
    throw new Error("Salesforce returned an invalid token payload");
  }
  return token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const token = await getSalesforceToken();
    return new Response(
      JSON.stringify({
        ok: true,
        instance_url: token.instance_url,
        token_type: token.token_type,
        issued_at: token.issued_at,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    const message = (err as Error).message;
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
