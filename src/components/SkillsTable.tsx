import { useLayoutEffect, useRef } from 'react'
import type { PointerEvent } from 'react'
import type { SkillColumnWidths, SkillEntry } from '../types/documents'
import { defaultSkillColumnWidths, minSkillColumnWidth } from '../utils/skillColumnWidths'
import RowActionButton from './RowActionButton'
import './SkillsTable.css'

const fields = [
  { key: 'category', label: '分類' },
  { key: 'technology', label: '技術' },
  { key: 'experience', label: '経験' },
  { key: 'description', label: '対応できる内容' },
] as const

type Editing = {
  onColumnWidthsChange: (widths: SkillColumnWidths) => void
  onChange: (id: string, patch: Partial<SkillEntry>) => void
  onMove: (id: string, direction: -1 | 1) => void
  onRemove: (id: string) => void
}

type ColumnDrag = {
  pointerId: number
  startX: number
  fieldsWidth: number
  startWidths: SkillColumnWidths
  width: number
}

function SkillInput({ value, label, columnWidth, onChange }: {
  value: string
  label: string
  columnWidth: number
  onChange: (value: string) => void
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${element.scrollHeight}px`
  }, [value, columnWidth])

  return <textarea ref={ref} aria-label={label} rows={1} value={value}
    wrap="soft" onChange={(event) => onChange(event.target.value)} />
}

export default function SkillsTable({ skills, columnWidths = defaultSkillColumnWidths, editing }: {
  skills: SkillEntry[]
  columnWidths?: SkillColumnWidths
  editing?: Editing
}) {
  const drag = useRef<ColumnDrag | null>(null)

  function startResize(event: PointerEvent<HTMLButtonElement>, column: number) {
    if (event.button !== 0 || drag.current || event.currentTarget.matches(':disabled')) return

    const cells = event.currentTarget.closest('tr')?.cells
    if (!cells) return
    const fieldsWidth = cells[cells.length - 2].getBoundingClientRect().right -
      cells[1].getBoundingClientRect().left
    if (fieldsWidth <= 0) return

    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      fieldsWidth,
      startWidths: columnWidths,
      width: columnWidths[column],
    }
  }

  function resizeColumn(column: number, widths: SkillColumnWidths, requestedWidth: number, previousWidth: number) {
    const pairWidth = widths[column] + widths[column + 1]
    const width = Math.max(minSkillColumnWidth, Math.min(requestedWidth, pairWidth - minSkillColumnWidth))
    if (width !== previousWidth) {
      const next: SkillColumnWidths = [...widths]
      next[column] = width
      next[column + 1] = pairWidth - width
      editing?.onColumnWidthsChange(next)
    }
    return width
  }

  function moveResize(event: PointerEvent<HTMLButtonElement>, column: number) {
    const active = drag.current
    if (active?.pointerId !== event.pointerId) return

    const delta = Math.round((event.clientX - active.startX) * 100 / active.fieldsWidth)
    active.width = resizeColumn(column, active.startWidths, active.startWidths[column] + delta, active.width)
  }

  return (
    <table className={`career-skills-table${editing ? ' skills-table-editable' : ''}`}>
      <colgroup>
        {editing && <col className="skill-action-column" />}
        {fields.map(({ key }, index) => (
          <col key={key} style={{
            width: editing ? `calc(var(--skill-fields-width) * ${columnWidths[index] / 100})` : `${columnWidths[index]}%`,
          }} />
        ))}
        {editing && <col className="skill-action-column" />}
      </colgroup>
      <thead>
        <tr>
          {editing && <th className="skill-action-cell" scope="col" aria-label="行移動" />}
          {fields.map(({ key, label }, index) => (
            <th key={key} scope="col">
              {label}
              {editing && index < fields.length - 1 && (
                <button
                  type="button"
                  className="skill-column-resize"
                  role="separator"
                  aria-orientation="vertical"
                  aria-label={`${label}と${fields[index + 1].label}の列幅を調整`}
                  aria-valuemin={minSkillColumnWidth}
                  aria-valuemax={columnWidths[index] + columnWidths[index + 1] - minSkillColumnWidth}
                  aria-valuenow={columnWidths[index]}
                  aria-valuetext={`${columnWidths[index]}%`}
                  onPointerDown={(event) => startResize(event, index)}
                  onPointerMove={(event) => moveResize(event, index)}
                  onLostPointerCapture={(event) => {
                    if (drag.current?.pointerId === event.pointerId) drag.current = null
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
                    event.preventDefault()
                    const width = columnWidths[index]
                    resizeColumn(index, columnWidths, width + (event.key === 'ArrowLeft' ? -1 : 1), width)
                  }}
                />
              )}
            </th>
          ))}
          {editing && <th className="skill-action-cell skill-delete-cell" scope="col" aria-label="削除" />}
        </tr>
      </thead>
      {skills.map((skill, index) => (
        <tbody key={skill.id}>
          <tr>
            {editing && (
              <td className="skill-action-cell">
                <div className="skill-move-buttons">
                  <RowActionButton
                    action="up"
                    rowLabel={`技術・スキル${index + 1}`}
                    disabled={index === 0}
                    onClick={() => editing.onMove(skill.id, -1)}
                  />
                  <RowActionButton
                    action="down"
                    rowLabel={`技術・スキル${index + 1}`}
                    disabled={index === skills.length - 1}
                    onClick={() => editing.onMove(skill.id, 1)}
                  />
                </div>
              </td>
            )}
            {fields.map(({ key, label }, column) => (
              <td key={key} className={editing ? 'skill-input-cell' : undefined}>
                {editing ? (
                  <SkillInput
                    value={skill[key]}
                    columnWidth={columnWidths[column]}
                    label={`技術・スキル${index + 1}：${label}`}
                    onChange={(value) => editing.onChange(skill.id, { [key]: value })}
                  />
                ) : skill[key]}
              </td>
            ))}
            {editing && (
              <td className="skill-action-cell skill-delete-cell">
                <RowActionButton
                  action="delete"
                  rowLabel={`技術・スキル${index + 1}`}
                  onClick={() => editing.onRemove(skill.id)}
                />
              </td>
            )}
          </tr>
        </tbody>
      ))}
    </table>
  )
}
