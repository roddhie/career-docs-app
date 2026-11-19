import type {
  CareerHistoryContent,
  CareerSectionId,
  DocumentLayout,
} from '../types/documents'
import './CareerPreview.css'

type Props = {
  fullName: string
  documentDate: string
  content: CareerHistoryContent
  layout: DocumentLayout
}

function formatMonth(value: string): string {
  if (!value) return ''

  const [year, month] = value.split('-')
  return `${year}年${Number(month)}月`
}

function formatDate(value: string): string {
  if (!value) return ''

  const [year, month, day] = value.split('-')
  return `${year}年${Number(month)}月${Number(day)}日`
}

function breakClass(enabled: boolean): string {
  return enabled ? 'career-page-break' : ''
}

export default function CareerPreview({
  fullName,
  documentDate,
  content,
  layout,
}: Props) {
  function renderSection(sectionId: CareerSectionId) {
    switch (sectionId) {
      case 'summary':
        return (
          <>
            <h2>職務要約</h2>
            <p>{content.summary}</p>
          </>
        )

      case 'skills':
        return (
          <>
            <h2>活かせる経験・知識・技術</h2>
            <table>
              <thead>
                <tr>
                  <th scope="col">分類</th>
                  <th scope="col">技術</th>
                  <th scope="col">経験</th>
                  <th scope="col">対応できる内容</th>
                </tr>
              </thead>
              <tbody>
                {content.skills.map((skill) => (
                  <tr key={skill.id}>
                    <td>{skill.category}</td>
                    <td>{skill.technology}</td>
                    <td>{skill.experience}</td>
                    <td>{skill.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )

      case 'careers':
        return (
          <>
            <h2>職務経歴</h2>

            {content.careers.map((career, index) => (
              <section
                key={career.id}
                className={breakClass(
                  index > 0 &&
                    layout.pageBreakBeforeCareerIds.includes(
                      career.id,
                    ),
                )}
              >
                <h3>{career.companyName}</h3>

                <p>
                  {formatMonth(career.startDate)}
                  {' ～ '}
                  {career.ongoing
                    ? '現在'
                    : formatMonth(career.endDate)}
                </p>

                <p>雇用形態：{career.employmentType}</p>
                <p>事業内容：{career.businessDescription}</p>

                {career.projects.map((project) => (
                  <section
                    key={project.id}
                    className={[
                      'career-project',
                      breakClass(
                        layout.pageBreakBeforeProjectIds.includes(
                          project.id,
                        ),
                      ),
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <h4>{project.name}</h4>

                    <p>
                      {formatMonth(project.startDate)}
                      {' ～ '}
                      {project.ongoing
                        ? '現在'
                        : formatMonth(project.endDate)}
                    </p>

                    <dl>
                      <dt>概要</dt>
                      <dd>{project.overview}</dd>

                      <dt>担当業務</dt>
                      <dd>{project.responsibilities}</dd>

                      <dt>成果・工夫</dt>
                      <dd>{project.achievements}</dd>

                      <dt>開発環境</dt>
                      <dd>{project.technologies}</dd>

                      <dt>役割・体制</dt>
                      <dd>
                        {project.role}
                        {project.role && project.teamSize
                          ? ' ／ '
                          : ''}
                        {project.teamSize}
                      </dd>
                    </dl>
                  </section>
                ))}
              </section>
            ))}
          </>
        )

      case 'selfPromotion':
        return (
          <>
            <h2>自己PR</h2>
            <p>{content.selfPromotion}</p>
          </>
        )
    }
  }

  return (
    <article className="career-document">
      <header>
        <h1>職務経歴書</h1>
        <div className="career-meta">
          <p>{formatDate(documentDate)} 現在</p>
          <p>{fullName}</p>
        </div>
      </header>

      {layout.careerSectionOrder.map((sectionId) => {
        const firstCareer = content.careers[0]

        const breakBeforeFirstCareer =
          sectionId === 'careers' &&
          firstCareer !== undefined &&
          layout.pageBreakBeforeCareerIds.includes(
            firstCareer.id,
          )

        const shouldBreak =
          layout.pageBreakBeforeSectionIds.includes(
            sectionId,
          ) || breakBeforeFirstCareer

        return (
          <section
            key={sectionId}
            className={breakClass(shouldBreak)}
          >
            {renderSection(sectionId)}
          </section>
        )
      })}

      <p className="career-end">以上</p>
    </article>
  )
}