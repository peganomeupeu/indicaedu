import type { ParsedWorkbook } from "./parser";

export interface ConsultantMeta {
  id: string;
  consultant_name: string;
  profile_id: string | null;
  cargo: string;
  meta_eventos_gerais: number;
  meta_entrevistas_telefone: number;
  meta_entrevistas_video: number;
  meta_entrevistas_presenciais: number;
  meta_visitas: number;
  meta_placements_semanal: number;
  meta_placements_trimestral: number;
}

export interface ConsultantPoints {
  consultantName: string;
  profileId: string | null;
  matched: boolean;
  productivity: { points: number; metaPercentage: number; weeksHit: number; totalWeeks: number };
  revenue: { points: number; revenueAudens: number; revenueOne: number };
  deadline: { points: number; vacanciesOnTime: number };
  cancellations: { points: number; asResponsible: number; asFinder: number };
  total: number;
}

const folded = (s: string): string =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const sameName = (a: string, b: string): boolean => folded(a) === folded(b);

export function findMeta(name: string, metas: ConsultantMeta[]): ConsultantMeta | undefined {
  return metas.find(m => sameName(m.consultant_name, name));
}

const isOneCompany = (empresa: string): boolean => {
  const f = folded(empresa);
  return f.includes("one") || f.includes("outsourcing");
};

export function computeForMonth(
  parsed: ParsedWorkbook,
  metas: ConsultantMeta[],
  month: number
): { rows: ConsultantPoints[]; unknownNames: string[] } {
  // Collect all distinct consultant names for the month from all sheets
  const allNames = new Set<string>();
  parsed.interviews.filter(r => r.mes === month).forEach(r => allNames.add(r.consultor));
  parsed.visits.filter(r => r.mes === month).forEach(r => allNames.add(r.consultor));
  parsed.revenue.filter(r => r.mes === month && r.tipo.toLowerCase().includes("respons")).forEach(r => allNames.add(r.consultor));
  parsed.placements.filter(r => r.mes === month).forEach(r => allNames.add(r.consultor));
  parsed.cancellations.filter(r => r.mes === month).forEach(r => {
    if (r.responsavel) allNames.add(r.responsavel);
    if (r.finder) allNames.add(r.finder);
  });

  const unknownNames: string[] = [];
  const rows: ConsultantPoints[] = [];

  for (const name of allNames) {
    const meta = findMeta(name, metas);
    if (!meta) unknownNames.push(name);

    // ===== Productivity (per week) =====
    const weeks = new Set<number>();
    parsed.interviews.filter(r => r.mes === month && sameName(r.consultor, name)).forEach(r => weeks.add(r.semana));
    parsed.visits.filter(r => r.mes === month && sameName(r.consultor, name)).forEach(r => weeks.add(r.semana));

    let weeksHit = 0;
    let weeksOver = 0;
    const totalWeeks = Math.max(weeks.size, 1);

    for (const w of weeks) {
      const myInt = parsed.interviews.filter(r => r.mes === month && r.semana === w && sameName(r.consultor, name));
      const myVis = parsed.visits.filter(r => r.mes === month && r.semana === w && sameName(r.consultor, name));

      const telefone = myInt.filter(r => folded(r.tipo).includes("telefone")).length;
      const video = myInt.filter(r => folded(r.tipo).includes("video") || folded(r.tipo).includes("vídeo")).length;
      const presencial = myInt.filter(r => folded(r.tipo) === "presencial" || folded(r.tipo).includes("presencial")).length;
      const visitasMeeting = myVis.filter(r => {
        const f = folded(r.tipo);
        return f.includes("meeting") || f.includes("acompanhante meeting");
      }).length;
      // Total events: all interviews + all visit-sheet items (Meetings + Alinhamentos + ShortList + Calibragem + Devolutiva)
      const eventosGerais = myInt.length + myVis.length;

      if (!meta) continue;

      // Both event meta AND telephone meta must be hit (when > 0)
      const hitEventos = meta.meta_eventos_gerais === 0 || eventosGerais >= meta.meta_eventos_gerais;
      const hitTelefone = meta.meta_entrevistas_telefone === 0 || telefone >= meta.meta_entrevistas_telefone;
      const hitVideo = meta.meta_entrevistas_video === 0 || video >= meta.meta_entrevistas_video;
      const hitPresencial = meta.meta_entrevistas_presenciais === 0 || presencial >= meta.meta_entrevistas_presenciais;
      const hitVisitas = meta.meta_visitas === 0 || visitasMeeting >= meta.meta_visitas;

      const allHit = hitEventos && hitTelefone && hitVideo && hitPresencial && hitVisitas;
      if (allHit) {
        weeksHit++;
        // "Excedeu" = strictly over (when meta > 0)
        const over =
          (meta.meta_eventos_gerais > 0 && eventosGerais > meta.meta_eventos_gerais) ||
          (meta.meta_entrevistas_telefone > 0 && telefone > meta.meta_entrevistas_telefone);
        if (over) weeksOver++;
      }
    }

    const baseRatio = weeksHit / totalWeeks; // 0..1
    let productivityPoints = Math.round(baseRatio * 200);
    let metaPercentage = baseRatio * 100;
    if (weeksHit === totalWeeks && weeksOver > 0) {
      // Bonus proportional to weeks exceeded — up to 300
      const bonusRatio = weeksOver / totalWeeks; // 0..1
      productivityPoints = Math.round(200 + bonusRatio * 100);
      metaPercentage = 100 + bonusRatio * 50;
    }
    if (!meta) productivityPoints = 0;

    // ===== Revenue =====
    const myRev = parsed.revenue.filter(
      r => r.mes === month && sameName(r.consultor, name) && folded(r.tipo).includes("respons")
    );
    let revAudens = 0;
    let revOne = 0;
    for (const r of myRev) {
      if (r.remuneracao > 10000) revAudens += r.valor;
      else revOne += r.valor;
    }
    const revPoints = Math.floor(revOne / 1000) * 2 + Math.floor(revAudens / 2600) * 2;

    // ===== Deadline =====
    const myPl = parsed.placements.filter(r => r.mes === month && sameName(r.consultor, name));
    let onTime = 0;
    for (const p of myPl) {
      const limit = isOneCompany(p.empresa) ? 50 : 60;
      if (p.duracaoDias > 0 && p.duracaoDias < limit) onTime++;
    }
    const deadlinePoints = onTime * 20;

    // ===== Cancellations =====
    const asResp = parsed.cancellations.filter(r => r.mes === month && sameName(r.responsavel, name)).length;
    const asFind = parsed.cancellations.filter(r => r.mes === month && sameName(r.finder, name)).length;
    const cancMagnitude = asResp * 6 + asFind * 4; // stored as positive magnitude

    rows.push({
      consultantName: name,
      profileId: meta?.profile_id ?? null,
      matched: !!meta,
      productivity: {
        points: productivityPoints,
        metaPercentage: Number(metaPercentage.toFixed(2)),
        weeksHit,
        totalWeeks: weeks.size,
      },
      revenue: { points: revPoints, revenueAudens: revAudens, revenueOne: revOne },
      deadline: { points: deadlinePoints, vacanciesOnTime: onTime },
      cancellations: { points: cancMagnitude, asResponsible: asResp, asFinder: asFind },
      total: productivityPoints + revPoints + deadlinePoints - cancMagnitude,
    });
  }

  rows.sort((a, b) => b.total - a.total);
  return { rows, unknownNames: Array.from(new Set(unknownNames)) };
}
