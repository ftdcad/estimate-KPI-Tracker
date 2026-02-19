/**
 * CRM Parser — extracts structured fields from ClaimWizard Ctrl+A copy-paste data.
 *
 * ClaimWizard outputs data in a mix of formats:
 *   - "Label\nValue" (field label on one line, value on next)
 *   - "Label: Value" (colon-separated on same line)
 *   - "Label\nValue\nCity, ST ZIP" (multi-line addresses)
 *
 * This parser uses regex to extract as many fields as possible.
 * All fields are optional — partial parses are fine.
 */

export interface ParsedCrmData {
  file_number: string | null;
  client_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  loss_state: string | null;
  loss_date: string | null;
  peril: string | null;
  carrier: string | null;
  claim_number: string | null;
  policy_number: string | null;
  property_type: string | null;
  severity: number | null;
  contractor_company: string | null;
  contractor_rep: string | null;
  contractor_rep_email: string | null;
  referral_source: string | null;
  description_of_loss: string | null;
  estimate_value: number | null;
}

// ── Helpers ──────────────────────────────────────────────────────

/** Try multiple regex patterns, return first match group 1 */
function firstMatch(text: string, patterns: RegExp[]): string | null {
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return null;
}

/** Extract US state abbreviation from an address string */
function extractState(text: string): string | null {
  const stateMatch = text.match(/\b([A-Z]{2})\s+\d{5}/);
  return stateMatch?.[1] || null;
}

/** Map severity text to 1-5 number */
function parseSeverity(text: string | null): number | null {
  if (!text) return null;
  const lower = text.toLowerCase().trim();
  if (lower.includes('light') || lower === '1') return 1;
  if (lower.includes('moderate') || lower === '2') return 2;
  if (lower.includes('medium') || lower === '3') return 3;
  if (lower.includes('significant') || lower.includes('heavy') || lower === '4') return 4;
  if (lower.includes('catastrophic') || lower.includes('severe') || lower === '5') return 5;
  const num = parseInt(lower);
  return num >= 1 && num <= 5 ? num : null;
}

/** Normalize date strings to YYYY-MM-DD */
function normalizeDate(text: string | null): string | null {
  if (!text) return null;
  const clean = text.trim();

  // M/D/YYYY or MM/DD/YYYY
  const slashMatch = clean.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const [, m, d, y] = slashMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // "April 15, 2024" or "Jan 30, 2026"
  const months: Record<string, string> = {
    january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
    jan: '01', feb: '02', mar: '03', apr: '04', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };
  const wordMatch = clean.match(/(\w+)\s+(\d{1,2}),?\s+(\d{4})/i);
  if (wordMatch) {
    const monthStr = wordMatch[1].toLowerCase();
    const mm = months[monthStr];
    if (mm) {
      return `${wordMatch[3]}-${mm}-${wordMatch[2].padStart(2, '0')}`;
    }
  }

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

  return null;
}

/** Normalize peril to match PERIL_OPTIONS */
function normalizePeril(text: string | null): string | null {
  if (!text) return null;
  const lower = text.toLowerCase().trim();
  const map: Record<string, string> = {
    'hail': 'Hail',
    'wind': 'Wind',
    'hurricane': 'Hurricane',
    'flood': 'Flood',
    'fire': 'Fire',
    'water': 'Water',
    'lightning': 'Lightning',
    'theft': 'Theft',
    'vandalism': 'Vandalism',
  };
  for (const [key, val] of Object.entries(map)) {
    if (lower.includes(key)) return val;
  }
  return 'Other';
}

/** Normalize property type */
function normalizePropertyType(text: string | null): string | null {
  if (!text) return null;
  const lower = text.toLowerCase().trim();
  if (lower.includes('residential') || lower.includes('home') || lower.includes('house')) return 'Residential';
  if (lower.includes('commercial')) return 'Commercial';
  if (lower.includes('industrial')) return 'Industrial';
  if (lower.includes('multi')) return 'Multi-Family';
  return null;
}

/** Parse a dollar amount string */
function parseDollar(text: string | null): number | null {
  if (!text) return null;
  const clean = text.replace(/[$,\s]/g, '');
  const num = parseFloat(clean);
  return isNaN(num) || num === 0 ? null : num;
}

