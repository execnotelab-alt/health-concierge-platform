'use client'

type Rule = {
  id?: string
  category: string
  name: string
  description: string
  rule_text: string
  enabled: boolean
  priority: number
}

type RuleEditorProps = {
  rule?: Rule
  onSave: (rule: Rule) => void
  onCancel: () => void
}

export default function RuleEditor({ rule, onSave, onCancel }: RuleEditorProps) {
  const isNew = !rule?.id

  return (
    <div className="bg-gray-900/80 border border-gray-700 rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-4">{isNew ? 'New Rule' : 'Edit Rule'}</h3>
      <p className="text-gray-400 text-sm">Rule editor — coming in next milestone</p>
      <div className="flex gap-2 mt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 text-sm hover:bg-gray-700 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
