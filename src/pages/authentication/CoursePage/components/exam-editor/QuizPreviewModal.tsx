import { QuestionType } from '@/models/Quiz'
import { Checkbox, Input, Modal, Radio, Typography } from 'antd'
import type { DraftQuestion, DraftSettings } from './quizDraft'

/** The learner's view of the current draft: read-only, hides answers, creates no attempt. */
export const QuizPreviewModal = ({
  open,
  settings,
  questions,
  onClose,
}: {
  open: boolean
  settings: DraftSettings
  questions: DraftQuestion[]
  onClose: () => void
}) => (
  <Modal
    title={`Xem trước: ${settings.title}`}
    open={open}
    width={720}
    footer={null}
    onCancel={onClose}
    destroyOnHidden
  >
    <div className="flex flex-col gap-5 pt-2">
      <Typography.Text type="secondary" className="text-sm">
        {questions.length} câu · Điểm đạt {settings.passingScore ?? 0}% ·{' '}
        {settings.timeLimit ? `${settings.timeLimit} phút` : 'Không giới hạn thời gian'} ·{' '}
        {settings.maxAttempts ? `Tối đa ${settings.maxAttempts} lượt` : 'Không giới hạn lượt'}
      </Typography.Text>
      {questions.length === 0 && <Typography.Text>Chưa có câu hỏi nào.</Typography.Text>}
      {questions.map((question, index) => (
        <div key={question.key} className="flex flex-col gap-2">
          <Typography.Text strong className="whitespace-pre-wrap">
            Câu {index + 1}. {question.content}
          </Typography.Text>
          {question.type === QuestionType.SHORT_ANSWER ? (
            <Input disabled placeholder="Câu trả lời của học viên" />
          ) : (
            question.options.map(option =>
              question.type === QuestionType.MULTIPLE_CHOICE ? (
                <Checkbox key={option.key} disabled checked={false}>
                  {option.content}
                </Checkbox>
              ) : (
                <Radio key={option.key} disabled checked={false}>
                  {option.content}
                </Radio>
              ),
            )
          )}
        </div>
      ))}
    </div>
  </Modal>
)
