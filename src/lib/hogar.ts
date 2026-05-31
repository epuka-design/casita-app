import "server-only";
import { supabaseAdmin } from "./supabase/admin";
import { porcionesObjetivo } from "./cantidades";

export interface Hogar {
  adultos: number;
  ninos: number;
  factorNino: number;
  objetivo: number; // porciones objetivo
}

const DEFAULTS = { adultos: 3, ninos: 2, factorNino: 0.5 };

// Configuración del hogar indicado. Cae a los valores por defecto si
// todavía no se creó la fila.
export async function getHogar(hogarId: string): Promise<Hogar> {
  const { data } = await supabaseAdmin
    .from("hogar_config")
    .select("adultos, ninos, factor_nino")
    .eq("hogar_id", hogarId)
    .maybeSingle();

  const adultos = data?.adultos ?? DEFAULTS.adultos;
  const ninos = data?.ninos ?? DEFAULTS.ninos;
  const factorNino =
    data?.factor_nino != null ? Number(data.factor_nino) : DEFAULTS.factorNino;

  return {
    adultos,
    ninos,
    factorNino,
    objetivo: porcionesObjetivo(adultos, ninos, factorNino),
  };
}
