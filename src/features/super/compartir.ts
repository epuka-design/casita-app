import type { SuperItem } from "./queries";

// Arma el texto plano para compartir por WhatsApp, agrupado por categoría.
export function textoWhatsApp(titulo: string, items: SuperItem[]): string {
  const cats: string[] = [];
  for (const it of items) if (!cats.includes(it.categoria)) cats.push(it.categoria);

  const lines: string[] = [`*${titulo}*`, ""];
  for (const cat of cats) {
    lines.push(`*${cat}*`);
    for (const it of items.filter((i) => i.categoria === cat)) {
      const mark = it.tildado ? "✅" : "▫️";
      const qty = it.cantidad ? ` — ${it.cantidad}` : "";
      lines.push(`${mark} ${it.item}${qty}`);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}
