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
            <table className="career-skills-table">
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
                className={[
                  'career-company',
                  breakClass(
                    index > 0 &&
                      layout.pageBreakBeforeCareerIds.includes(career.id),
                  ),
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <h3>{career.companyName}</h3>

                <table className="career-detail-table">
                  <colgroup>
                    <col className="career-label-column" />
                    <col className="career-value-column" />
                    <col className="career-label-column" />
                    <col className="career-value-column" />
                  </colgroup>
                  <tbody>
                    <tr>
                      <th scope="row">在籍期間</th>
                      <td>
                        {formatMonth(career.startDate)}
                        {' ～ '}
                        {career.ongoing
                          ? '現在'
                          : formatMonth(career.endDate)}
                      </td>
                      <th scope="row">雇用形態</th>
                      <td>{career.employmentType}</td>
                    </tr>
                    <tr className="career-long-row">
                      <th scope="row">事業内容</th>
                      <td colSpan={3}>{career.businessDescription}</td>
                    </tr>
                  </tbody>
                </table>

                {career.projects.map((project) => (
                  <section
                    key={project.id}
                    className={[
                      'career-project',
                      breakClass(
                        layout.pageBreakBeforeProjectIds.includes(project.id),
                      ),
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <h4>{project.name}</h4>

                    <table className="career-detail-table">
                      <colgroup>
                        <col className="career-label-column" />
                        <col className="career-value-column" />
                        <col className="career-label-column" />
                        <col className="career-value-column" />
                      </colgroup>
                      <tbody>
                        <tr>
                          <th scope="row">期間</th>
                          <td colSpan={3}>
                            {formatMonth(project.startDate)}
                            {' ～ '}
                            {project.ongoing
                              ? '現在'
                              : formatMonth(project.endDate)}
                          </td>
                        </tr>

                        <tr>
                          <th scope="row">役割</th>
                          <td>{project.role}</td>
                          <th scope="row">チーム規模</th>
                          <td>{project.teamSize}</td>
                        </tr>

                        <tr className="career-long-row">
                          <th scope="row">概要</th>
                          <td colSpan={3}>{project.overview}</td>
                        </tr>

                        <tr className="career-long-row">
                          <th scope="row">担当業務</th>
                          <td colSpan={3}>{project.responsibilities}</td>
                        </tr>

                        <tr className="career-long-row">
                          <th scope="row">成果・工夫</th>
                          <td colSpan={3}>{project.achievements}</td>
                        </tr>

                        <tr className="career-long-row">
                          <th scope="row">開発環境</th>
                          <td colSpan={3}>{project.technologies}</td>
                        </tr>
                      </tbody>
                    </table>
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