"use client"

import { useState, useEffect } from "react"
import type { AgentId } from "@/types/brief"
import { type Skill, type SkillRun } from "@/app/lib/office"

const KEY = "centcom-office-runs-v1"
const MAX = 200 // cap stored history

// Persists completed skill runs to localStorage so recurring "due" state and
// last-run output survive reloads. Stale "running" entries (from a reload
// mid-run) are dropped on load.
export function useRuns() {
  const [runs, setRuns] = useState<SkillRun[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return
      const parsed: SkillRun[] = JSON.parse(raw)
      setRuns(parsed.filter((r) => r.status === "done"))
    } catch {}
  }, [])

  function save(next: SkillRun[]) {
    try {
      localStorage.setItem(KEY, JSON.stringify(next.filter((r) => r.status === "done").slice(0, MAX)))
    } catch {}
  }

  function runSkill(agentId: AgentId, skill: Skill) {
    const run: SkillRun = {
      id: Date.now() + Math.random(),
      agentId,
      skillId: skill.id,
      label: skill.label,
      at: Date.now(),
      status: "running",
    }
    setRuns((r) => [run, ...r].slice(0, MAX))
    // Simulated work; swap for a real skill/agent call later.
    setTimeout(() => {
      setRuns((r) => {
        const next = r.map((x) =>
          x.id === run.id ? { ...x, status: "done" as const, at: Date.now(), output: skill.sample } : x,
        )
        save(next)
        return next
      })
    }, 850)
  }

  return { runs, runSkill }
}
