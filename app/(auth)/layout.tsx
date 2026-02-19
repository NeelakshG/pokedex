

import Gameboy from '@/components/ui/Gameboy';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div 
      className="min-h-screen w-full flex items-center justify-between px-16"
      style={{ 
        backgroundImage: "url('/bg-signin.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Gameboy>
        {children}
      </Gameboy>
    </div>
  )
}
