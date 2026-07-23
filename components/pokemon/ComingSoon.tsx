import Link from "next/link"

export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-6 text-center">
      <h1
        className="text-3xl font-extrabold text-gray-800"
        style={{ fontFamily: "var(--font-display, 'Nunito', sans-serif)" }}
      >
        {title}
      </h1>
      <p className="text-gray-500 max-w-sm">
        Coming soon — this is still being built. Check back later!
      </p>
      <Link
        href="/pokedex"
        className="mt-2 px-5 py-2 rounded-full font-bold text-white text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-150"
        style={{ backgroundColor: "#DC0A2D" }}
      >
        Back to Pokédex
      </Link>
    </div>
  )
}
