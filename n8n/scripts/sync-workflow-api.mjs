/**
 * Re-import ApplyAI workflow (overwrite newest matching name) and print id.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = "http://localhost:5678";
const browserId = "applyai-agent";
const email = "admin@applyai.local";
const password = "ApplyAI2026!";
const workflowPath = path.join(root, "workflows", "job-outreach-auto-apply.json");

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
  if (!token) throw new Error(`login failed ${loginRes.status} ${await loginRes.text()}`);
  return {
    Cookie: `n8n-auth=${token}`,
    "browser-id": browserId,
    "Content-Type": "application/json",
  };
}

async function main() {
  const headers = await login();
  const listRes = await fetch(`${base}/rest/workflows?limit=50`, { headers });
  const listJson = await listRes.json();
  const workflows = listJson.data || listJson;
  const matches = (Array.isArray(workflows) ? workflows : []).filter((w) =>
    String(w.name || "").includes("Job Discovery")
  );
  console.log(
    "existing:",
    matches.map((w) => ({ id: w.id, name: w.name, updatedAt: w.updatedAt }))
  );

  const file = JSON.parse(fs.readFileSync(workflowPath, "utf8"));
  // Prefer updating the newest match; else create
  matches.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  const target = matches[0];

  if (target) {
    const getRes = await fetch(`${base}/rest/workflows/${target.id}`, { headers });
    const current = (await getRes.json()).data;
    const payload = {
      name: file.name,
      nodes: file.nodes,
      connections: file.connections,
      settings: current.settings || file.settings || {},
      staticData: current.staticData ?? null,
    };
    const putRes = await fetch(`${base}/rest/workflows/${target.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    });
    const putJson = await putRes.json();
    if (!putRes.ok) {
      console.error("PATCH failed", putRes.status, putJson);
      process.exit(1);
    }
    console.log("updated workflow", target.id);
    fs.writeFileSync(path.join(root, "data", "_active-workflow-id.txt"), target.id);
  } else {
    const createRes = await fetch(`${base}/rest/workflows`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: file.name,
        nodes: file.nodes,
        connections: file.connections,
        settings: file.settings || {},
      }),
    });
    const created = await createRes.json();
    if (!createRes.ok) {
      console.error("CREATE failed", createRes.status, created);
      process.exit(1);
    }
    const id = created.data?.id || created.id;
    console.log("created workflow", id);
    fs.writeFileSync(path.join(root, "data", "_active-workflow-id.txt"), id);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
