/** Client-side section parser (mirrors backend contentParse). */

export type ContentSection = { heading: string; content: string };

const SECTION_HINTS: Array<{ heading: string; pattern: RegExp }> = [
  { heading: 'Overview', pattern: /^(about\s+(the\s+)?(role|job|us|company)|overview|summary|description)\b/i },
  { heading: 'Responsibilities', pattern: /^(responsibilit|what\s+you.ll\s+do|key\s+duties|the\s+role)\b/i },
  { heading: 'Requirements', pattern: /^(requirements?|qualifications?|what\s+you.ll\s+need|must\s+have|skills?\s+required)\b/i },
  { heading: 'Nice to have', pattern: /^(nice\s+to\s+have|preferred|bonus|good\s+to\s+have)\b/i },
  { heading: 'Benefits', pattern: /^(benefits?|perks?|what\s+we\s+offer|compensation)\b/i },
  { heading: 'How to apply', pattern: /^(how\s+to\s+apply|application|to\s+apply|contact|reach\s+out)\b/i },
];

export function parseContentSections(description: string): ContentSection[] {
  const text = String(description || '').replace(/\r\n/g, '\n').trim();
  if (!text) return [];

  const lines = text.split('\n');
  const sections: ContentSection[] = [];
  let current: ContentSection = { heading: 'Full details', content: '' };

  const flush = () => {
    const c = current.content.trim();
    if (c) sections.push({ heading: current.heading, content: c });
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      current.content += '\n';
      continue;
    }

    const cleaned = line.replace(/^[\d]+[.)]\s*/, '').replace(/^[-•*]\s*/, '');
    const hint = SECTION_HINTS.find((h) => h.pattern.test(cleaned) || h.pattern.test(line));
    const looksLikeHeading =
      (line.length < 60 && /:$/.test(line)) ||
      (line === line.toUpperCase() && line.length > 3 && line.length < 48 && /[A-Z]/.test(line));

    if (hint || looksLikeHeading) {
      flush();
      current = {
        heading: hint?.heading || cleaned.replace(/:$/, '') || 'Details',
        content: '',
      };
      continue;
    }

    current.content += (current.content ? '\n' : '') + line;
  }
  flush();

  return sections.length ? sections : [{ heading: 'Full details', content: text }];
}

export function extractContacts(text = '') {
  const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const PHONE_RE = /(?:\+|00)?[0-9][0-9\s().-]{7,}[0-9]/g;
  const BLOCKED = /(noreply|no-reply|donotreply|example\.com)/i;
  const emails = [...new Set((text.match(EMAIL_RE) || []).filter((e) => !BLOCKED.test(e)))];
  const phones = [
    ...new Set(
      (text.match(PHONE_RE) || [])
        .map((p) => p.replace(/\s+/g, ' ').trim())
        .filter((p) => p.replace(/\D/g, '').length >= 10),
    ),
  ];
  return { email: emails[0] || null, phone: phones[0] || null };
}
