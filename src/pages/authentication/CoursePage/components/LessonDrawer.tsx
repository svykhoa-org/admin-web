import { DocumentSelect } from '@/components/SelectionVariants'
import { LessonType, type Lesson } from '@/models/Course'
import { createLesson, updateLesson } from '@/services/Lesson'
import { createQuiz, type QuestionInput } from '@/services/Quiz'
import { confirmVideoUpload, requestVideoUpload } from '@/services/Video'
import { isApiResponseError } from '@/utils/apiResponse'
import ENV from '@/constants/env'
import {
  CheckCircleOutlined,
  DeleteOutlined,
  InboxOutlined,
  LoadingOutlined,
  PlusOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import {
  Alert,
  App,
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Drawer,
  Form,
  Input,
  InputNumber,
  Progress,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
  Upload,
} from 'antd'
import type { FormInstance, UploadProps } from 'antd'
import axios from 'axios'
import { useEffect, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  mode: 'create' | 'edit'
  moduleId: string
  initialData?: Lesson
  onClose: () => void
  onSaved: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const lessonTypeOptions = [
  { label: 'Video', value: LessonType.VIDEO },
  { label: 'Tài liệu', value: LessonType.DOCUMENT },
  { label: 'Quiz', value: LessonType.QUIZ },
]

const questionTypeOptions = [
  { label: 'Một đáp án đúng', value: 'single_choice' },
  { label: 'Nhiều đáp án đúng', value: 'multiple_choice' },
  { label: 'Tự luận', value: 'short_answer' },
]

const lessonTypeColorMap: Record<LessonType, string> = {
  [LessonType.VIDEO]: 'blue',
  [LessonType.DOCUMENT]: 'green',
  [LessonType.QUIZ]: 'purple',
}

const lessonTypeLabelMap: Record<LessonType, string> = {
  [LessonType.VIDEO]: 'Video',
  [LessonType.DOCUMENT]: 'Tài liệu',
  [LessonType.QUIZ]: 'Quiz',
}

// ─── Video Upload Section ─────────────────────────────────────────────────────

type VideoStatus = 'idle' | 'uploading' | 'confirming' | 'done' | 'error'

interface VideoUploadSectionProps {
  existingVideoId?: string
  onVideoReady: (videoId: string) => void
}

const VideoUploadSection = ({ existingVideoId, onVideoReady }: VideoUploadSectionProps) => {
  const { message } = App.useApp()
  const [uploadStatus, setUploadStatus] = useState<VideoStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleCustomRequest: UploadProps['customRequest'] = async options => {
    const file = options.file as File
    setErrorMsg('')
    setUploadStatus('uploading')
    setProgress(0)

    try {
      // 1. Request upload — server trả về videoId + uploadUrl (relative path có presigned params)
      const { videoId, uploadUrl } = await requestVideoUpload({ filename: file.name })
      setUploadedVideoId(videoId)

      // 2. Upload thẳng lên MinIO: VITE_API_FILE_URL làm base + uploadUrl là relative path có chữ ký
      const minioUploadUrl = `${ENV.API_FILE_URL}${uploadUrl}`
      await axios.put(minioUploadUrl, file, {
        headers: { 'Content-Type': file.type || 'video/mp4' },
        onUploadProgress: event => {
          const pct = Math.round((event.loaded / (event.total ?? file.size)) * 100)
          setProgress(pct)
        },
      })

      // 3. Confirm upload
      setUploadStatus('confirming')
      await confirmVideoUpload({ id: videoId })

      setUploadStatus('done')
      onVideoReady(videoId)
      options.onSuccess?.({})
    } catch (err) {
      setUploadStatus('error')
      const msg = isApiResponseError(err) ? err.message : 'Upload thất bại. Vui lòng thử lại.'
      setErrorMsg(msg)
      void message.error(msg)
      options.onError?.(new Error(msg))
    }
  }

  const isUploading = uploadStatus === 'uploading' || uploadStatus === 'confirming'

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      {/* Existing video info */}
      {existingVideoId && uploadStatus === 'idle' && (
        <Alert
          type="info"
          showIcon
          icon={<VideoCameraOutlined />}
          message="Video hiện tại"
          description={
            <Typography.Text code copyable>
              {existingVideoId}
            </Typography.Text>
          }
        />
      )}

      {/* Upload success */}
      {uploadStatus === 'done' && uploadedVideoId && (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          message="Upload thành công!"
          description={
            <Space direction="vertical" size={4}>
              <span>
                Video ID:{' '}
                <Typography.Text code copyable>
                  {uploadedVideoId}
                </Typography.Text>
              </span>
              <Typography.Text type="secondary">
                Video đang được hệ thống xử lý HLS. Trạng thái sẽ chuyển sang &quot;ready&quot; sau
                khi worker xử lý xong.
              </Typography.Text>
            </Space>
          }
        />
      )}

      {/* Dropzone */}
      <Upload.Dragger
        name="video"
        multiple={false}
        maxCount={1}
        accept="video/*"
        showUploadList={false}
        disabled={isUploading}
        customRequest={handleCustomRequest}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          {uploadStatus === 'done'
            ? 'Upload video khác để thay thế'
            : 'Kéo thả file video vào đây hoặc bấm để chọn'}
        </p>
        <p className="ant-upload-hint">
          Hỗ trợ MP4, MOV, AVI, MKV. File được upload trực tiếp lên MinIO.
        </p>
      </Upload.Dragger>

      {/* Progress */}
      {uploadStatus === 'uploading' && (
        <div>
          <Space style={{ marginBottom: 4 }}>
            <Typography.Text type="secondary">Đang upload lên MinIO...</Typography.Text>
            <Typography.Text type="secondary">{progress}%</Typography.Text>
          </Space>
          <Progress percent={progress} status="active" />
        </div>
      )}

      {/* Confirming */}
      {uploadStatus === 'confirming' && (
        <Alert
          type="info"
          showIcon
          icon={<LoadingOutlined spin />}
          message="Đang xác nhận upload với server..."
        />
      )}

      {/* Error */}
      {uploadStatus === 'error' && errorMsg && <Alert type="error" showIcon message={errorMsg} />}
    </Space>
  )
}

// ─── Question Builder ─────────────────────────────────────────────────────────

interface QuestionBuilderProps {
  field: { name: number; key: number }
  index: number
  remove: (index: number) => void
  form: FormInstance
}

const QuestionBuilder = ({ field, index, remove, form }: QuestionBuilderProps) => {
  const qType = Form.useWatch(['quiz', 'questions', field.name, 'type'], form) as string | undefined

  return (
    <Card
      size="small"
      title={
        <Space>
          <Typography.Text strong>Câu {index + 1}</Typography.Text>
          {qType && (
            <Tag color={qType === 'short_answer' ? 'orange' : 'blue'}>
              {questionTypeOptions.find(o => o.value === qType)?.label ?? qType}
            </Tag>
          )}
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

      {/* Choice options */}
      {(qType === 'single_choice' || qType === 'multiple_choice') && (
        <Form.List name={[field.name, 'options']}>
          {(optFields, { add: addOpt, remove: removeOpt }) => (
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {qType === 'single_choice'
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

      {/* Short answer */}
      {qType === 'short_answer' && (
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

// ─── Main Drawer ──────────────────────────────────────────────────────────────

export const LessonDrawer = ({ open, mode, moduleId, initialData, onClose, onSaved }: Props) => {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [isSaving, setIsSaving] = useState(false)
  const [videoId, setVideoId] = useState<string | undefined>(undefined)

  const lessonType = Form.useWatch('type', form) as LessonType | undefined

  // Populate / reset form when drawer opens
  useEffect(() => {
    if (!open) return

    if (mode === 'edit' && initialData) {
      form.setFieldsValue({
        title: initialData.title,
        type: initialData.type,
        order: initialData.order,
        isFinal: initialData.isFinal,
      })
      setVideoId(
        initialData.type === LessonType.VIDEO ? (initialData.contentId ?? undefined) : undefined,
      )
    } else {
      form.resetFields()
      form.setFieldsValue({ type: LessonType.VIDEO, isFinal: false, order: 1 })
      setVideoId(undefined)
    }
  }, [open, mode, initialData, form])

  const handleClose = () => {
    form.resetFields()
    setVideoId(undefined)
    onClose()
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setIsSaving(true)

      const type = values.type as LessonType
      let contentId: string | undefined

      if (type === LessonType.VIDEO) {
        // videoId is set by VideoUploadSection via onVideoReady
        contentId = videoId
        if (!contentId && mode === 'create') {
          void message.warning('Vui lòng upload video trước khi lưu bài học')
          return
        }
      } else if (type === LessonType.DOCUMENT) {
        contentId = values.documentId as string | undefined
      } else if (type === LessonType.QUIZ && mode === 'create') {
        // Create quiz first, then use its id as contentId
        const quizValues = values.quiz as {
          passingScore: number
          maxAttempts?: number
          timeLimit?: number
          questions?: QuestionInput[]
        }

        if (!quizValues?.questions?.length) {
          void message.warning('Quiz phải có ít nhất một câu hỏi')
          return
        }

        // Enrich options with auto-incrementing order
        const enrichedQuestions: QuestionInput[] = (quizValues.questions ?? []).map((q, qIdx) => ({
          ...q,
          order: q.order ?? qIdx + 1,
          options: q.options?.map((opt, oIdx) => ({ ...opt, order: oIdx + 1 })),
        }))

        const quiz = await createQuiz({
          title: values.title as string,
          passingScore: quizValues.passingScore,
          maxAttempts: quizValues.maxAttempts,
          timeLimit: quizValues.timeLimit,
          questions: enrichedQuestions,
        })
        contentId = quiz.id
      } else if (type === LessonType.QUIZ && mode === 'edit') {
        // Keep existing contentId for edit
        contentId = initialData?.contentId ?? undefined
      }

      const payload = {
        title: values.title as string,
        type,
        order: values.order as number,
        isFinal: (values.isFinal as boolean | undefined) ?? false,
        contentId,
      }

      if (mode === 'create') {
        await createLesson({ moduleId, ...payload })
        void message.success('Tạo bài học thành công')
      } else if (initialData) {
        await updateLesson({ id: initialData.id, ...payload })
        void message.success('Cập nhật bài học thành công')
      }

      handleClose()
      onSaved()
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) return
      const msg = isApiResponseError(err) ? err.message : 'Có lỗi xảy ra. Vui lòng thử lại.'
      void message.error(msg)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Drawer
      title={
        <Space>
          {mode === 'create' ? 'Thêm bài học' : 'Cập nhật bài học'}
          {lessonType && (
            <Tag color={lessonTypeColorMap[lessonType]}>{lessonTypeLabelMap[lessonType]}</Tag>
          )}
        </Space>
      }
      placement="right"
      width="80%"
      open={open}
      onClose={handleClose}
      destroyOnClose
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={handleClose}>Hủy</Button>
            <Button type="primary" loading={isSaving} onClick={handleSave}>
              {mode === 'create' ? 'Tạo bài học' : 'Lưu thay đổi'}
            </Button>
          </Space>
        </div>
      }
    >
      <Form form={form} layout="vertical">
        {/* ── Basic info ───────────────────────────────────────────────────── */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="title"
              label="Tiêu đề bài học"
              rules={[{ required: true, message: 'Nhập tiêu đề bài học' }]}
            >
              <Input placeholder="Ví dụ: Bài 1: Giới thiệu NestJS" />
            </Form.Item>
          </Col>

          <Col span={6}>
            <Form.Item
              name="type"
              label="Loại bài học"
              rules={[{ required: true, message: 'Chọn loại bài học' }]}
            >
              <Select
                options={lessonTypeOptions}
                disabled={mode === 'edit'}
                placeholder="Chọn loại"
              />
            </Form.Item>
          </Col>

          <Col span={3}>
            <Form.Item
              name="order"
              label="Thứ tự"
              rules={[{ required: true, message: 'Nhập thứ tự' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col span={3}>
            <Form.Item name="isFinal" label="Thi cuối khoá" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        {/* ── Type-specific content ────────────────────────────────────────── */}
        {lessonType && (
          <>
            <Divider orientation="horizontal">
              Nội dung bài học
              <Tag color={lessonTypeColorMap[lessonType]} style={{ marginLeft: 8 }}>
                {lessonTypeLabelMap[lessonType]}
              </Tag>
            </Divider>

            {/* ── Video ── */}
            {lessonType === LessonType.VIDEO && (
              <VideoUploadSection
                existingVideoId={
                  mode === 'edit' && initialData?.type === LessonType.VIDEO
                    ? (initialData.contentId ?? undefined)
                    : undefined
                }
                onVideoReady={setVideoId}
              />
            )}

            {/* ── Document ── */}
            {lessonType === LessonType.DOCUMENT && (
              <Form.Item
                name="documentId"
                label="Chọn tài liệu"
                rules={[{ required: true, message: 'Vui lòng chọn tài liệu' }]}
              >
                <DocumentSelect
                  onChange={val => form.setFieldValue('documentId', val)}
                  value={form.getFieldValue('documentId') as string | undefined}
                />
              </Form.Item>
            )}

            {/* ── Quiz ── */}
            {lessonType === LessonType.QUIZ && (
              <>
                {/* Edit mode: quiz already created, show info only */}
                {mode === 'edit' && initialData?.contentId ? (
                  <Alert
                    type="info"
                    showIcon
                    message="Quiz đã được tạo"
                    description={
                      <Space direction="vertical" size={2}>
                        <span>
                          Quiz ID:{' '}
                          <Typography.Text code copyable>
                            {initialData.contentId}
                          </Typography.Text>
                        </span>
                        <Typography.Text type="secondary">
                          Để chỉnh sửa nội dung quiz, vui lòng quản lý qua API Quiz.
                        </Typography.Text>
                      </Space>
                    }
                  />
                ) : (
                  <>
                    {/* Quiz settings */}
                    <Typography.Text strong>Cài đặt Quiz</Typography.Text>
                    <Row gutter={16} style={{ marginTop: 12 }}>
                      <Col span={8}>
                        <Form.Item
                          name={['quiz', 'passingScore']}
                          label="Điểm đạt"
                          initialValue={70}
                          rules={[{ required: true, message: 'Nhập điểm đạt' }]}
                        >
                          <InputNumber min={0} max={100} style={{ width: '100%' }} addonAfter="%" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name={['quiz', 'maxAttempts']} label="Số lần thử tối đa">
                          <InputNumber
                            min={1}
                            style={{ width: '100%' }}
                            placeholder="Không giới hạn"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name={['quiz', 'timeLimit']} label="Giới hạn thời gian">
                          <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            placeholder="Không giới hạn"
                            addonAfter="giây"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Divider orientation="horizontal" style={{ fontSize: 13 }}>
                      Danh sách câu hỏi
                    </Divider>

                    {/* Questions */}
                    <Form.List name={['quiz', 'questions']}>
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
                              form={form}
                            />
                          ))}

                          <Button
                            type="dashed"
                            block
                            icon={<PlusOutlined />}
                            onClick={() =>
                              add({
                                type: 'single_choice',
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
                  </>
                )}
              </>
            )}
          </>
        )}
      </Form>
    </Drawer>
  )
}
