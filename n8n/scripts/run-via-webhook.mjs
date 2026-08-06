/**
 * Activate workflow + fire webhook (n8n 1.82 has no /rest/workflows/run).
 * Then poll executions and print ingest node result.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "data");
const base = "http://localhost:5678";
const browserId = "applyai-agent";
const email = "admin@applyai.local";
const password = "ApplyAI2026!";
const workflowId =
  process.env.N8N_WORKFLOW_ID ||
  (fs.existsSync(path.join(dataDir, "_active-workflow-id.txt"))
    ? fs.readFileSync(path.join(dataDir, "_active-workflow-id.txt"), "utf8").trim()
    : "RjQYmbDlAX0GvED5");

async function login() {
  const loginRes = await fetch(`${base}/rest/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "browser-id": browserId },
    body: JSON.stringify({ email, password }),
  });
  const setCookie = loginRes.headers.getSetCookie?.() || [];
  const rawCookie =
    setCookie.find((c) => c.startsWith("n8n-auth=")) ||
    loginRes.headers.get("set-cookie") ||
    "";
  const token = /n8n-auth=([^;]+)/.exec(rawCookie)?.[1];
  if (!token) throw new Error(`login failed ${loginRes.status}`);
  return {
    Cookie: `n8n-auth=${token}`,
    "browser-id": browserId,
    "Content-Type": "application/json",
  };
}

async function main() {
  const headers = await login();
  console.log("login ok", workflowId);

  const getRes = await fetch(`${base}/rest/workflows/${workflowId}`, { headers });
  const wf = (await getRes.json()).data;
  if (!wf?.nodes) throw new Error("workflow missing");
  console.log("nodes", wf.nodes.length, "active", wf.active);

  if (!wf.active) {
    const patch = await fetch(`${base}/rest/workflows/${workflowId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        name: wf.name,
        nodes: wf.nodes,
        connections: wf.connections,
        settings: wf.settings,
        staticData: wf.staticData,
        active: true,
      }),
    });
    const pj = await patch.json();
    console.log("activate", patch.status, pj.data?.active ?? pj.message ?? pj);
  }

  // Webhook (production path when active)
  const whUrl = `${base}/webhook/applyai-job-outreach`;
  console.log("POST", whUrl);
  const whStart = Date.now();
  const whPromise = fetch(whUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "Full Stack Developer", location: "India" }),
  }).then(async (r) => ({
    status: r.status,
    text: await r.text(),
    ms: Date.now() - whStart,
  }));

  // Also try test webhook path
  const testUrl = `${base}/webhook-test/applyai-job-outreach`;

  let finished = false;
  for (let i = 0; i < 100; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const exRes = await fetch(
      `${base}/rest/executions?workflowId=${workflowId}&limit=3`,
      { headers },
    );
    const exJson = await exRes.json();
    const list = exJson.data || exJson.results || [];
    const exec = list[0];
    if (!exec) {
      console.log(`poll ${i + 1}: no executions`);
      continue;
    }
    console.log(
      `poll ${i + 1}: id=${exec.id} status=${exec.status} finished=${exec.finished}`,
    );
    if (exec.finished || ["success", "error", "crashed", "canceled"].includes(exec.status)) {
      const detail = await fetch(`${base}/rest/executions/${exec.id}?includeData=true`, {
        headers,
      });
      const d = await detail.json();
      fs.writeFileSync(
        path.join(dataDir, "_last-execution.json"),
        JSON.stringify(d, null, 2),
      );
      const runData = d.data?.data?.resultData?.runData || {};
      const ingest = runData["POST ApplyAI Jobs Ingest"];
      const prepare = runData["Prepare API Ingest"];
      console.log(
        "Prepare count:",
        prepare?.[0]?.data?.main?.[0]?.[0]?.json?.count,
      );
      console.log(
        "Ingest response:",
        JSON.stringify(ingest?.[0]?.data?.main?.[0]?.[0]?.json || ingest?.[0]?.error || null).slice(
          0,
          800,
        ),
      );
      finished = true;
      break;
    }
  }

  try {
    const wh = await Promise.race([
      whPromise,
      new Promise((r) => setTimeout(() => r({ status: 0, text: "timeout waiting webhook body", ms: -1 }), 10_000)),
    ]);
    console.log("webhook response", wh);
  } catch (e) {
    console.log("webhook err", e.message);
  }

  // Check API catalog
  const cat = await fetch("http://localhost:4000/api/v1/jobs/catalog", {
    headers: { Authorization: "Bearer demo-user-sagar" },
  }).then((r) => r.json());
  console.log("API catalog", cat.data);

  if (!finished) {
    console.log("NOTE: execution still running or webhook inactive — check n8n UI Manual Test");
    // try test webhook once
    try {
      const t = await fetch(testUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      console.log("test webhook", t.status, (await t.text()).slice(0, 200));
    } catch (e) {
      console.log("test webhook err", e.message);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
