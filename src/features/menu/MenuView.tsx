import Link from "next/link";
import { MENU_TIPO_LABEL } from "@/lib/categorias";

export interface SlotView {
  recetaId: string | null;
  nombre: string | null;
  categoria: string | null;
}

export interface DiaView {
  dia: string;
  almuerzo: SlotView;
  cena: SlotView;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function Plato({ slot }: { slot: SlotView }) {
  if (!slot.nombre) {
    return <span className="text-tinta/30">Sin asignar</span>;
  }
  return slot.recetaId ? (
    <Link href={`/recetas/${slot.recetaId}`} className="hover:text-terracota">
      {slot.nombre}
    </Link>
  ) : (
    <span>{slot.nombre}</span>
  );
}

export function MenuView({ dias }: { dias: DiaView[] }) {
  return (
    <ul className="space-y-3">
      {dias.map((d) => (
        <li key={d.dia} className="carta">
          <h3 className="mb-3 font-serif text-xl">{cap(d.dia)}</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-3">
              <dt className="w-20 shrink-0 text-tinta/50">
                {MENU_TIPO_LABEL.almuerzo}
              </dt>
              <dd>
                <Plato slot={d.almuerzo} />
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-20 shrink-0 text-tinta/50">
                {MENU_TIPO_LABEL.cena}
              </dt>
              <dd>
                <Plato slot={d.cena} />
              </dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}
