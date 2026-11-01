import { QuestionType } from '@/models/Quiz'
import { CloseOutlined, CopyOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Checkbox, Input, InputNumber, Radio, Segmented, Tag, Typography } from 'antd'
import { useState } from 'react'
import { QUESTION_TYPE_ICONS } from './questionTypeIcons'
import {
  QUESTION_TYPE_LABELS,
  changeQuestionType,
  createAnswer,
  createOption,
  type DraftQuestion,
} from './quizDraft'

const TYPE_ORDER = [
  QuestionType.SINGLE_CHOICE,
  QuestionType.MULTIPLE_CHOICE,
  QuestionType.TRUE_FALSE,
  QuestionType.SHORT_ANSWER,
]

const AcceptedAnswers = ({
  question,
  onChange,
}: {
  question: DraftQuestion
  onChange: (next: DraftQuestion) => void
}) => {
  const [text, setText] = useState('')

  // Also runs on blur, so a typed answer is not lost when the author clicks Save.
  const commit = () => {
    const value = text.trim()
    if (!value) return
    setText('')
    const isDuplicate = question.acceptedAnswers.some(
      answer => answer.value.trim().toLowerCase() === value.toLowerCase(),
    )
    if (!isDuplicate) {
      onChange({
        ...question,
        acceptedAnswers: [...question.acceptedAnswers, createAnswer(value)],
      })
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Typography.Text strong className="text-sm">
        Đáp án được chấp nhận
      </Typography.Text>
      <Typography.Text type="secondary" className="text-xs">
        Học viên đúng khi nhập khớp một trong các đáp án, không phân biệt hoa thường.
      </Typography.Text>
      <Input
        value={text}
        placeholder="Nhập đáp án rồi nhấn Enter"
        onChange={event => setText(event.target.value)}
        onPressEnter={commit}
        onBlur={commit}
      />
      <div className="flex flex-wrap gap-1.5">
        {question.acceptedAnswers.map(answer => (
          <Tag
            key={answer.key}
            closable
            closeIcon={<CloseOutlined aria-label={`Bỏ đáp án ${answer.value}`} />}
            className="m-0"
            onClose={() =>
              onChange({
                ...question,
                acceptedAnswers: question.acceptedAnswers.filter(item => item.key !== answer.key),
              })
            }
          >
            {answer.value}
          </Tag>
        ))}
      </div>
    </div>
  )
}

const ChoiceOptions = ({
  question,
  onChange,
}: {
  question: DraftQuestion
  onChange: (next: DraftQuestion) => void
}) => {
  const [focusKey, setFocusKey] = useState<string | null>(null)
  const isTrueFalse = question.type === QuestionType.TRUE_FALSE
  const isMultiple = question.type === QuestionType.MULTIPLE_CHOICE

  const setOptions = (options: DraftQuestion['options']) => onChange({ ...question, options })

  const markCorrect = (key: string, checked: boolean) =>
    setOptions(
      question.options.map(option =>
        isMultiple
          ? option.key === key
            ? { ...option, isCorrect: checked }
            : option
          : { ...option, isCorrect: option.key === key },
      ),
    )

  const addOption = () => {
    const option = createOption()
    setFocusKey(option.key)
    setOptions([...question.options, option])
  }

  const handleEnter = (index: number) => {
    const next = question.options[index + 1]
    if (next) setFocusKey(next.key)
    else addOption()
  }

  return (
    <div className="flex flex-col gap-2">
      <Typography.Text strong className="text-sm">
        Đáp án
      </Typography.Text>
      <Typography.Text type="secondary" className="text-xs">
        {isMultiple ? 'Đánh dấu tất cả đáp án đúng.' : 'Chọn một đáp án đúng.'}
      </Typography.Text>
      {question.options.map((option, index) => (
        <div key={option.key} className="flex items-center gap-2">
          {isMultiple ? (
            <Checkbox
              aria-label={`Đáp án ${index + 1} đúng`}
              checked={option.isCorrect}
              onChange={event => markCorrect(option.key, event.target.checked)}
            />
          ) : (
            <Radio
              aria-label={`Đáp án ${index + 1} đúng`}
              checked={option.isCorrect}
              onChange={() => markCorrect(option.key, true)}
            />
          )}
          {isTrueFalse ? (
            <Typography.Text>{option.content}</Typography.Text>
          ) : (
            <>
              <Input
                // Remounts the focused row so autoFocus applies after Enter.
                key={option.key === focusKey ? 'focused' : 'idle'}
                autoFocus={option.key === focusKey}
                value={option.content}
                placeholder={`Đáp án ${index + 1}`}
                aria-label={`Nội dung đáp án ${index + 1}`}
                onChange={event =>
                  setOptions(
                    question.options.map(item =>
                      item.key === option.key ? { ...item, content: event.target.value } : item,
                    ),
                  )
                }
                onPressEnter={() => handleEnter(index)}
              />
              <Button
                type="text"
                size="small"
                aria-label={`Xoá đáp án ${index + 1}`}
                icon={<DeleteOutlined />}
                disabled={question.options.length <= 2}
                onClick={() => setOptions(question.options.filter(item => item.key !== option.key))}
              />
            </>
          )}
        </div>
      ))}
      {!isTrueFalse && (
        <Button
          type="dashed"
          size="small"
          className="self-start"
          icon={<PlusOutlined />}
          onClick={addOption}
        >
          Thêm đáp án
        </Button>
      )}
    </div>
  )
}

export const QuizQuestionForm = ({
  question,
  index,
  onChange,
  onDuplicate,
  onRemove,
}: {
  question: DraftQuestion
  index: number
  onChange: (next: DraftQuestion) => void
  onDuplicate: () => void
  onRemove: () => void
}) => (
  <div className="flex flex-col gap-5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Typography.Text strong className="text-base">
        Câu {index + 1}
      </Typography.Text>
      <div className="flex gap-1">
        <Button size="small" icon={<CopyOutlined />} onClick={onDuplicate}>
          Nhân bản
        </Button>
        <Button size="small" danger icon={<DeleteOutlined />} onClick={onRemove}>
          Xoá
        </Button>
      </div>
    </div>

    <div className="overflow-x-auto">
      <Segmented<QuestionType>
        value={question.type}
        aria-label="Loại câu hỏi"
        onChange={type => onChange(changeQuestionType(question, type))}
        options={TYPE_ORDER.map(type => ({
          value: type,
          label: QUESTION_TYPE_LABELS[type],
          icon: QUESTION_TYPE_ICONS[type],
        }))}
      />
    </div>

    <div className="flex flex-col gap-1.5">
      <label htmlFor={`question-${question.key}`} className="text-sm font-semibold">
        Nội dung câu hỏi
      </label>
      <Input.TextArea
        id={`question-${question.key}`}
        autoSize={{ minRows: 3, maxRows: 10 }}
        value={question.content}
        placeholder="Nhập nội dung câu hỏi"
        onChange={event => onChange({ ...question, content: event.target.value })}
      />
    </div>

    {question.type === QuestionType.SHORT_ANSWER ? (
      <AcceptedAnswers question={question} onChange={onChange} />
    ) : (
      <ChoiceOptions question={question} onChange={onChange} />
    )}

    <div className="flex items-center gap-2">
      <label htmlFor={`points-${question.key}`} className="text-sm font-semibold">
        Điểm
      </label>
      <InputNumber
        id={`points-${question.key}`}
        min={1}
        precision={0}
        className="w-24"
        value={question.points}
        onChange={points => onChange({ ...question, points })}
      />
    </div>
  </div>
)
