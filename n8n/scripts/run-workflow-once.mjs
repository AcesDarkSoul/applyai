/**
 * Login + run ApplyAI workflow against local n8n (HTTP + secure cookie workaround).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "data");
fs.mkdirSync(dataDir, { recursive: true });

const base = "http://localhost:5678";
const browserId = "applyai-agent";
const email = "admin@applyai.local";
const password = "ApplyAI2026!";
const workflowId =
  process.env.N8N_WORKFLOW_ID ||
  (fs.existsSync(path.join(dataDir, "_active-workflow-id.txt"))
    ? fs.readFileSync(path.join(dataDir, "_active-workflow-id.txt"), "utf8").trim()
    : "RjQYmbDlAX0GvED5");

async function main() {
  const loginRes = await fetch(`${base}/rest/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "browser-id": browserId,
    },
    body: JSON.stringify({ email, password }),
  });
  const setCookie = loginRes.headers.getSetCookie?.() || [];
  const rawCookie =
    setCookie.find((c) => c.startsWith("n8n-auth=")) ||
    loginRes.headers.get("set-cookie") ||
    "";
  const token = /n8n-auth=([^;]+)/.exec(rawCookie)?.[1];
  if (!token) {
    console.error("Login failed", loginRes.status, await loginRes.text());
    process.exit(1);
  }
  console.log("login ok");
  console.log("workflowId", workflowId);

  const headers = {
    Cookie: `n8n-auth=${token}`,
    "browser-id": browserId,
    "Content-Type": "application/json",
  };

  const wfRes = await fetch(`${base}/rest/workflows/${workflowId}`, { headers });
  const wfJson = await wfRes.json();
  if (wfJson.status === "error") {
    console.error("workflow fetch failed", wfJson);
    process.exit(1);
  }
  const data = wfJson.data;
  console.log("workflow", data.name, "nodes", data.nodes.length);
  const hasIngest = (data.nodes || []).some((n) => n.name === "POST ApplyAI Jobs Ingest");
  console.log("has API ingest node:", hasIngest);

  const runRes = await fetch(`${base}/rest/workflows/run`, {
    method: "POST",
    headers,
    body: JSON.stringify({ workflowData: data }),
  });
  const runText = await runRes.text();
  fs.writeFileSync(path.join(dataDir, "_run-response.json"), runText);
  console.log("run status", runRes.status);
  console.log(runText.slice(0, 500));

  // Poll executions (Apify can take several minutes)
  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const exRes = await fetch(
      `${base}/rest/executions?workflowId=${workflowId}&limit=1`,
      { headers }
    );
    const exJson = await exRes.json();
    const exec = exJson.data?.[0] || exJson.results?.[0] || exJson?.[0];
    if (!exec) {
      console.log(`poll ${i + 1}: no executions yet`);
      continue;
    }
    const id = exec.id;
    const status = exec.status || exec.finished;
    console.log(`poll ${i + 1}: id=${id} status=${status} finished=${exec.finished}`);
    if (exec.finished || ["success", "error", "crashed", "canceled"].includes(status)) {
      const detailRes = await fetch(`${base}/rest/executions/${id}`, { headers });
      const detail = await detailRes.json();
      fs.writeFileSync(
        path.join(dataDir, "_last-execution.json"),
        JSON.stringify(detail, null, 2)
      );
      console.log("saved data/_last-execution.json");
      const runData = detail.data?.data?.resultData?.runData || {};
      for (const [nodeName, runs] of Object.entries(runData)) {
        const last = runs?.[runs.length - 1];
        const err = last?.error?.message;
        const items = last?.data?.main?.[0]?.length ?? 0;
        console.log(`node: ${nodeName} items=${items}${err ? ` ERROR=${err}` : ""}`);
      }
      return;
    }
  }
  console.log("timed out waiting for execution");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
