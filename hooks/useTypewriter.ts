import { useState, useEffect } from "react"

export default function useTypewriter(text: string, speed: number = 100) {
  const [displayedText, setDisplayedText] = useState("")

  useEffect(() => {
    let index = 0
    setDisplayedText("")

    const interval = setInterval(() => {
      if (index >= text.length) {
        clearInterval(interval)
        return
      }
      setDisplayedText(text.slice(0, index + 1))
      index++
    }, speed)

    return () => clearInterval(interval)
  }, [text, speed])

  return displayedText
}

