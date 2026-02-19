"use client"

import useTypewriter from "@/hooks/useTypewriter"
import { useRouter } from "next/navigation"
import { useState } from "react";

export default function Gameboy({ children }: { children: React.ReactNode }) {
  const [started, setStarted] = useState(false)

  return (
    <div className="flex flex-row items-center justify-center gap-12 w-full px-8">
      <GameboyShell onStart={() => setStarted(true)} started={started} />
      {started && <GameboyForm>{children}</GameboyForm>}
    </div>
  )
}

/* ---------------- Shell ---------------- */

function GameboyShell({ onStart, started }: { onStart: () => void, started: boolean }) {
  return (
    <div className="bg-[#cc2200] w-80 min-h-[500px] rounded-t-3xl rounded-b-xl flex flex-col items-center p-4 shadow-xl">
      <GameboyScreen started={started} />
      <GameboyButton onStart={onStart} />
    </div>
  )
}

/* ---------------- buttons ---------------- */

function GameboyButton({ onStart }: { onStart: () => void }) {
  return (
    <div className="w-full px-4 pb-4 mt-16 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <DPad />
        <ABButtons />
      </div>
      <div className="flex justify-center">
        <SelectStart onStart={onStart} />
      </div>
    </div>
  )
}

function DPad() {
  const directions = [
    { id: "up", col: "col-start-2", row: "row-start-1", rounded: "rounded-t-sm" },
    { id: "left", col: "col-start-1", row: "row-start-2", rounded: "rounded-l-sm" },
    { id: "right", col: "col-start-3", row: "row-start-2", rounded: "rounded-r-sm" },
    { id: "down", col: "col-start-2", row: "row-start-3", rounded: "rounded-b-sm" },
  ]

  return (
    <div className="size-24 rounded-full bg-gray-400 flex items-center justify-center">
      <div 
        className="grid grid-cols-3 grid-rows-3 w-16 h-16"
        style={{ gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(3, 1fr)" }}
      >
        {directions.map((dir) => (
          <button
            key={dir.id}
            className={`${dir.col} ${dir.row} ${dir.rounded} bg-gray-800 w-full h-full`}
            onClick={() => console.log(dir.id)}
          />
        ))}
        <div className="col-start-2 row-start-2 bg-gray-800 w-full h-full" />
      </div>
    </div>
  )
}

function ABButtons() {
  return (
    <div style={{ transform: "rotate(-26deg)" }} className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2 relative">
        <div className="absolute inset-0 bg-gray-300 rounded-full -m-2" />
        <button className="relative w-8 h-8 rounded-full bg-[#9e0953]" onClick={() => console.log("B")} />
        <button className="relative w-8 h-8 rounded-full bg-[#9e0953]" onClick={() => console.log("A")} />
      </div>
      <div className="flex items-center gap-4 mt-1">
        <span className="text-xs text-gray-600">B</span>
        <span className="text-xs text-gray-600">A</span>
      </div>
    </div>
  )
}

function SelectStart({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex items-center gap-6 mt-4 ml-8">
      {/* Select */}
      <div className="flex flex-col items-center gap-1" style={{ transform: "rotate(-26deg)" }}>
        <button className="w-10 h-4 bg-gray-400 rounded-full" onClick={() => console.log("select")} />
        <span className="text-[8px] font-bold text-blue-900">SELECT</span>
      </div>

      {/* Start */}
      <div className="flex flex-col items-center gap-1" style={{ transform: "rotate(-26deg)" }}>
        <button className="w-10 h-4 bg-gray-400 rounded-full cursor-pointer" onClick={onStart} />
        <span className="text-[8px] font-bold text-blue-900 cursor-pointer">START</span>
      </div>
    </div>
  )
}

/* ---------------- Screen ---------------- */

function GameboyScreen({ started }: { started: boolean }) {
  const displayedText = useTypewriter(`Welcome to Neelaksh's Database!!\n
    Press START to begin`, 150)

  return (
    <div className="w-full flex flex-col items-center p-4">
      <div className="bg-gray-500 w-full rounded-lg p-4">
        <div className="flex items-center gap-2 w-full mb-2">
          <div className="flex-1">
            <div className="h-px bg-red-400 w-full" />
            <div className="h-px bg-blue-400 w-full" />
          </div>
        </div>
        <div className="flex items-start gap-2">
          <div className="flex flex-col items-center">
            <div className={`w-2 h-2 rounded-full ${started ? "bg-green-400" : "bg-black"}`} />
            <p className="text-xs text-gray-300">BATTERY</p>
          </div>
          <div className="bg-[#7a8c4b] flex-1 aspect-square relative flex items-center justify-center p-2">
            <p className="text-black text-xs font-mono whitespace-pre-line text-center">{displayedText}</p>
        </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Form side ---------------- */

function GameboyForm({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-80">
      {children}
    </div>
  )
}
