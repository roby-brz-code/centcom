"use client"

import { useState, useEffect } from "react"

const KEY = "brief-dismissed"

interface Store {
  generatedAt: string
  ids: number[]
}

export function useDismissed(generatedAt: string) {
  const [ids, setIds] = useState<number[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return
      const store: Store = JSON.parse(raw)
      if (store.generatedAt === generatedAt) setIds(store.ids)
    } catch {}
  }, [generatedAt])

  function persist(next: number[]) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ generatedAt, ids: next }))
    } catch {}
    setIds(next)
  }

  return {
    dismissedIds: ids,
    dismiss: (id: number) => persist([...ids, id]),
    restore: (id: number) => persist(ids.filter((i) => i !== id)),
  }
}
