import { pokemonTypeColors } from "@/utils/pokemon"

interface TypeCardProps {
  type: string
  size?: "sm" | "md"
  active?: boolean
}

export default function TypeCard({ type, size = "sm", active = false }: TypeCardProps) {
  const colors = pokemonTypeColors[type as keyof typeof pokemonTypeColors]

  const sizeClasses = size === "md"
    ? "px-3 py-1 text-sm font-bold"
    : "px-2 py-0.5 text-xs font-semibold"

  const activeClasses = active
    ? "ring-2 ring-offset-1 ring-white scale-105"
    : ""

  return (
    <span
      className={`rounded-full capitalize inline-block transition-transform duration-150 ${sizeClasses} ${activeClasses}`}
      style={{ background: colors?.background, color: colors?.color }}
    >
      {type}
    </span>
  )
}
