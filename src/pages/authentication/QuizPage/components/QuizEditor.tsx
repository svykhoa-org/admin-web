import { useDetail, useUpdate } from '@/hooks'
import { QuestionType } from '@/models/Quiz'
import { getQuizDetail, updateQuiz, type UpdateQuizInput } from '@/services/Quiz'
import type { QuestionInput } from '@/services/Quiz/create'
import { isApiResponseError } from '@/utils/apiResponse'
import { ArrowLeftOutlined, CheckOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import {
  App,
  Button,
  Card,
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
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

const questionTypeOptions = Object.values(QuestionType).map(v => ({
  value: v,
  label: questionTypeLabels[v],
}))

interface QuestionBuilderProps {
  field: { name: number; key: number }
  index: number
  remove: (index: number) => void
  form: ReturnType<typeof Form.useForm>[0]
}

const QuestionBuilder = ({ field, index, remove, form }: QuestionBuilderProps) => {
  const qType = Form.useWatch(['questions', field.name, 'type'], form) as QuestionType | undefined

  return (
    <Card
      size="small"
      title={
        <Space>
          <Typography.Text strong>Câu {index + 1}</Typography.Text>
          {qType && <Tag color="blue">{questionTypeLabels[qType]}</Tag>}
        </Space>
      }
      extra={
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => remove(field.name)}
        >
          Xóa câu
        </Button>
      }
      style={{ marginBottom: 12 }}
    >
      <Row gutter={12}>
        <Col span={14}>
          <Form.Item
            name={[field.name, 'content']}
            label="Nội dung câu hỏi"
            rules={[{ required: true, message: 'Nhập nội dung câu hỏi' }]}
          >
            <Input.TextArea rows={2} placeholder="Nhập nội dung câu hỏi..." />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            name={[field.name, 'type']}
            label="Loại câu hỏi"
            rules={[{ required: true, message: 'Chọn loại' }]}
          >
            <Select options={questionTypeOptions} />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item
            name={[field.name, 'points']}
            label="Điểm"
            rules={[{ required: true, message: 'Nhập điểm' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>

      {(qType === QuestionType.SINGLE_CHOICE ||
        qType === QuestionType.MULTIPLE_CHOICE ||
        qType === QuestionType.TRUE_FALSE) && (
        <Form.List name={[field.name, 'options']}>
          {(optFields, { add: addOpt, remove: removeOpt }) => (
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {qType === QuestionType.SINGLE_CHOICE || qType === QuestionType.TRUE_FALSE
                  ? 'Đánh dấu đúng 1 đáp án'
                  : 'Đánh dấu tất cả đáp án đúng'}
              </Typography.Text>

              {optFields.map((optField, optIdx) => (
                <Row key={optField.key} gutter={8} align="middle">
                  <Col flex="auto">
                    <Form.Item
                      name={[optField.name, 'content']}
                      style={{ margin: 0 }}
                      rules={[{ required: true, message: 'Nhập đáp án' }]}
                    >
                      <Input placeholder={`Đáp án ${optIdx + 1}`} />
                    </Form.Item>
                  </Col>
                  <Col>
                    <Form.Item
                      name={[optField.name, 'isCorrect']}
                      valuePropName="checked"
                      style={{ margin: 0 }}
                    >
                      <Checkbox>Đúng</Checkbox>
                    </Form.Item>
                  </Col>
                  <Col>
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      disabled={optFields.length <= 2}
                      onClick={() => removeOpt(optField.name)}
                    />
                  </Col>
                </Row>
              ))}

              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={() =>
                  addOpt({ content: '', isCorrect: false, order: optFields.length + 1 })
                }
              >
                Thêm đáp án
              </Button>
            </Space>
          )}
        </Form.List>
      )}

      {qType === QuestionType.SHORT_ANSWER && (
        <Form.List name={[field.name, 'acceptedAnswers']}>
          {(ansFields, { add: addAns, remove: removeAns }) => (
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Đáp án hợp lệ — khớp 1 trong các giá trị (không phân biệt hoa/thường)
              </Typography.Text>

              {ansFields.map(ansField => (
                <Row key={ansField.key} gutter={8} align="middle">
                  <Col flex="auto">
                    <Form.Item
                      name={[ansField.name, 'value']}
                      style={{ margin: 0 }}
                      rules={[{ required: true, message: 'Nhập đáp án' }]}
                    >
                      <Input placeholder="Ví dụ: dependency injection" />
                    </Form.Item>
                  </Col>
                  <Col>
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      disabled={ansFields.length <= 1}
                      onClick={() => removeAns(ansField.name)}
                    />
                  </Col>
                </Row>
              ))}

              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => addAns({ value: '' })}
              >
                Thêm đáp án chấp nhận
              </Button>
            </Space>
          )}
        </Form.List>
      )}
    </Card>
  )
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

  const [settingsForm] = Form.useForm()
  const [questionsForm] = Form.useForm()

  useEffect(() => {
    void executeDetail(quizId)
  }, [executeDetail, quizId])

  useEffect(() => {
    if (!quiz) return
    settingsForm.setFieldsValue({
      title: quiz.title,
      passingScore: quiz.passingScore,
      maxAttempts: quiz.maxAttempts ?? undefined,
      timeLimit: quiz.timeLimit ?? undefined,
    })
    questionsForm.setFieldsValue({
      questions: (quiz.questions ?? []).map(q => ({
        content: q.content,
        type: q.type,
        order: q.order,
        points: q.points,
        options: q.options?.map(o => ({
          content: o.content,
          isCorrect: o.isCorrect,
          order: o.order,
        })),
        acceptedAnswers: q.acceptedAnswers?.map(a => ({ value: a.value })),
      })),
    })
  }, [quiz, settingsForm, questionsForm])

  const handleSaveSettings = async () => {
    try {
      const values = await settingsForm.validateFields()
      await updateRequest.execute(quizId, {
        title: values.title as string,
        passingScore: values.passingScore as number,
        maxAttempts: (values.maxAttempts as number | undefined) || undefined,
        timeLimit: (values.timeLimit as number | undefined) || undefined,
      })
      void message.success('Cập nhật cài đặt quiz thành công')
      void executeDetail(quizId)
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) return
      void message.error(isApiResponseError(err) ? err.message : 'Có lỗi xảy ra')
    }
  }

  const handleSaveQuestions = async () => {
    try {
      const values = await questionsForm.validateFields()
      const rawQuestions = (values.questions ?? []) as QuestionInput[]
      const enriched = rawQuestions.map((q, qIdx) => ({
        ...q,
        order: q.order ?? qIdx + 1,
        options: q.options?.map((opt, oIdx) => ({ ...opt, order: oIdx + 1 })),
      }))
      await updateRequest.execute(quizId, { questions: enriched })
      void message.success('Cập nhật câu hỏi thành công')
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
        <Form form={settingsForm} layout="vertical">
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

      {/* Questions — editable */}
      <Card
        title={`Danh sách câu hỏi (${quiz.questions?.length ?? 0})`}
        extra={
          <Button
            type="primary"
            icon={<CheckOutlined />}
            loading={updateRequest.isLoading}
            onClick={handleSaveQuestions}
          >
            Lưu câu hỏi
          </Button>
        }
      >
        <Form form={questionsForm} layout="vertical">
          <Form.List name="questions">
            {(fields, { add, remove }) => (
              <>
                {fields.length === 0 && (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '24px 0',
                      color: '#999',
                      border: '1px dashed #d9d9d9',
                      borderRadius: 8,
                      marginBottom: 12,
                    }}
                  >
                    <Typography.Text type="secondary">
                      Chưa có câu hỏi nào. Bấm &quot;Thêm câu hỏi&quot; để bắt đầu.
                    </Typography.Text>
                  </div>
                )}

                {fields.map((field, index) => (
                  <QuestionBuilder
                    key={field.key}
                    field={field}
                    index={index}
                    remove={remove}
                    form={questionsForm}
                  />
                ))}

                <Button
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  onClick={() =>
                    add({
                      type: QuestionType.SINGLE_CHOICE,
                      order: fields.length + 1,
                      points: 10,
                      options: [
                        { content: '', isCorrect: true, order: 1 },
                        { content: '', isCorrect: false, order: 2 },
                      ],
                    })
                  }
                >
                  Thêm câu hỏi
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Card>
    </Space>
  )
}
