import type { CareerHistoryContent } from '../types/documents'

export const sampleCareer: CareerHistoryContent = {
  summary:
    '業務用Webアプリケーションのフロントエンド開発を担当。' +
    'React・TypeScriptを使用した画面実装、入力チェック、' +
    '不具合の調査と修正に取り組んできました。',

  skills: [
    {
      id: 'skill-001',
      category: '言語',
      technology: 'TypeScript',
      experience: '1年',
      description: '型定義、フォーム処理、APIレスポンスの取り扱い',
    },
    {
      id: 'skill-002',
      category: 'フレームワーク',
      technology: 'React',
      experience: '1年',
      description: 'コンポーネント作成、状態管理、画面の実装',
    },
  ],

  careers: [
    {
      id: 'career-001',
      companyName: '株式会社サンプル開発（架空）',
      startDate: '2024-04',
      endDate: '',
      ongoing: true,
      employmentType: '正社員',
      businessDescription: '企業向け業務システムの開発',
      projects: [
        {
          id: 'project-001',
          name: '社内申請管理システム',
          startDate: '2025-04',
          endDate: '2026-03',
          ongoing: false,
          overview:
            '社内の各種申請をオンラインで管理するシステムの改修。',
          responsibilities:
            '・申請フォームと一覧画面の実装\n' +
            '・入力内容のチェックとエラー表示\n' +
            '・不具合の再現条件の調査と修正',
          achievements:
            '入力エラーが発生した項目を画面上で明示し、' +
            '利用者が修正箇所を判断しやすい表示へ改善しました。',
          technologies: 'React / TypeScript / CSS / Git',
          role: 'フロントエンド開発',
          teamSize: '5名',
        },
      ],
    },
  ],

  selfPromotion:
    '不具合の修正では、発生条件を整理して原因を確認し、' +
    '関連する操作への影響も確認することを心がけています。\n' +
    '画面を利用する人の操作手順を踏まえ、' +
    '入力しやすさとエラーの分かりやすさを意識して実装しています。',
}