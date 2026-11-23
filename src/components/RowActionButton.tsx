import './RowActionButton.css'

const actions = {
  up: { title: '上へ移動', label: 'を上へ移動', path: 'M12 19V5m-6 6 6-6 6 6' },
  down: { title: '下へ移動', label: 'を下へ移動', path: 'M12 5v14m-6-6 6 6 6-6' },
  delete: { title: '削除', label: 'を削除', path: 'M3 6h18M9 6V3h6v3m4 0-1 15H6L5 6m5 4v7m4-7v7' },
} as const

export default function RowActionButton({ action, rowLabel, disabled, onClick }: {
  action: keyof typeof actions
  rowLabel: string
  disabled?: boolean
  onClick: () => void
}) {
  const { title, label, path } = actions[action]

  return (
    <button
      className="row-action-button"
      type="button"
      aria-label={`${rowLabel}${label}`}
      title={title}
      disabled={disabled}
      onClick={onClick}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d={path} /></svg>
    </button>
  )
}
