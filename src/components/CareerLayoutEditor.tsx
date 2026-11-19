import type {
  ApplicationDocument,
  CareerSectionId,
  DocumentLayout,
} from '../types/documents'

type Props = {
  application: ApplicationDocument
  disabled: boolean
  onChange: (
    update: (current: ApplicationDocument) => ApplicationDocument,
  ) => void
}

const sectionLabels: Record<CareerSectionId, string> = {
  summary: '職務要約',
  skills: '活かせる経験・知識・技術',
  careers: '職務経歴',
  selfPromotion: '自己PR',
}

function toggleItem<T>(
  items: T[],
  item: T,
  checked: boolean,
): T[] {
  if (checked) {
    return items.includes(item) ? items : [...items, item]
  }

  return items.filter((value) => value !== item)
}

export function CareerLayoutEditor({
  application,
  disabled,
  onChange,
}: Props) {
  const { layout, careerHistory } = application

  function updateLayout(
    update: (current: DocumentLayout) => DocumentLayout,
  ) {
    onChange((current) => ({
      ...current,
      layout: update(current.layout),
    }))
  }

  function moveSection(index: number, direction: -1 | 1) {
    updateLayout((current) => {
      const order = [...current.careerSectionOrder]
      const target = index + direction

      if (target < 0 || target >= order.length) {
        return current
      }

      const [section] = order.splice(index, 1)
      order.splice(target, 0, section)

      return {
        ...current,
        careerSectionOrder: order,
      }
    })
  }

  return (
    <fieldset disabled={disabled}>
      <legend>職務経歴書のレイアウト</legend>

      <p>
        項目の順序と、印刷時に新しいページから始める位置を指定します。
        改ページの結果は印刷プレビューで確認してください。
      </p>

      {layout.careerSectionOrder.map((sectionId, index) => (
        <fieldset key={sectionId} className="entry-row">
          <legend>{sectionLabels[sectionId]}</legend>

          <div className="actions">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => moveSection(index, -1)}
            >
              上へ
            </button>

            <button
              type="button"
              disabled={
                index === layout.careerSectionOrder.length - 1
              }
              onClick={() => moveSection(index, 1)}
            >
              下へ
            </button>
          </div>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={layout.pageBreakBeforeSectionIds.includes(
                sectionId,
              )}
              onChange={(event) => {
                const checked = event.target.checked

                updateLayout((current) => ({
                  ...current,
                  pageBreakBeforeSectionIds: toggleItem(
                    current.pageBreakBeforeSectionIds,
                    sectionId,
                    checked,
                  ),
                }))
              }}
            />
            この項目を新しいページから始める
          </label>
        </fieldset>
      ))}

      <h3>職歴・プロジェクトの改ページ</h3>

      {careerHistory.careers.map((career, careerIndex) => (
        <fieldset key={career.id} className="entry-row">
          <legend>
            {career.companyName || `職歴 ${careerIndex + 1}`}
          </legend>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={layout.pageBreakBeforeCareerIds.includes(
                career.id,
              )}
              onChange={(event) => {
                const checked = event.target.checked

                updateLayout((current) => ({
                  ...current,
                  pageBreakBeforeCareerIds: toggleItem(
                    current.pageBreakBeforeCareerIds,
                    career.id,
                    checked,
                  ),
                }))
              }}
            />
            この職歴を新しいページから始める
          </label>

          {career.projects.map((project, projectIndex) => (
            <label
              key={project.id}
              className="checkbox-label"
            >
              <input
                type="checkbox"
                checked={layout.pageBreakBeforeProjectIds.includes(
                  project.id,
                )}
                onChange={(event) => {
                  const checked = event.target.checked

                  updateLayout((current) => ({
                    ...current,
                    pageBreakBeforeProjectIds: toggleItem(
                      current.pageBreakBeforeProjectIds,
                      project.id,
                      checked,
                    ),
                  }))
                }}
              />
              「
              {project.name ||
                `プロジェクト ${projectIndex + 1}`}
              」を新しいページから始める
            </label>
          ))}
        </fieldset>
      ))}
    </fieldset>
  )
}