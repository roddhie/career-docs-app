import SkillsTable from './SkillsTable'
import type {
  ApplicationDocument,
  CareerEntry,
  CareerHistoryContent,
  ProjectEntry,
  SkillEntry,
} from '../types/documents'
import './CareerEditor.css'

type Props = {
  application: ApplicationDocument
  disabled: boolean
  onChange: (
    update: (current: ApplicationDocument) => ApplicationDocument,
  ) => void
}

type TextFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
  type?: 'text' | 'month'
  disabled?: boolean
}

function TextField({
  label,
  value,
  onChange,
  multiline = false,
  type = 'text',
  disabled = false,
}: TextFieldProps) {
    return (
    <label className={multiline ? 'career-field-wide' : undefined}>
      {label}
      {multiline ? (
        <textarea
          rows={4}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          type={type}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  )
}

type RowActionsProps = {
  index: number
  total: number
  onMove: (direction: -1 | 1) => void
  onRemove: () => void
}

function RowActions({
  index,
  total,
  onMove,
  onRemove,
}: RowActionsProps) {
  return (
    <div className="actions">
      <button
        type="button"
        disabled={index === 0}
        onClick={() => onMove(-1)}
      >
        上へ
      </button>
      <button
        type="button"
        disabled={index === total - 1}
        onClick={() => onMove(1)}
      >
        下へ
      </button>
      <button type="button" onClick={onRemove}>
        削除
      </button>
    </div>
  )
}

function moveItem<T>(
  items: T[],
  index: number,
  direction: -1 | 1,
): T[] {
  const targetIndex = index + direction

  if (
    index < 0 ||
    index >= items.length ||
    targetIndex < 0 ||
    targetIndex >= items.length
  ) {
    return items
  }

  const reordered = [...items]
  const [item] = reordered.splice(index, 1)
  reordered.splice(targetIndex, 0, item)

  return reordered
}

function createSkill(): SkillEntry {
  return {
    id: crypto.randomUUID(),
    category: '',
    technology: '',
    experience: '',
    description: '',
  }
}

function createProject(): ProjectEntry {
  return {
    id: crypto.randomUUID(),
    name: '',
    startDate: '',
    endDate: '',
    ongoing: false,
    overview: '',
    responsibilities: '',
    achievements: '',
    technologies: '',
    role: '',
    teamSize: '',
  }
}

function createCareer(): CareerEntry {
  return {
    id: crypto.randomUUID(),
    companyName: '',
    startDate: '',
    endDate: '',
    ongoing: false,
    employmentType: '',
    businessDescription: '',
    projects: [],
  }
}

const projectFields = [
  { key: 'overview', label: 'プロジェクトの概要' },
  { key: 'responsibilities', label: '担当業務' },
  { key: 'achievements', label: '成果・工夫' },
  { key: 'technologies', label: '開発環境・使用技術' },
] as const

export function CareerEditor({
  application,
  disabled,
  onChange,
}: Props) {
  const content = application.careerHistory

  function updateContent(
    update: (
      current: CareerHistoryContent,
    ) => CareerHistoryContent,
  ) {
    onChange((current) => ({
      ...current,
      careerHistory: update(current.careerHistory),
    }))
  }

  function updateSkill(
    skillId: string,
    patch: Partial<SkillEntry>,
  ) {
    updateContent((current) => ({
      ...current,
      skills: current.skills.map((skill) =>
        skill.id === skillId ? { ...skill, ...patch } : skill,
      ),
    }))
  }

  function updateCareer(
    careerId: string,
    update: (current: CareerEntry) => CareerEntry,
  ) {
    updateContent((current) => ({
      ...current,
      careers: current.careers.map((career) =>
        career.id === careerId ? update(career) : career,
      ),
    }))
  }

  function patchCareer(
    careerId: string,
    patch: Partial<CareerEntry>,
  ) {
    updateCareer(careerId, (current) => ({
      ...current,
      ...patch,
    }))
  }

  function updateProject(
    careerId: string,
    projectId: string,
    patch: Partial<ProjectEntry>,
  ) {
    updateCareer(careerId, (current) => ({
      ...current,
      projects: current.projects.map((project) =>
        project.id === projectId
          ? { ...project, ...patch }
          : project,
      ),
    }))
  }

  function removeSkill(skillId: string) {
    if (!window.confirm('この技術・スキルを削除しますか？')) {
      return
    }

    updateContent((current) => ({
      ...current,
      skills: current.skills.filter(
        (skill) => skill.id !== skillId,
      ),
    }))
  }

  function removeCareer(careerId: string) {
    if (
      !window.confirm(
        'この職歴と、職歴に含まれるすべてのプロジェクトを削除しますか？',
      )
    ) {
      return
    }

    onChange((current) => {
      const removedCareer = current.careerHistory.careers.find(
        (career) => career.id === careerId,
      )
      const projectIds = new Set(
        removedCareer?.projects.map((project) => project.id) ?? [],
      )

      return {
        ...current,
        careerHistory: {
          ...current.careerHistory,
          careers: current.careerHistory.careers.filter(
            (career) => career.id !== careerId,
          ),
        },
        layout: {
          ...current.layout,
          pageBreakBeforeCareerIds:
            current.layout.pageBreakBeforeCareerIds.filter(
              (id) => id !== careerId,
            ),
          pageBreakBeforeProjectIds:
            current.layout.pageBreakBeforeProjectIds.filter(
              (id) => !projectIds.has(id),
            ),
        },
      }
    })
  }

  function removeProject(
    careerId: string,
    projectId: string,
  ) {
    if (!window.confirm('このプロジェクトを削除しますか？')) {
      return
    }

    onChange((current) => ({
      ...current,
      careerHistory: {
        ...current.careerHistory,
        careers: current.careerHistory.careers.map((career) =>
          career.id === careerId
            ? {
                ...career,
                projects: career.projects.filter(
                  (project) => project.id !== projectId,
                ),
              }
            : career,
        ),
      },
      layout: {
        ...current.layout,
        pageBreakBeforeProjectIds:
          current.layout.pageBreakBeforeProjectIds.filter(
            (id) => id !== projectId,
          ),
      },
    }))
  }

  return (
    <fieldset className="career-editor" disabled={disabled}>
      <legend>職務経歴書の編集</legend>

      <TextField
        label="職務要約"
        value={content.summary}
        multiline
        onChange={(summary) =>
          updateContent((current) => ({
            ...current,
            summary,
          }))
        }
      />

      <section className="entry-editor">
        <h3>技術・スキル</h3>

        <p>書類と同じ幅で編集できます。狭い画面では表を横にスクロールしてください。</p>
        <div className="skills-editor-scroll" role="region" aria-label="技術・スキルの編集表" tabIndex={0}>
          <SkillsTable
            skills={content.skills}
            onChange={updateSkill}
            renderActions={(skill, index) => (
              <RowActions
                index={index}
                total={content.skills.length}
                onMove={(direction) =>
                  updateContent((current) => ({
                    ...current,
                    skills: moveItem(current.skills, index, direction),
                  }))
                }
                onRemove={() => removeSkill(skill.id)}
              />
            )}
          />
        </div>

        <button
          type="button"
          onClick={() => {
            const skill = createSkill()

            updateContent((current) => ({
              ...current,
              skills: [...current.skills, skill],
            }))
          }}
        >
          技術・スキルを追加
        </button>
      </section>

      <section className="entry-editor">
        <h3>職歴・プロジェクト</h3>

        {content.careers.map((career, careerIndex) => (
          <fieldset key={career.id} className="entry-row">
            <legend>職歴 {careerIndex + 1}</legend>

            <div className="career-form-grid">

              <TextField
                label="会社名"
                value={career.companyName}
                onChange={(companyName) =>
                  patchCareer(career.id, { companyName })
                }
              />

              <TextField
                label="入社年月"
                type="month"
                value={career.startDate}
                onChange={(startDate) =>
                  patchCareer(career.id, { startDate })
                }
              />

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={career.ongoing}
                  onChange={(event) =>
                    patchCareer(career.id, {
                      ongoing: event.target.checked,
                    })
                  }
                />
                現在も在籍している
              </label>

              <TextField
                label="退社年月（在籍中の場合は入力不要）"
                type="month"
                value={career.endDate}
                disabled={career.ongoing}
                onChange={(endDate) =>
                  patchCareer(career.id, { endDate })
                }
              />

              <TextField
                label="雇用形態"
                value={career.employmentType}
                onChange={(employmentType) =>
                  patchCareer(career.id, { employmentType })
                }
              />

              <TextField
                label="会社の事業内容"
                value={career.businessDescription}
                multiline
                onChange={(businessDescription) =>
                  patchCareer(career.id, {
                    businessDescription,
                  })
                }
              />
            </div>

            <h4>この職歴のプロジェクト</h4>

            {career.projects.map((project, projectIndex) => (
              <fieldset key={project.id} className="entry-row">
                <legend>
                  プロジェクト {projectIndex + 1}
                </legend>

                <div className="career-form-grid">

                  <TextField
                    label="プロジェクト名"
                    value={project.name}
                    onChange={(name) =>
                      updateProject(career.id, project.id, {
                        name,
                      })
                    }
                  />

                  <TextField
                    label="開始年月"
                    type="month"
                    value={project.startDate}
                    onChange={(startDate) =>
                      updateProject(career.id, project.id, {
                        startDate,
                      })
                    }
                  />

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={project.ongoing}
                      onChange={(event) =>
                        updateProject(career.id, project.id, {
                          ongoing: event.target.checked,
                        })
                      }
                    />
                    現在も参画している
                  </label>

                  <TextField
                    label="終了年月（参画中の場合は入力不要）"
                    type="month"
                    value={project.endDate}
                    disabled={project.ongoing}
                    onChange={(endDate) =>
                      updateProject(career.id, project.id, {
                        endDate,
                      })
                    }
                  />

                  {projectFields.map(({ key, label }) => (
                    <TextField
                      key={key}
                      label={label}
                      value={project[key]}
                      multiline
                      onChange={(value) =>
                        updateProject(career.id, project.id, {
                          [key]: value,
                        })
                      }
                    />
                  ))}

                  <TextField
                    label="担当した役割"
                    value={project.role}
                    onChange={(role) =>
                      updateProject(career.id, project.id, {
                        role,
                      })
                    }
                  />

                  <TextField
                    label="チーム規模（例：5名）"
                    value={project.teamSize}
                    onChange={(teamSize) =>
                      updateProject(career.id, project.id, {
                        teamSize,
                      })
                    }
                  />
                </div>

                <RowActions
                  index={projectIndex}
                  total={career.projects.length}
                  onMove={(direction) =>
                    updateCareer(career.id, (current) => ({
                      ...current,
                      projects: moveItem(
                        current.projects,
                        projectIndex,
                        direction,
                      ),
                    }))
                  }
                  onRemove={() =>
                    removeProject(career.id, project.id)
                  }
                />
              </fieldset>
            ))}

            <button
              type="button"
              onClick={() => {
                const project = createProject()

                updateCareer(career.id, (current) => ({
                  ...current,
                  projects: [...current.projects, project],
                }))
              }}
            >
              この職歴にプロジェクトを追加
            </button>

            <hr />

            <RowActions
              index={careerIndex}
              total={content.careers.length}
              onMove={(direction) =>
                updateContent((current) => ({
                  ...current,
                  careers: moveItem(
                    current.careers,
                    careerIndex,
                    direction,
                  ),
                }))
              }
              onRemove={() => removeCareer(career.id)}
            />
          </fieldset>
        ))}

        <button
          type="button"
          onClick={() => {
            const career = createCareer()

            updateContent((current) => ({
              ...current,
              careers: [...current.careers, career],
            }))
          }}
        >
          職歴を追加
        </button>
      </section>

      <TextField
        label="自己PR"
        value={content.selfPromotion}
        multiline
        onChange={(selfPromotion) =>
          updateContent((current) => ({
            ...current,
            selfPromotion,
          }))
        }
      />
    </fieldset>
  )
}