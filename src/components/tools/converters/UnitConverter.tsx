import { ArrowDownUp, Copy, Link2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { CopyButton } from '../../ui/CopyButton'
import { Field } from '../../ui/Field'
import { Panel } from '../../ui/Panel'
import { StatTile } from '../../ui/StatTile'
import { getUnitGroup, UNIT_GROUPS, convertUnit } from '../../../lib/converters'
import type { Unit } from '../../../lib/converters'
import { cn, copyToClipboard, formatNumber } from '../../../lib/utils'
import { useToast } from '../../../store/toast'
import { Link } from 'react-router-dom'

interface UnitConverterProps {
  groupId?: string
}

export function UnitConverter({ groupId }: UnitConverterProps) {
  const group = getUnitGroup(String(groupId ?? '')) ?? UNIT_GROUPS[0]
  const { notify } = useToast()
  const [value, setValue] = useState('1')
  const [fromId, setFromId] = useState(group.units[0].id)
  const [toId, setToId] = useState(group.units[1]?.id ?? group.units[0].id)

  useEffect(() => {
    setFromId(group.units[0].id)
    setToId(group.units[1]?.id ?? group.units[0].id)
  }, [group])

  const fromUnit = group.units.find((unit) => unit.id === fromId) ?? group.units[0]
  const toUnit = group.units.find((unit) => unit.id === toId) ?? group.units[1] ?? group.units[0]
  const numeric = Number(value)

  const converted = useMemo(
    () => (Number.isFinite(numeric) ? convertUnit(numeric, fromUnit, toUnit) : 0),
    [numeric, fromUnit, toUnit],
  )

  function swap() {
    setFromId(toUnit.id)
    setToId(fromUnit.id)
  }

  const table = useMemo(
    () =>
      group.units.map((unit) => ({
        unit,
        value: Number.isFinite(numeric) ? convertUnit(numeric, fromUnit, unit) : 0,
      })),
    [group, numeric, fromUnit],
  )

  return (
    <div className="space-y-5">
      <Panel title={`${group.label} converter`} subtitle={group.description}>
        <div className="grid items-end gap-3 md:grid-cols-[1fr_auto_1fr]">
          <Field label="From" htmlFor="unit-from-value">
            <input
              id="unit-from-value"
              type="number"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className="input-mono text-base"
              placeholder="0"
            />
          </Field>
          <button
            type="button"
            onClick={swap}
            className="btn-icon mb-0.5 md:mb-0"
            title="Swap units"
            aria-label="Swap units"
          >
            <ArrowDownUp className="h-4 w-4" />
          </button>
          <Field label="To" htmlFor="unit-to-value">
            <input id="unit-to-value" value={formatNumber(converted, 10)} readOnly className="input-mono text-base text-cyan" />
          </Field>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="From unit">
            <UnitSelect units={group.units} value={fromId} onChange={setFromId} />
          </Field>
          <Field label="To unit">
            <UnitSelect units={group.units} value={toId} onChange={setToId} />
          </Field>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={async () => {
              const ok = await copyToClipboard(`${formatNumber(numeric)} ${fromUnit.symbol} = ${formatNumber(converted, 10)} ${toUnit.symbol}`)
              notify(ok ? 'Conversion copied' : 'Could not copy', ok ? 'success' : 'error')
            }}
            className="btn-ghost !text-xs"
          >
            <Copy className="h-3.5 w-3.5" /> Copy conversion
          </button>
          <CopyButton value={formatNumber(converted, 10)} label="Copy value" />
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Panel title={`All ${group.label.toLowerCase()} units`} subtitle="Live conversion for the value above.">
          <div className="overflow-hidden rounded-lg border border-line/70">
            <table className="w-full text-left text-xs">
              <thead className="bg-panel-soft text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Unit</th>
                  <th className="px-3 py-2.5 font-semibold">Symbol</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Value</th>
                </tr>
              </thead>
              <tbody>
                {table.map(({ unit, value: convertedValue }) => (
                  <tr
                    key={unit.id}
                    className={cn(
                      'border-t border-line/60',
                      (unit.id === fromId || unit.id === toId) && 'bg-cyan/[0.04]',
                    )}
                  >
                    <td className="px-3 py-2 text-muted">{unit.name}</td>
                    <td className="px-3 py-2 font-mono text-slate-500">{unit.symbol}</td>
                    <td className="px-3 py-2 text-right font-mono text-ink">{formatNumber(convertedValue, 8)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <div className="space-y-4">
          <Panel title="At a glance">
            <div className="grid gap-2.5">
              <StatTile label="Input" value={`${formatNumber(numeric)} ${fromUnit.symbol}`} />
              <StatTile label="Result" value={`${formatNumber(converted, 10)} ${toUnit.symbol}`} />
              <StatTile label="Rate" value={`1 ${fromUnit.symbol} = ${formatNumber(convertUnit(1, fromUnit, toUnit), 10)} ${toUnit.symbol}`} />
            </div>
          </Panel>
          <Panel title="More converters" subtitle="Switch unit type without losing your place.">
            <div className="flex flex-wrap gap-1.5">
              {UNIT_GROUPS.filter((item) => item.id !== group.id).map((item) => {
                const toolId = `${item.id}-converter`
                return (
                  <Link key={item.id} to={`/tools/${toolId}`} className="chip transition hover:border-cyan/40 hover:text-cyan">
                    <Link2 className="h-3 w-3" /> {item.label}
                  </Link>
                )
              })}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

function UnitSelect({
  units,
  value,
  onChange,
}: {
  units: Unit[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="input appearance-none">
      {units.map((unit) => (
        <option key={unit.id} value={unit.id}>
          {unit.name} ({unit.symbol})
        </option>
      ))}
    </select>
  )
}