/** Clean up client name — handle "Last, First" format and strip trailing labels */
function normalizeClientName(text: string | null): string | null {
  if (!text) return null;
  let name = text.trim();
  // Strip trailing CRM labels that get picked up
  name = name.replace(/\s*(Client Type|Individual|Company|Type|Additional).*$/i, '').trim();
  // "Cerezo , Avelina" → "Avelina Cerezo"
  const commaMatch = name.match(/^([^,]+?)\s*,\s*(.+)$/);
  if (commaMatch) {
    name = `${commaMatch[2].trim()} ${commaMatch[1].trim()}`;
  }
  return name || null;
}

/** Strip trailing CRM labels/role titles from a parsed value */
function stripTrailingLabels(text: string | null): string | null {
  if (!text) return null;
  // Common CRM labels and role titles that run into parsed values
  const stopWords = [
    'Policy', 'Claim', 'File', 'Client', 'Loss', 'Peril', 'Carrier', 'Severity',
    'Case Manager', 'Account Manager', 'Account Executive', 'Estimator', 'Adjuster',
    'Sales Consultant', 'National Recruiting', 'Contract Signer', 'Referral Source',
    'Adjuster Supervisor', 'CC ', 'Property Type', 'Workflow', 'Assigned',
  ];
  let result = text.trim();
  for (const stop of stopWords) {
    const idx = result.indexOf(stop);
    if (idx > 0) {
      // Only strip if it's not at the very start and looks like a trailing label
      const before = result.substring(0, idx).trim();
      if (before.length >= 3) {
        result = before;
        break;
      }
    }
  }
  return result.trim() || null;
}

// ── Main Parser ──────────────────────────────────────────────────

