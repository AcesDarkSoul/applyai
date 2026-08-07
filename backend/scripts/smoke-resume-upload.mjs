import fs from 'fs';

async function upload(token, filePath, fileName) {
  const sample = fs.readFileSync(filePath);
  const boundary = `----Boundary${Date.now()}`;
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="resume"; filename="${fileName}"\r\nContent-Type: application/octet-stream\r\n\r\n`,
    ),
    sample,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const res = await fetch('http://localhost:4000/api/v1/me/resume', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body,
  });
  const j = await res.json();
  console.log(
    JSON.stringify(
      {
        token,
        status: res.status,
        ok: j.success,
        name: j.data?.parsed?.name,
        error: j.error,
        resumeId: j.data?.resume?.id,
      },
      null,
      2,
    ),
  );
}

await upload(
  'demo-user-sagar',
  new URL('./sample-resume.txt', import.meta.url),
  'sample-resume.txt',
);
