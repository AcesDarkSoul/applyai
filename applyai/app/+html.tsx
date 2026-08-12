import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="theme-color" content="#0b0c18" />
        <meta name="description" content="ApplyAI - Smart job applications on LinkedIn, Indeed & Naukri" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const globalStyles = `
  * { box-sizing: border-box; }
  html, body, #root {
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
    background-color: #0b0c18;
    color: #eef0ff;
    font-family: "Plus Jakarta Sans", system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  input, textarea, button {
    font-family: inherit;
  }
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: #15172a; }
  ::-webkit-scrollbar-thumb { background: rgba(91,92,226,0.35); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(91,92,226,0.5); }
  @media (min-width: 1024px) {
    body { display: flex; justify-content: center; }
  }
`;
