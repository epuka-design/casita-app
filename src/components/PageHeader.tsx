export function PageHeader({
  titulo,
  subtitulo,
  action,
}: {
  titulo: string;
  subtitulo?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h1 className="titulo">{titulo}</h1>
        {subtitulo && <p className="subtitulo mt-1">{subtitulo}</p>}
      </div>
      {action}
    </div>
  );
}
