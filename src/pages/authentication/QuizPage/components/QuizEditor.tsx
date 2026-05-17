import { useDetail, useUpdate } from '@/hooks'
import { QuestionType } from '@/models/Quiz'
import { getQuizDetail, updateQuiz, type UpdateQuizInput } from '@/services/Quiz'
import { isApiResponseError } from '@/utils/apiResponse'
import { ArrowLeftOutlined, CheckOutlined } from '@ant-design/icons'
import {
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd'
import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const questionTypeLabels: Record<QuestionType, string> = {
  [QuestionType.SINGLE_CHOICE]: 'Một đáp án',
  [QuestionType.MULTIPLE_CHOICE]: 'Nhiều đáp án',
  [QuestionType.TRUE_FALSE]: 'Đúng/Sai',
  [QuestionType.SHORT_ANSWER]: 'Tự luận',
}

interface Props {
  quizId: string
}

export const QuizEditor = ({ quizId }: Props) => {
  const navigate = useNavigate()
  const { message } = App.useApp()

  const fetchDetail = useCallback((id: string) => getQuizDetail({ id }), [])
  const updateById = useCallback(
    (id: string, payload: UpdateQuizInput) => updateQuiz({ id, ...payload }),
    [],
  )

  const detailRequest = useDetail(fetchDetail)
  const updateRequest = useUpdate(updateById)
  const { execute: executeDetail, data: quiz, isLoading } = detailRequest

  const [form] = Form.useForm()

  useEffect(() => {
    void executeDetail(quizId)
  }, [executeDetail, quizId])

  useEffect(() => {
    if (!quiz) return
    form.setFieldsValue({
      title: quiz.title,
      passingScore: quiz.passingScore,
      maxAttempts: quiz.maxAttempts ?? undefined,
      timeLimit: quiz.timeLimit ?? undefined,
    })
  }, [quiz, form])

  const handleSaveSettings = async () => {
    try {
      const values = await form.validateFields()
      await updateRequest.execute(quizId, {
        title: values.title as string,
        passingScore: values.passingScore as number,
        maxAttempts: (values.maxAttempts as number | undefined) || undefined,
        timeLimit: (values.timeLimit as number | undefined) || undefined,
      })
      void message.success('Cập nhật quiz thành công')
      void executeDetail(quizId)
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) return
      void message.error(isApiResponseError(err) ? err.message : 'Có lỗi xảy ra')
    }
  }

  if (isLoading && !quiz) {
    return (
      <div className="flex justify-center py-20">
        <Spin size="large" />
      </div>
    )
  }

  if (!quiz) return null

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {/* Header */}
      <Card>
        <Space>
          <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate(-1)} />
          <Typography.Title level={4} style={{ margin: 0 }}>
            Quiz: {quiz.title}
          </Typography.Title>
          <Tag>{quiz.questions?.length ?? 0} câu hỏi</Tag>
        </Space>
      </Card>

      {/* Settings */}
      <Card title="Cài đặt Quiz">
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="Tiêu đề quiz"
                rules={[{ required: true, message: 'Nhập tiêu đề' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="passingScore" label="Điểm đạt (%)" rules={[{ required: true }]}>
                <InputNumber min={0} max={100} style={{ width: '100%' }} addonAfter="%" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="maxAttempts" label="Số lần thử">
                <InputNumber min={1} style={{ width: '100%' }} placeholder="Không giới hạn" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="timeLimit" label="Giới hạn thời gian">
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="Không giới hạn"
                  addonAfter="giây"
                />
              </Form.Item>
            </Col>
          </Row>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            loading={updateRequest.isLoading}
            onClick={handleSaveSettings}
          >
            Lưu cài đặt
          </Button>
        </Form>
      </Card>

      {/* Questions — read only */}
      <Card
        title={`Danh sách câu hỏi (${quiz.questions?.length ?? 0})`}
        extra={
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Để sửa câu hỏi: xoá bài học quiz và tạo lại
          </Typography.Text>
        }
      >
        {(quiz.questions ?? []).map((question, index) => (
          <Card
            key={question.id}
            size="small"
            style={{ marginBottom: 12 }}
            title={
              <Space>
                <Tag>{index + 1}</Tag>
                <Tag color="blue">{questionTypeLabels[question.type]}</Tag>
                <Typography.Text>{question.content}</Typography.Text>
                <Tag>{question.points} điểm</Tag>
              </Space>
            }
          >
            {(question.type === QuestionType.SINGLE_CHOICE ||
              question.type === QuestionType.MULTIPLE_CHOICE ||
              question.type === QuestionType.TRUE_FALSE) &&
              (question.options ?? []).map(opt => (
                <div key={opt.id} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                  <Tag color={opt.isCorrect ? 'green' : 'default'}>
                    {opt.isCorrect ? 'Đúng' : 'Sai'}
                  </Tag>
                  <Typography.Text>{opt.content}</Typography.Text>
                </div>
              ))}
            {question.type === QuestionType.SHORT_ANSWER && (
              <Space wrap>
                <Typography.Text type="secondary">Đáp án chấp nhận:</Typography.Text>
                {(question.acceptedAnswers ?? []).map(a => (
                  <Tag key={a.id} color="cyan">
                    {a.value}
                  </Tag>
                ))}
              </Space>
            )}
          </Card>
        ))}
      </Card>
    </Space>
  )
}
