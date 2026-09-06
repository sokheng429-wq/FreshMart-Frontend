import { useCallback, useEffect, useState } from 'react'

// Local persistence for the Stocks sub-modules (master data + transaction
// ledgers). The backend currently only exposes the Product entity, so these
// collections live in localStorage until matching endpoints exist. Product
// QUANTITIES themselves are NOT stored here — receives/issues/adjustments
// write straight to the real products through adminProductAPI.
const PREFIX = 'bgs-stock-'

export const loadCollection = (key) => {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const saveCollection = (key, items) => {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(items))
  } catch {
    /* storage full / disabled — page keeps working in-memory */
  }
}

// useState-backed collection synced to localStorage. Returns [items, api].
export const useCollection = (key) => {
  const [items, setItems] = useState(() => loadCollection(key))

  useEffect(() => {
    saveCollection(key, items)
  }, [key, items])

  const add = useCallback((item) => {
    const record = { id: Date.now() + Math.random(), createdAt: new Date().toISOString(), ...item }
    setItems((prev) => [record, ...prev])
    return record
  }, [])

  const update = useCallback((id, patch) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }, [])

  const remove = useCallback((id) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }, [])

  return [items, { add, update, remove, setItems }]
}

// ---- Locations used by the transfer workflow -------------------------------
export const LOCATIONS = [
  { key: 'main', en: 'Main Warehouse', kh: 'ឃ្លាំងកណ្តាល' },
  { key: 'branch-a', en: 'Branch A', kh: 'សាខា ក' },
  { key: 'branch-b', en: 'Branch B', kh: 'សាខា ខ' },
]

// Moving-average cost recalculation used by Goods Receipt:
// newAvg = (oldOnHand * oldAvg + qty * unitCost) / (oldOnHand + qty)
export const nextAverageCost = (onHand, avgCost, qty, unitCost) => {
  const oldQty = Number(onHand) || 0
  const newQty = oldQty + (Number(qty) || 0)
  if (newQty <= 0) return Number(unitCost) || 0
  const total = oldQty * (Number(avgCost) || 0) + (Number(qty) || 0) * (Number(unitCost) || 0)
  return Math.round((total / newQty) * 10000) / 10000
}

// EAN-13 style check digit (also used for the weighing-scale barcodes):
// sum digits alternately ×1/×3 from the left, digit = (10 - mod10) % 10
export const eanCheckDigit = (digits12) => {
  let sum = 0
  String(digits12).split('').forEach((d, i) => {
    sum += Number(d) * (i % 2 === 0 ? 1 : 3)
  })
  return (10 - (sum % 10)) % 10
}
