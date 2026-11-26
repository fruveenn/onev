import { describe, expect, it } from 'vitest'
import { UNIT_GROUPS, convertUnit, getUnitGroup } from './converters'

const unit = (groupId: string, id: string) => {
  const group = getUnitGroup(groupId)
  const found = group?.units.find((item) => item.id === id)
  if (!found) throw new Error(`Missing unit ${groupId}/${id}`)
  return found
}

describe('converters', () => {
  it('converts temperatures correctly', () => {
    expect(convertUnit(100, unit('temperature', 'c'), unit('temperature', 'f'))).toBeCloseTo(212, 6)
    expect(convertUnit(32, unit('temperature', 'f'), unit('temperature', 'c'))).toBeCloseTo(0, 6)
    expect(convertUnit(0, unit('temperature', 'c'), unit('temperature', 'k'))).toBeCloseTo(273.15, 6)
  })

  it('converts lengths and data sizes', () => {
    expect(convertUnit(1, unit('length', 'mi'), unit('length', 'km'))).toBeCloseTo(1.609344, 6)
    expect(convertUnit(1, unit('length', 'ft'), unit('length', 'in'))).toBeCloseTo(12, 6)
    expect(convertUnit(1, unit('data', 'gib'), unit('data', 'mib'))).toBe(1024)
    expect(convertUnit(8, unit('data', 'bit'), unit('data', 'byte'))).toBe(1)
  })

  it('is reversible for every unit pair', () => {
    for (const group of UNIT_GROUPS) {
      for (const from of group.units) {
        for (const to of group.units) {
          const result = convertUnit(convertUnit(42, from, to), to, from)
          expect(result).toBeCloseTo(42, 6)
        }
      }
    }
  })

  it('has unique group and unit ids', () => {
    const groupIds = UNIT_GROUPS.map((group) => group.id)
    expect(new Set(groupIds).size).toBe(groupIds.length)
    for (const group of UNIT_GROUPS) {
      const ids = group.units.map((item) => item.id)
      expect(new Set(ids).size).toBe(ids.length)
      expect(group.units.every((item) => item.factor > 0)).toBe(true)
    }
  })
})
