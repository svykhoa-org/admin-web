import { QuestionType } from '@/models/Quiz'
import {
  CheckCircleOutlined,
  CheckSquareOutlined,
  EditOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'

export const QUESTION_TYPE_ICONS: Record<QuestionType, ReactNode> = {
  [QuestionType.SINGLE_CHOICE]: <CheckCircleOutlined />,
  [QuestionType.MULTIPLE_CHOICE]: <CheckSquareOutlined />,
  [QuestionType.TRUE_FALSE]: <SwapOutlined />,
  [QuestionType.SHORT_ANSWER]: <EditOutlined />,
}
