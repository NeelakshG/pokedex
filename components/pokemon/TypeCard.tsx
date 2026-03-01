import { pokemonTypeColors } from "@/utils/pokemon"

export default function TypeCard({ type }: { type: string }) {
  const colors = pokemonTypeColors[type as keyof typeof pokemonTypeColors]

  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
      style={{ background: colors?.background, color: colors?.color }}
    >
      {type}
    </span>
  )
}
