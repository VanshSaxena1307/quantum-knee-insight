import { cn } from "@/lib/utils";

interface CircuitProps {
  qubits: number;
  depth: number;
  encoding: string;
  entanglement: string;
  simulator: string;
  framework: string;
  className?: string;
}

/**
 * Renders the actually-configured variational circuit: one angle-encoding
 * rotation per qubit, then `depth` variational layers of trainable rotations
 * followed by a ring of CNOT entanglers, then Pauli-Z expectation readout.
 */
export function CircuitVisualizer({
  qubits,
  depth,
  encoding,
  entanglement,
  simulator,
  framework,
  className,
}: CircuitProps) {
  const wireGap = 46;
  const layerWidth = 96;
  const left = 96;
  const width = left + layerWidth * (depth + 1) + 96;
  const height = wireGap * qubits + 40;
  const paramCount = qubits * depth * 2;

  return (
    <div className={cn("panel overflow-hidden", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
        <p className="label-caps">Configured circuit</p>
        <p className="font-mono text-[11px] text-muted-foreground">
          {framework} · {simulator} · {qubits}q · depth {depth} · {paramCount} trainable params
        </p>
      </div>
      <div className="overflow-x-auto p-5">
        <svg
          role="img"
          aria-label={`Quantum circuit with ${qubits} qubits, ${encoding} encoding, ${entanglement} entanglement and depth ${depth}`}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="min-w-[520px]"
        >
          {Array.from({ length: qubits }).map((_, q) => {
            const y = 26 + q * wireGap;
            return (
              <g key={q}>
                <line
                  x1={left - 40}
                  y1={y}
                  x2={width - 40}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeWidth="1.5"
                />
                <text
                  x={8}
                  y={y + 4}
                  className="font-mono"
                  fontSize="11"
                  fill="var(--color-muted-foreground)"
                >
                  |q{q}⟩
                </text>
                {/* angle encoding gate */}
                <rect
                  x={left - 26}
                  y={y - 14}
                  width={56}
                  height={28}
                  rx={5}
                  fill="var(--color-accent)"
                  opacity="0.16"
                  stroke="var(--color-accent)"
                />
                <text x={left - 16} y={y + 4} className="font-mono" fontSize="10" fill="var(--color-foreground)">
                  RY(x{q})
                </text>

                {Array.from({ length: depth }).map((__, d) => {
                  const x = left + 70 + d * layerWidth;
                  return (
                    <g key={d}>
                      <rect
                        x={x}
                        y={y - 14}
                        width={62}
                        height={28}
                        rx={5}
                        fill="var(--color-quantum)"
                        opacity="0.16"
                        stroke="var(--color-quantum)"
                      />
                      <text
                        x={x + 7}
                        y={y + 4}
                        className="font-mono"
                        fontSize="10"
                        fill="var(--color-foreground)"
                      >
                        RY·RZ θ{d}
                        {q}
                      </text>
                    </g>
                  );
                })}

                {/* readout */}
                <rect
                  x={width - 74}
                  y={y - 13}
                  width={30}
                  height={26}
                  rx={4}
                  fill="var(--color-muted)"
                  stroke="var(--color-border)"
                />
                <text x={width - 68} y={y + 4} className="font-mono" fontSize="10" fill="var(--color-foreground)">
                  ⟨Z⟩
                </text>
              </g>
            );
          })}

          {/* CNOT entangling ring per layer */}
          {Array.from({ length: depth }).map((_, d) =>
            Array.from({ length: Math.max(qubits - 1, 0) }).map((__, q) => {
              const x = left + 70 + d * layerWidth + 62 + 8;
              const y1 = 26 + q * wireGap;
              const y2 = 26 + (q + 1) * wireGap;
              return (
                <g key={`${d}-${q}`}>
                  <line x1={x} y1={y1} x2={x} y2={y2} stroke="var(--color-primary)" strokeWidth="1.5" />
                  <circle cx={x} cy={y1} r="3.5" fill="var(--color-primary)" />
                  <circle
                    cx={x}
                    cy={y2}
                    r="6"
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeWidth="1.5"
                  />
                </g>
              );
            }),
          )}
        </svg>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 border-t border-border px-5 py-4 text-xs sm:grid-cols-4">
        {[
          ["Encoding", encoding],
          ["Entanglement", entanglement],
          ["Qubits", String(qubits)],
          ["Depth", String(depth)],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="label-caps">{k}</dt>
            <dd className="mt-0.5 font-mono">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
