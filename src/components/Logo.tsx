// Logo de Casita: isotipo (casita con destello) + wordmark redondeado.

export function Isotipo({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Casita */}
      <path
        d="M24 4.5 L42 19 V40.5 a2.5 2.5 0 0 1 -2.5 2.5 H8.5 A2.5 2.5 0 0 1 6 40.5 V19 Z"
        fill="currentColor"
      />
      {/* Destello (sparkle de 4 puntas) */}
      <path
        d="M24 16 C25.2 22.4 25.6 22.8 32 24 C25.6 25.2 25.2 25.6 24 32 C22.8 25.6 22.4 25.2 16 24 C22.4 22.8 22.8 22.4 24 16 Z"
        fill="#f4efe3"
      />
    </svg>
  );
}

export function Logo({
  size = 28,
  withWordmark = true,
  className,
}: {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <Isotipo size={size} className="text-terracota" />
      {withWordmark && (
        <span
          className="font-logo font-semibold leading-none text-terracota"
          style={{ fontSize: size * 0.82 }}
        >
          Casita
        </span>
      )}
    </span>
  );
}
