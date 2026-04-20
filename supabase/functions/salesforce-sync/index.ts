import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

interface SalesforceToken {
  access_token: string;
  instance_url: string;
  token_type: string;
  issued_at: string;
  signature: string;
}

async function getSalesforceToken(): Promise<SalesforceToken> {
  const clientId = Deno.env.get("SALESFORCE_CLIENT_ID");
  const clientSecret = Deno.env.get("SALESFORCE_CLIENT_SECRET");
  const loginUrl = Deno.env.get("SALESFORCE_LOGIN_URL") ?? "https://login.salesforce.com";

  const missing: string[] = [];
  if (!clientId) missing.push("SALESFORCE_CLIENT_ID");
  if (!clientSecret) missing.push("SALESFORCE_CLIENT_SECRET");
  if (missing.length > 0) {
    throw new Error(
      `Missing Salesforce credentials: ${missing.join(", ")}. Add them as Edge Function secrets.`,
    );
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId!,
    client_secret: clientSecret!,
  });

  const response = await fetch(`${loginUrl}/services/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const text = await response.text();
  if (!response.ok) {
    let errMsg = text;
    try {
      const json = JSON.parse(text);
      errMsg = `${json.error}: ${json.error_description ?? "unknown error"}`;
    } catch { /* keep text */ }
    throw new Error(`Salesforce auth failed (${response.status}): ${errMsg}`);
  }

  const token = JSON.parse(text) as SalesforceToken;
  if (!token.access_token || !token.instance_url) {
    throw new Error("Salesforce returned an invalid token payload");
  }
  return token;
}

type SyncType = "productivity" | "revenue" | "deadline" | "cancellations" | "test";
const ALL_TYPES: SyncType[] = ["productivity", "revenue", "deadline", "cancellations"];

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

interface SyncResult {
  sync_type: SyncType;
  status: "success" | "error";
  records_synced: number;
  error_message?: string;
}

async function logStart(syncType: SyncType): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("salesforce_sync_log")
    .insert({ sync_type: syncType, status: "started", records_synced: 0 })
    .select("id")
    .single();
  if (error) {
    console.error("Failed to insert sync log start:", error);
    return null;
  }
  return data.id;
}

async function logFinish(
  logId: string | null,
  status: "success" | "error",
  recordsSynced: number,
  errorMessage?: string,
) {
  if (!logId) return;
  await supabaseAdmin
    .from("salesforce_sync_log")
    .update({
      status,
      records_synced: recordsSynced,
      error_message: errorMessage ?? null,
      finished_at: new Date().toISOString(),
    })
    .eq("id", logId);
}

async function runSalesforceQuery(
  instanceUrl: string,
  accessToken: string,
  soql: string,
): Promise<{ totalSize: number; records: unknown[] }> {
  const url = `${instanceUrl}/services/data/v59.0/query/?q=${encodeURIComponent(soql)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Salesforce query failed (${res.status}): ${text}`);
  }
  return JSON.parse(text);
}

async function syncOne(syncType: SyncType): Promise<SyncResult> {
  const logId = await logStart(syncType);
  try {
    const token = await getSalesforceToken();

    // Generic placeholder query - swap per type below once SOQL mapping is ready.
    let soql = "SELECT Id, Name FROM Account LIMIT 1";

    switch (syncType) {
      case "productivity":
        // TODO: Substituir pela query SOQL real quando tivermos o mapeamento dos campos do Salesforce
        soql = "SELECT Id, Name FROM Account LIMIT 1";
        break;
      case "revenue":
        // TODO: Substituir pela query SOQL real quando tivermos o mapeamento dos campos do Salesforce
        soql = "SELECT Id, Name FROM Account LIMIT 1";
        break;
      case "deadline":
        // TODO: Substituir pela query SOQL real quando tivermos o mapeamento dos campos do Salesforce
        soql = "SELECT Id, Name FROM Account LIMIT 1";
        break;
      case "cancellations":
        // TODO: Substituir pela query SOQL real quando tivermos o mapeamento dos campos do Salesforce
        soql = "SELECT Id, Name FROM Account LIMIT 1";
        break;
      case "test":
        soql = "SELECT Id, Name FROM Account LIMIT 1";
        break;
    }

    const result = await runSalesforceQuery(token.instance_url, token.access_token, soql);

    // TODO: Mapear result.records para a tabela correspondente (campaign_*) e dar upsert por (headhunter_id, month, year).

    await logFinish(logId, "success", result.totalSize ?? 0);
    return { sync_type: syncType, status: "success", records_synced: result.totalSize ?? 0 };
  } catch (err) {
    const message = (err as Error).message;
    await logFinish(logId, "error", 0, message);
    return { sync_type: syncType, status: "error", records_synced: 0, error_message: message };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let syncTypeParam = url.searchParams.get("sync_type");
    if (!syncTypeParam && (req.method === "POST" || req.method === "PUT")) {
      try {
        const body = await req.json();
        syncTypeParam = body?.sync_type ?? null;
      } catch {
        // no body
      }
    }
    syncTypeParam = syncTypeParam ?? "test";

    const valid: SyncType[] = ["productivity", "revenue", "deadline", "cancellations", "test"];
    let toRun: SyncType[];
    if (syncTypeParam === "all") {
      toRun = ALL_TYPES;
    } else if (valid.includes(syncTypeParam as SyncType)) {
      toRun = [syncTypeParam as SyncType];
    } else {
      return new Response(
        JSON.stringify({
          ok: false,
          error: `Invalid sync_type. Use one of: productivity, revenue, deadline, cancellations, all, test`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const results: SyncResult[] = [];
    for (const t of toRun) {
      results.push(await syncOne(t));
    }

    const allOk = results.every((r) => r.status === "success");
    return new Response(
      JSON.stringify({ ok: allOk, results }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
