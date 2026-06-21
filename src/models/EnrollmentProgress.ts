import type { AbstractModel } from './AbstractModel'
import type { Enrollment } from './Enrollment'
import type { LessonType } from './Course'

export enum LessonProgressStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum QuizAttemptStatus {
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
}

export interface SnapshotOption {
  id: string
  content: string
  order: number
  isCorrect: boolean
}

export interface SnapshotAnswerRecord {
  questionId: string
  questionContent: string
  questionType: string
  maxPoints: number
  allOptions: SnapshotOption[]
  selectedOptionIds: string[] | null
  textAnswer: string | null
  isCorrect: boolean
  pointsEarned: number
}

export interface QuizAttempt extends AbstractModel {
  quizId: string
  userId: string
  attemptNumber: number
  status: QuizAttemptStatus
  score: number
  isPassed: boolean
  startedAt: string
  submittedAt: string | null
  answers: SnapshotAnswerRecord[] | null
}

export interface LessonProgress extends AbstractModel {
  enrollmentId: string
  userId: string
  lessonId: string
  moduleId: string
  courseId: string
  status: LessonProgressStatus
  startedAt: string | null
  completedAt: string | null
  watchedSeconds: number
}

export type ProctoringSnapshotStatus = 'submitted' | 'declined' | 'timeout'

export interface ProctoringSnapshotDetail {
  id: string
  url: string | null
  status: ProctoringSnapshotStatus
  videoPositionSeconds: number
  capturedAt: string
}

export interface LessonProgressDetail {
  lessonId: string
  title: string
  type: LessonType
  order: number
  durationMinutes: number
  isRequired: boolean
  progress: LessonProgress | null
  quizAttempts: QuizAttempt[] | null
  proctoringSnapshots: ProctoringSnapshotDetail[] | null
}

export interface ModuleProgressDetail {
  id: string
  title: string
  order: number
  locked: boolean
  lessons: LessonProgressDetail[]
}

export interface EnrollmentProgress {
  enrollment: Enrollment
  modules: ModuleProgressDetail[]
}
