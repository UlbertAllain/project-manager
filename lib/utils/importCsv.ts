// ==================== CSV IMPORT UTILITY ====================
// Parse CSV text, map rows to project data, validate imports

// Parse CSV text into array of objects
export function parseCSV(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((header, i) => {
      obj[header.trim()] = (values[i] || '').trim();
    });
    return obj;
  });

  return { headers, rows };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// Map CSV row to project data
export interface ImportProject {
  projectName: string;
  clientName: string;
  projectLead: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  budget: number;
  deadline: string;
  notes: string;
}

// CSV header aliases (Indonesian + English)
const HEADER_ALIASES: Record<string, string> = {
  'nama project': 'projectName',
  'project name': 'projectName',
  'nama': 'projectName',
  'name': 'projectName',
  'client': 'clientName',
  'nama client': 'clientName',
  'client name': 'clientName',
  'lead': 'projectLead',
  'project lead': 'projectLead',
  'deskripsi': 'description',
  'description': 'description',
  'status': 'status',
  'prioritas': 'priority',
  'priority': 'priority',
  'kategori': 'category',
  'category': 'category',
  'budget': 'budget',
  'anggaran': 'budget',
  'deadline': 'deadline',
  'tenggat': 'deadline',
  'catatan': 'notes',
  'notes': 'notes',
};

export function mapRowToProject(row: Record<string, string>): ImportProject {
  const mapped: Record<string, string> = {};

  Object.entries(row).forEach(([key, value]) => {
    const normalizedKey = key.toLowerCase().trim();
    const field = HEADER_ALIASES[normalizedKey] || normalizedKey;
    mapped[field] = value;
  });

  return {
    projectName: mapped.projectName || mapped.name || '',
    clientName: mapped.clientName || mapped.client || '',
    projectLead: mapped.projectLead || mapped.lead || '',
    description: mapped.description || '',
    status: normalizeStatus(mapped.status),
    priority: normalizePriority(mapped.priority),
    category: normalizeCategory(mapped.category),
    budget: parseFloat(mapped.budget) || 0,
    deadline: normalizeDate(mapped.deadline),
    notes: mapped.notes || '',
  };
}

function normalizeStatus(val: string): string {
  const map: Record<string, string> = {
    'new': 'NEW', 'baru': 'NEW',
    'in progress': 'IN_PROGRESS', 'berjalan': 'IN_PROGRESS', 'ongoing': 'IN_PROGRESS',
    'review': 'REVIEW', 'revisi': 'REVIEW',
    'completed': 'COMPLETED', 'selesai': 'COMPLETED', 'done': 'COMPLETED',
    'cancelled': 'CANCELLED', 'batal': 'CANCELLED',
    'on hold': 'ON_HOLD', 'tunda': 'ON_HOLD',
  };
  return map[(val || '').toLowerCase().trim()] || 'NEW';
}

function normalizePriority(val: string): string {
  const map: Record<string, string> = {
    'low': 'LOW', 'rendah': 'LOW',
    'medium': 'MEDIUM', 'sedang': 'MEDIUM', 'normal': 'MEDIUM',
    'high': 'HIGH', 'tinggi': 'HIGH',
    'urgent': 'URGENT', 'kritis': 'URGENT',
  };
  return map[(val || '').toLowerCase().trim()] || 'MEDIUM';
}

function normalizeCategory(val: string): string {
  const map: Record<string, string> = {
    'web': 'WEB', 'mobile': 'MOBILE', 'design': 'DESIGN',
    'consulting': 'CONSULTING', 'konsultasi': 'CONSULTING',
    'infrastructure': 'INFRASTRUCTURE', 'infrastruktur': 'INFRASTRUCTURE',
    'other': 'OTHER', 'lainnya': 'OTHER',
  };
  return map[(val || '').toLowerCase().trim()] || 'WEB';
}

function normalizeDate(val: string): string {
  if (!val) return '';
  // Try various formats
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  // Try DD/MM/YYYY
  const parts = val.split('/');
  if (parts.length === 3) {
    const d2 = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    if (!isNaN(d2.getTime())) return d2.toISOString().split('T')[0];
  }
  return val;
}

// Validate imported projects
export function validateImportProject(project: ImportProject): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!project.projectName.trim()) errors.push('Nama project wajib diisi');
  if (!project.clientName.trim()) errors.push('Nama client wajib diisi');
  if (project.budget < 0) errors.push('Budget tidak boleh negatif');
  return { valid: errors.length === 0, errors };
}
