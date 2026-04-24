import * as XLSX from "xlsx";

export interface InterviewRow {
  consultor: string;
  tipo: string; // "Por vídeo" | "Presencial" | "Por Telefone"
  semana: number;
  mes: number;
}
export interface VisitRow {
  consultor: string;
  tipo: string; // "Meeting" | "Acompanhante Meeting" | "Alinhamento Presencial" | ...
  semana: number;
  mes: number;
}
export interface RevenueRow {
  consultor: string;
  tipo: string; // "Consultor Responsável" | "Finder"
  valor: number;
  empresa: string;
  remuneracao: number;
  mes: number;
}
export interface PlacementRow {
  consultor: string;
  duracaoDias: number;
  empresa: string;
  remuneracao: number;
  mes: number;
}
export interface CancellationRow {
  finder: string;
  responsavel: string;
  mes: number;
}

export interface ParsedWorkbook {
  interviews: InterviewRow[];
  visits: VisitRow[];
  revenue: RevenueRow[];
  placements: PlacementRow[];
  cancellations: CancellationRow[];
  warnings: string[];
}

const norm = (s: unknown): string =>
  String(s ?? "").trim().normalize("NFC");

const num = (v: unknown): number => {
  if (typeof v === "number") return v;
  if (v == null) return 0;
  const cleaned = String(v).replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
};

const intNum = (v: unknown): number => {
  if (typeof v === "number") return Math.trunc(v);
  const n = parseInt(String(v ?? "").replace(/\D+/g, ""), 10);
  return isNaN(n) ? 0 : n;
};

// Find a column key in a row by trying multiple aliases (case/accents-insensitive contains)
const pick = (row: Record<string, unknown>, aliases: string[]): unknown => {
  const keys = Object.keys(row);
  const folded = keys.map(k => ({ k, f: k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") }));
  for (const alias of aliases) {
    const a = alias.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const hit = folded.find(({ f }) => f === a) ?? folded.find(({ f }) => f.includes(a));
    if (hit) return row[hit.k];
  }
  return undefined;
};

const sheetRows = (wb: XLSX.WorkBook, name: string): Record<string, unknown>[] => {
  const sheet = wb.Sheets[name];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
};

export function parseWorkbook(wb: XLSX.WorkBook): ParsedWorkbook {
  const warnings: string[] = [];
  const sheetNames = wb.SheetNames;

  const findSheet = (needle: string): string | null => {
    const n = needle.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return sheetNames.find(s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(n)) ?? null;
  };

  const sInterviews = findSheet("entrevistas trimestrais");
  const sVisits = findSheet("visitas");
  const sRevenue = findSheet("faturamento sigla");
  const sPlacements = findSheet("placements trimestrais");
  const sCanc = findSheet("canceladas");

  if (!sInterviews) warnings.push("Aba 'CD - Entrevistas Trimestrais' não encontrada");
  if (!sVisits) warnings.push("Aba 'CD - Visitas' não encontrada");
  if (!sRevenue) warnings.push("Aba 'CD - Faturamento Sigla' não encontrada");
  if (!sPlacements) warnings.push("Aba 'CD - Placements Trimestrais' não encontrada");
  if (!sCanc) warnings.push("Aba 'CD - Canceladas' não encontrada");

  const interviews: InterviewRow[] = sInterviews
    ? sheetRows(wb, sInterviews).map(r => ({
        consultor: norm(pick(r, ["Consultor Responsável: Nome completo", "Consultor Responsavel: Nome completo", "Consultor Responsável", "Consultor"])),
        tipo: norm(pick(r, ["Tipo"])),
        semana: intNum(pick(r, ["NÚM. SEMANA", "NUM. SEMANA", "NÚM SEMANA", "NUM SEMANA", "Semana"])),
        mes: intNum(pick(r, ["MÊS", "MES", "Mês", "Mes"])),
      })).filter(r => r.consultor)
    : [];

  const visits: VisitRow[] = sVisits
    ? sheetRows(wb, sVisits).map(r => ({
        consultor: norm(pick(r, ["Consultor Responsável", "Consultor Responsavel", "Consultor"])),
        tipo: norm(pick(r, ["Tipo"])),
        semana: intNum(pick(r, ["NÚM.SEMANA", "NÚM. SEMANA", "NUM.SEMANA", "Semana"])),
        mes: intNum(pick(r, ["MÊS", "MES", "Mês", "Mes"])),
      })).filter(r => r.consultor)
    : [];

  const revenue: RevenueRow[] = sRevenue
    ? sheetRows(wb, sRevenue).map(r => ({
        consultor: norm(pick(r, ["Consultor: Nome completo", "Consultor"])),
        tipo: norm(pick(r, ["Tipo"])),
        valor: num(pick(r, ["Valor Total", "Valor"])),
        empresa: norm(pick(r, ["Empresa Audens", "Empresa"])),
        remuneracao: num(pick(r, ["CD - FAT Cons.Remuneração", "CD - FAT Cons. Remuneração", "CD - FAT Cons.Remuneracao", "Remuneração", "Remuneracao"])),
        mes: intNum(pick(r, ["MêS", "MÊS", "MES", "Mês", "Mes"])),
      })).filter(r => r.consultor)
    : [];

  const extractDays = (v: unknown): number => {
    const s = String(v ?? "");
    const m = s.match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  };

  const placements: PlacementRow[] = sPlacements
    ? sheetRows(wb, sPlacements).map(r => ({
        consultor: norm(pick(r, ["Consultor Responsável", "Consultor Responsavel", "Consultor"])),
        duracaoDias: extractDays(pick(r, ["Duração", "Duracao"])),
        empresa: norm(pick(r, ["Empresa Audens", "Empresa"])),
        remuneracao: num(pick(r, ["Remuneração", "Remuneracao"])),
        mes: intNum(pick(r, ["MÊs", "MÊS", "MES", "Mês", "Mes"])),
      })).filter(r => r.consultor)
    : [];

  const cancellations: CancellationRow[] = sCanc
    ? sheetRows(wb, sCanc).map(r => ({
        finder: norm(pick(r, ["Finder"])),
        responsavel: norm(pick(r, ["Consultor Responsável", "Consultor Responsavel"])),
        mes: intNum(pick(r, ["MÊS", "MES", "Mês", "Mes"])),
      })).filter(r => r.responsavel || r.finder)
    : [];

  return { interviews, visits, revenue, placements, cancellations, warnings };
}
