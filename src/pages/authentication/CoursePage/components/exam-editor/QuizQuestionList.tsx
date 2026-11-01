import { HolderOutlined, PlusOutlined, WarningFilled } from '@ant-design/icons'
import type { DragEndEvent } from '@dnd-kit/core'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Button, Tooltip, Typography, theme } from 'antd'
import { useSortableItem } from '../useSortableItem'
import { QUESTION_TYPE_ICONS } from './questionTypeIcons'
import { getQuestionIssues, QUESTION_TYPE_LABELS, type DraftQuestion } from './quizDraft'

const QuestionRow = ({
  question,
  index,
  isSelected,
  onSelect,
}: {
  question: DraftQuestion
  index: number
  isSelected: boolean
  onSelect: () => void
}) => {
  const { token } = theme.useToken()
  const { setNodeRef, style, handleProps } = useSortableItem(question.key)
  const issues = getQuestionIssues(question)

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: isSelected ? token.controlItemBgActive : undefined,
      }}
      className="flex items-center gap-1 rounded-lg pr-2"
    >
      <button
        type="button"
        aria-label={`Kéo để đổi vị trí câu ${index + 1}`}
        className="cursor-grab border-0 bg-transparent px-1.5 py-3 text-xs opacity-50"
        {...handleProps}
      >
        <HolderOutlined />
      </button>
      <button
        type="button"
        aria-current={isSelected}
        onClick={onSelect}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 border-0 bg-transparent py-2 text-left"
      >
        <span className="w-5 shrink-0 text-right text-xs font-semibold">{index + 1}</span>
        <Tooltip title={QUESTION_TYPE_LABELS[question.type]}>
          <span style={{ color: token.colorTextSecondary }}>
            {QUESTION_TYPE_ICONS[question.type]}
          </span>
        </Tooltip>
        <Typography.Text ellipsis className="min-w-0 flex-1 text-sm">
          {question.content.trim() || (
            <Typography.Text type="secondary">Câu hỏi chưa có nội dung</Typography.Text>
          )}
        </Typography.Text>
        {issues.length > 0 && (
          <Tooltip title={issues.join(', ')}>
            <WarningFilled aria-label="Câu hỏi chưa hợp lệ" style={{ color: token.colorWarning }} />
          </Tooltip>
        )}
        <Typography.Text type="secondary" className="shrink-0 text-xs">
          {question.points ?? 0}đ
        </Typography.Text>
      </button>
    </div>
  )
}

export const QuizQuestionList = ({
  questions,
  selectedKey,
  onSelect,
  onReorder,
  onAdd,
}: {
  questions: DraftQuestion[]
  selectedKey: string | null
  onSelect: (key: string) => void
  onReorder: (questions: DraftQuestion[]) => void
  onAdd: () => void
}) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const totalPoints = questions.reduce((sum, question) => sum + (question.points ?? 0), 0)

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const oldIndex = questions.findIndex(question => question.key === active.id)
    const newIndex = questions.findIndex(question => question.key === over.id)
    if (oldIndex >= 0 && newIndex >= 0) onReorder(arrayMove(questions, oldIndex, newIndex))
  }

  return (
    <div className="flex flex-col gap-3">
      <Typography.Text type="secondary" className="text-xs">
        {questions.length} câu · {totalPoints} điểm
      </Typography.Text>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={questions.map(question => question.key)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-0.5">
            {questions.map((question, index) => (
              <QuestionRow
                key={question.key}
                question={question}
                index={index}
                isSelected={question.key === selectedKey}
                onSelect={() => onSelect(question.key)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <Button block type="dashed" icon={<PlusOutlined />} onClick={onAdd}>
        Thêm câu hỏi
      </Button>
    </div>
  )
}