export function parseCrmData(raw: string): ParsedCrmData {
  const text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // File number — pattern: XX-XXXXXXXXXX (state code + year + sequence)
  const fileNumber = firstMatch(text, [
    /File\s*#\s*\n([A-Z]{2}-\d{7,})/i,
    /File\s*#\s*:?\s*([A-Z]{2}-\d{7,})/i,
    /\b([A-Z]{2}-20\d{8,})\b/,
  ]);

  // Client name — "Client\nAvelina Cerezo" or "Cerezo , Avelina" or "Name — Address" pattern
  const clientName = normalizeClientName(firstMatch(text, [
    // "Client\nJohn Brain" or "[ hide ]Client\nAvelina Cerezo"
    /Client\s*\n\s*([A-Za-z][A-Za-z\s,.''-]+)/,
    // "Name — Address" pattern from claim header
    /([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*[—–-]\s*\d+\s/,
    // "Last , First" pattern
    /\n([A-Z][a-z]+\s*,\s*[A-Z][a-z]+)\s*\n/,
  ]));

  // Client phone
  const clientPhone = firstMatch(text, [
    /(\d{3}[-.]?\d{3}[-.]?\d{4})\s*-\s*None/,
    /(\(\d{3}\)\s*\d{3}[-.]?\d{4})/,
    /(\d{3}[-.]?\d{3}[-.]?\d{4})/,
  ]);

  // Client email
  const clientEmail = firstMatch(text, [
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s*\n(?:Additional|$)/m,
    /([a-zA-Z0-9._%+-]+@(?:gmail|yahoo|hotmail|outlook|aol|icloud)[a-zA-Z0-9.-]*\.[a-zA-Z]{2,})/i,
  ]);

  // Loss state — from address patterns
  const lossAddress = firstMatch(text, [
    /Loss Address:?\s*\n?(.+(?:\n.+)?)/i,
    /Loss Address\s*\n(.+\n.+)/i,
  ]);
  const lossState = extractState(lossAddress || text) ||
    firstMatch(text, [/\b([A-Z]{2})\s+\d{5}(?:-\d{4})?/]);

  // Loss date — many formats: "Loss Date\n4/15/2024", "Date of Loss: 4/15/2024", "Date/Time of Loss\nApril 15, 2024"
  const lossDateRaw = firstMatch(text, [
    /Date\/Time of Loss\s*\n?\s*(.+)/i,
    /Date of Loss:?\s*\n?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
    /Loss Date\s*\n?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
    /Loss Date\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
    /Loss:.*?on\s+(\d{1,2}\/\d{1,2}\/\d{4})/i,
    // "Date of Loss\n5/23/2024" with various whitespace
    /(?:Date of Loss|Loss Date)[:\s]*(\w+\s+\d{1,2},?\s+\d{4})/i,
    // Fallback: find any date near "loss" context
    /[Ll]oss.*?(\d{1,2}\/\d{1,2}\/\d{4})/,
  ]);
  const lossDate = normalizeDate(lossDateRaw);

  // Peril
  const perilRaw = firstMatch(text, [
    /Peril\s*\n([A-Za-z]+)/i,
    /Peril:?\s*([A-Za-z]+)/i,
    /Loss:\s*([A-Za-z]+)\s+on\s+/i,
  ]);
  const peril = normalizePeril(perilRaw);

  // Carrier — strip trailing "Policy" label that runs in
  const carrierRaw = firstMatch(text, [
    /Carrier\s*\n([A-Za-z][A-Za-z\s&.''-]+)/i,
    /^([A-Za-z][A-Za-z\s&.''-]+Insurance[A-Za-z\s&.''-]*)/m,
    /^([A-Za-z][A-Za-z\s&.''-]+Mutual[A-Za-z\s&.''-]*)/m,
    /^([A-Za-z][A-Za-z\s&.''-]+Indemnity[A-Za-z\s&.''-]*)/m,
  ]);
  const carrier = stripTrailingLabels(carrierRaw);

  // Claim number — flexible: "Claim #:00201957173" or "Claim Number\n00201957173" or "Claim #\n00201957173"
  const claimNumber = firstMatch(text, [
    /Claim\s*#\s*:?\s*\n?\s*(\d{5,})/i,
    /Claim\s*Number\s*:?\s*\n?\s*(\d{5,})/i,
    /Claim\s*#\s*(\d{5,})/i,
    /Claim Number\s*(\d{5,})/i,
    // Also match in sidebar "Claim #:00201957173" format (no space before digits)
    /Claim\s*#:(\d{5,})/i,
  ]);

  // Policy number — flexible: "Policy #\nHIP000520902" or "Policy #:HIP000520902"
  const policyNumber = firstMatch(text, [
    /Policy\s*#\s*:?\s*\n?\s*([A-Z0-9][A-Z0-9-]{4,})/i,
    /Policy\s*#:([A-Z0-9][A-Z0-9-]{4,})/i,
    /Policy\s*Number\s*:?\s*\n?\s*([A-Z0-9][A-Z0-9-]{4,})/i,
  ]);

  // Property type
  const propertyTypeRaw = firstMatch(text, [
    /Property Type:?\s*([A-Za-z-]+)/i,
  ]);
  const propertyType = normalizePropertyType(propertyTypeRaw);

  // Severity
  const severityRaw = firstMatch(text, [
    /Claim Severity\s*\n.*?\n([A-Za-z]+)/i,
    /Severity\s*\n.*?([A-Za-z]+)/i,
  ]);
  const severity = parseSeverity(severityRaw);

  // Contractor company — look for construction/roofing/etc company names
  const contractorCompanyRaw = firstMatch(text, [
    /(?:Additional Contacts|Contractor)\s*\n(?:[A-Za-z\s]+\n)?([A-Za-z][A-Za-z\s&.''-]*(?:Roofing|Restoration|Construction|Contracting|Builders|Exteriors|Solutions|Remodeling|Renovations)[A-Za-z\s&.''-]*)/i,
    /(?:CC|Contractor)\s+([A-Za-z][A-Za-z\s&.''-]*(?:Roofing|Restoration|Construction|Contracting|Builders|Exteriors|Solutions|Remodeling|Renovations)[A-Za-z\s&.''-]*)/i,
    // Also catch "CC CompanyName" pattern from ClaimWizard quick view
    /\nCC\s+([A-Za-z][A-Za-z\s&.''-]+)/,
  ]);
  const contractorCompany = stripTrailingLabels(contractorCompanyRaw);

  // Contractor rep — person name right before/after contractor company, or in Additional Contacts
  const contractorRep = firstMatch(text, [
    /Additional Contacts\s*\n([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*\n/,
    // Person name right before a company email domain
    /\n([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*\n[a-z]+@/,
  ]);

  // Contractor rep email — non-personal email near Additional Contacts or contractor section
  const contractorRepEmail = firstMatch(text, [
    /Additional Contacts[\s\S]*?([a-zA-Z0-9._%+-]+@(?!gmail|yahoo|hotmail|outlook|aol|icloud|coastalclaims)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    // Any business email near a roofing/construction company mention
    /(?:Roofing|Restoration|Construction|Contracting)[\s\S]{0,200}?([a-zA-Z0-9._%+-]+@(?!gmail|yahoo|hotmail|outlook|aol|icloud|coastalclaims)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
  ]);

  // Referral source — strip trailing role titles
  const referralSourceRaw = firstMatch(text, [
    /Referral Source\s*\n([A-Z][a-z]+ [A-Za-z\s]+)/i,
    /Source of Claim\s*\n.*?\n([A-Za-z][A-Za-z\s&.''-]+)/i,
  ]);
  const referralSource = stripTrailingLabels(referralSourceRaw);

  // Description of loss
  const descriptionOfLoss = firstMatch(text, [
    /Description of Loss:?\s*\n?([^\n]+)/i,
    /Description of Loss\s*\n([^\n]+)/i,
  ]);

  // Estimate value
  const estimateValueRaw = firstMatch(text, [
    /Estimated Loss Amount\s*\n?\$?([\d,.]+)/i,
    /Carrier Estimate.*?\$?([\d,.]+)/i,
  ]);
  const estimateValue = parseDollar(estimateValueRaw);

  return {
    file_number: fileNumber,
    client_name: clientName,
    client_phone: clientPhone,
    client_email: clientEmail,
    loss_state: lossState,
    loss_date: lossDate,
    peril,
    carrier,
    claim_number: claimNumber,
    policy_number: policyNumber,
    property_type: propertyType,
    severity,
    contractor_company: contractorCompany,
    contractor_rep: contractorRep,
    contractor_rep_email: contractorRepEmail,
    referral_source: referralSource,
    description_of_loss: descriptionOfLoss,
    estimate_value: estimateValue,
  };
}

/** Returns a user-friendly summary of what was parsed (for the preview) */
export function getParsedSummary(data: ParsedCrmData): { label: string; value: string }[] {
  const items: { label: string; value: string }[] = [];
  if (data.file_number) items.push({ label: 'File #', value: data.file_number });
  if (data.client_name) items.push({ label: 'Client', value: data.client_name });
  if (data.client_phone) items.push({ label: 'Phone', value: data.client_phone });
  if (data.client_email) items.push({ label: 'Email', value: data.client_email });
  if (data.loss_state) items.push({ label: 'Loss State', value: data.loss_state });
  if (data.loss_date) items.push({ label: 'Loss Date', value: data.loss_date });
  if (data.peril) items.push({ label: 'Peril', value: data.peril });
  if (data.carrier) items.push({ label: 'Carrier', value: data.carrier });
  if (data.claim_number) items.push({ label: 'Claim #', value: data.claim_number });
  if (data.policy_number) items.push({ label: 'Policy #', value: data.policy_number });
  if (data.property_type) items.push({ label: 'Property Type', value: data.property_type });
  if (data.severity) items.push({ label: 'Severity', value: data.severity.toString() });
  if (data.contractor_company) items.push({ label: 'Contractor', value: data.contractor_company });
  if (data.contractor_rep) items.push({ label: 'Contractor Rep', value: data.contractor_rep });
  if (data.contractor_rep_email) items.push({ label: 'Contractor Email', value: data.contractor_rep_email });
  if (data.referral_source) items.push({ label: 'Referral Source', value: data.referral_source });
  if (data.description_of_loss) items.push({ label: 'Description', value: data.description_of_loss });
  if (data.estimate_value) items.push({ label: 'Est. Value', value: `$${data.estimate_value.toLocaleString()}` });
  return items;
}
