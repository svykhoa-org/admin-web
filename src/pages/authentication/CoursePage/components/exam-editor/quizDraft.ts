import { QuestionType, type Quiz } from '@/models/Quiz'
import type { QuestionInput } from '@/services/Quiz'

export interface DraftOption {
  key: string
  id?: string
  content: string
  isCorrect: boolean
}

export interface DraftAnswer {
  key: string
  id?: string
  value: string
}

// `key` identifies a row on screen; `id` is the stored row and tells the server
// to update it rather than insert a copy.
export interface DraftQuestion {
  key: string
  id?: string
  content: string
  type: QuestionType
  points: number | null
  options: DraftOption[]
  acceptedAnswers: DraftAnswer[]
}

export interface DraftSettings {
  title: string
  passingScore: number | null
  maxAttempts: number | null
  timeLimit: number | null
}

export interface QuizIssue {
  // Null for a problem in the Settings tab.
  questionKey: string | null
  message: string
}

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  [QuestionType.SINGLE_CHOICE]: 'Một đáp án',
  [QuestionType.MULTIPLE_CHOICE]: 'Nhiều đáp án',
  [QuestionType.TRUE_FALSE]: 'Đúng/Sai',
  [QuestionType.SHORT_ANSWER]: 'Trả lời ngắn',
}

const newKey = () => crypto.randomUUID()

const blankOption = (): DraftOption => ({ key: newKey(), content: '', isCorrect: false })

export const createOption = blankOption

export const createAnswer = (value: string): DraftAnswer => ({ key: newKey(), value })

const trueFalseOptions = (): DraftOption[] => [
  { key: newKey(), content: 'Đúng', isCorrect: true },
  { key: newKey(), content: 'Sai', isCorrect: false },
]

export const createQuestion = (): DraftQuestion => ({
  key: newKey(),
  content: '',
  type: QuestionType.SINGLE_CHOICE,
  points: 1,
  options: [{ ...blankOption(), isCorrect: true }, blankOption()],
  acceptedAnswers: [],
})

export const toDraftQuestions = (quiz: Quiz): DraftQuestion[] =>
  (quiz.questions ?? []).map(question => ({
    key: newKey(),
    id: question.id,
    content: question.content,
    type: question.type,
    points: question.points,
    options: (question.options ?? []).map(option => ({
      key: newKey(),
      id: option.id,
      content: option.content,
      isCorrect: option.isCorrect,
    })),
    acceptedAnswers: (question.acceptedAnswers ?? []).map(answer => ({
      key: newKey(),
      id: answer.id,
      value: answer.value,
    })),
  }))

export const toDraftSettings = (quiz: Quiz): DraftSettings => ({
  title: quiz.title,
  passingScore: quiz.passingScore,
  maxAttempts: quiz.maxAttempts ?? null,
  timeLimit: quiz.timeLimit ?? null,
})

/** Answers of the other kind stay in the draft, so switching back restores them. */
export const changeQuestionType = (question: DraftQuestion, type: QuestionType): DraftQuestion => {
  if (type === QuestionType.SHORT_ANSWER) return { ...question, type }
  if (type === QuestionType.TRUE_FALSE) {
    const isAlreadyTrueFalse = question.type === QuestionType.TRUE_FALSE
    return {
      ...question,
      type,
      options: isAlreadyTrueFalse ? question.options : trueFalseOptions(),
    }
  }

  const options = [...question.options]
  while (options.length < 2) options.push(blankOption())
  if (type === QuestionType.MULTIPLE_CHOICE) return { ...question, type, options }

  const firstCorrect = Math.max(
    options.findIndex(option => option.isCorrect),
    0,
  )
  return {
    ...question,
    type,
    options: options.map((option, index) => ({ ...option, isCorrect: index === firstCorrect })),
  }
}

/** Drops every id: the copy must be inserted, not overwrite the original. */
export const duplicateQuestion = (question: DraftQuestion): DraftQuestion => ({
  ...question,
  key: newKey(),
  id: undefined,
  options: question.options.map(option => ({ ...option, key: newKey(), id: undefined })),
  acceptedAnswers: question.acceptedAnswers.map(answer => ({
    ...answer,
    key: newKey(),
    id: undefined,
  })),
})

export const getQuestionIssues = (question: DraftQuestion): string[] => {
  const issues: string[] = []
  if (!question.content.trim()) issues.push('chưa có nội dung')
  if (!question.points || question.points < 1) issues.push('điểm phải từ 1 trở lên')

  if (question.type === QuestionType.SHORT_ANSWER) {
    if (!question.acceptedAnswers.some(answer => answer.value.trim())) {
      issues.push('chưa có đáp án được chấp nhận')
    }
    return issues
  }

  if (question.options.length < 2) issues.push('cần ít nhất 2 đáp án')
  if (question.options.some(option => !option.content.trim())) issues.push('có đáp án còn trống')
  const correctCount = question.options.filter(option => option.isCorrect).length
  if (correctCount === 0) issues.push('chưa chọn đáp án đúng')
  if (question.type !== QuestionType.MULTIPLE_CHOICE && correctCount > 1) {
    issues.push('chỉ được chọn một đáp án đúng')
  }
  return issues
}

export const getQuizIssues = (
  settings: DraftSettings,
  questions: DraftQuestion[],
  isLinked: boolean,
): QuizIssue[] => {
  const issues: QuizIssue[] = []
  const addSetting = (message: string) => issues.push({ questionKey: null, message })

  if (!settings.title.trim()) addSetting('Cài đặt: chưa có tên bài kiểm tra')
  if (settings.passingScore === null) addSetting('Cài đặt: chưa nhập điểm đạt')
  // A linked quiz with no questions would give learners a lesson they cannot pass.
  if (isLinked && questions.length === 0) {
    addSetting('Bài kiểm tra đang gắn vào bài học nên phải có ít nhất một câu hỏi')
  }

  questions.forEach((question, index) => {
    getQuestionIssues(question).forEach(message =>
      issues.push({ questionKey: question.key, message: `Câu ${index + 1}: ${message}` }),
    )
  })
  return issues
}

export const toQuestionInputs = (questions: DraftQuestion[]): QuestionInput[] =>
  questions.map((question, index) => {
    const isShortAnswer = question.type === QuestionType.SHORT_ANSWER
    return {
      id: question.id,
      content: question.content.trim(),
      type: question.type,
      order: index + 1,
      points: question.points ?? 1,
      // An empty list makes the server soft-delete rows of the other kind.
      options: isShortAnswer
        ? []
        : question.options.map((option, optionIndex) => ({
            id: option.id,
            content: option.content.trim(),
            isCorrect: option.isCorrect,
            order: optionIndex + 1,
          })),
      acceptedAnswers: isShortAnswer
        ? question.acceptedAnswers.map(answer => ({ id: answer.id, value: answer.value.trim() }))
        : [],
    }
  })
