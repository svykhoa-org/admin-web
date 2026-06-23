import { PdfPreviewModal } from '@/components/ModalVariants/PdfPreviewModal'
import { DocumentSelect } from '@/components/SelectionVariants'
import { UploadSingleDocument, UploadSingleVideo } from '@/components/Upload'
import type { ExistingFileData } from '@/components/Upload'
import { LessonType, type Lesson } from '@/models/Course'
import type { FileResource } from '@/models/FileResource'
import { createDocument, getDocumentDetail, getDocumentDownloadUrl } from '@/services/Document'
import { createLesson, updateLesson } from '@/services/Lesson'
import { createQuiz, getQuizDetail, type QuestionInput } from '@/services/Quiz'
import type { Quiz } from '@/models/Quiz'
import { createVideo, getVideo, listVideos } from '@/services/Video'
import type { VideoDto } from '@/services/Video'
import { listUser } from '@/services/User'
import type { User } from '@/models/User'
import { isApiResponseError } from '@/utils/apiResponse'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import {
  App,
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd'
import type { FormInstance } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

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

// ─── Question Builder ─────────────────────────────────────────────────────────

interface QuestionBuilderProps {
  field: { name: number; key: number }
  index: number
  remove: (index: number) => void
  form: FormInstance
}

const QuestionBuilder = ({ field, index, remove, form }: QuestionBuilderProps) => {
  const qType = Form.useWatch(['quiz', 'questions', field.name, 'type'], form) as string | undefined
  const correctOptionIndex = Form.useWatch(
    ['quiz', 'questions', field.name, 'correctOptionIndex'],
    form,
  ) as number | undefined

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

      <Form.Item name={[field.name, 'correctOptionIndex']} hidden noStyle>
        <InputNumber />
      </Form.Item>

      {/* Choice options */}
      {(qType === 'single_choice' || qType === 'multiple_choice') && (
        <Form.List name={[field.name, 'options']}>
          {(optFields, { add: addOpt, remove: removeOpt }) => {
            const isSingle = qType === 'single_choice'
            return (
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {isSingle ? 'Chọn đúng 1 đáp án' : 'Đánh dấu tất cả đáp án đúng'}
                </Typography.Text>

                {isSingle ? (
                  <Radio.Group
                    value={correctOptionIndex}
                    onChange={e =>
                      form.setFieldValue(
                        ['quiz', 'questions', field.name, 'correctOptionIndex'],
                        e.target.value as number,
                      )
                    }
                    style={{ width: '100%' }}
                  >
                    <Space direction="vertical" size={6} style={{ width: '100%' }}>
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
                            <Radio value={optIdx}>Đúng</Radio>
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
                    </Space>
                  </Radio.Group>
                ) : (
                  optFields.map((optField, optIdx) => (
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
                  ))
                )}

                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => addOpt({ content: '', order: optFields.length + 1 })}
                >
                  Thêm đáp án
                </Button>
              </Space>
            )
          }}
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
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [isSaving, setIsSaving] = useState(false)

  // videoId = Video.id (learning object), used as contentId for VIDEO lessons
  const [videoId, setVideoId] = useState<string | undefined>(undefined)
  // videoMode: 'select' = pick existing Video; 'upload' = create new Video inline
  const [videoMode, setVideoMode] = useState<'select' | 'upload'>('select')
  // For 'upload' mode: the raw assetId from UploadSingleVideo
  const [uploadedAssetId, setUploadedAssetId] = useState<string | undefined>(undefined)
  // For 'upload' mode: author + title state
  const [newVideoAuthorId, setNewVideoAuthorId] = useState<string | undefined>(undefined)
  const [newVideoTitle, setNewVideoTitle] = useState<string>('')
  // Prevent duplicate Video creation on repeated submits (upload mode)
  const createdVideoIdRef = useRef<string | undefined>(undefined)
  // For 'upload' mode: track the assetId that was used to create createdVideoIdRef so we can
  // detect if the user replaced the video (new upload = different assetId → must re-create)
  const createdVideoAssetIdRef = useRef<string | undefined>(undefined)

  // For 'select' mode: video options fetched from listVideos
  const [videoOptions, setVideoOptions] = useState<VideoDto[]>([])
  const [videoSearchLoading, setVideoSearchLoading] = useState(false)
  // For 'select' mode in edit: pre-populate the current video
  const [currentVideo, setCurrentVideo] = useState<VideoDto | null>(null)

  // For 'upload' mode: author options
  const [authorOptions, setAuthorOptions] = useState<User[]>([])

  const [docMode, setDocMode] = useState<'select' | 'upload'>('upload')
  const [existingDocFile, setExistingDocFile] = useState<ExistingFileData | null>(null)
  const [openPdfModal, setOpenPdfModal] = useState(false)
  const [quizDetail, setQuizDetail] = useState<Quiz | null>(null)
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false)

  const lessonType = Form.useWatch('type', form) as LessonType | undefined

  // Populate / reset form when drawer opens
  useEffect(() => {
    if (!open) return

    // Reset video-upload state on every open
    setUploadedAssetId(undefined)
    setNewVideoAuthorId(undefined)
    setNewVideoTitle('')
    createdVideoIdRef.current = undefined
    createdVideoAssetIdRef.current = undefined
    setCurrentVideo(null)

    if (mode === 'edit' && initialData) {
      form.setFieldsValue({
        title: initialData.title,
        description: initialData.description ?? '',
        type: initialData.type,
        order: initialData.order,
        durationMinutes: initialData.durationMinutes ?? 0,
        isRequired: initialData.isRequired ?? true,
        isPreview: initialData.isPreview ?? false,
        documentId:
          initialData.type === LessonType.DOCUMENT
            ? (initialData.contentId ?? undefined)
            : undefined,
      })

      if (initialData.type === LessonType.VIDEO && initialData.contentId) {
        // contentId is now a Video.id — load the Video to display info and pre-select
        setVideoId(initialData.contentId)
        setVideoMode('select')
        getVideo({ id: initialData.contentId })
          .then(video => {
            setCurrentVideo(video)
            // Seed the options so the Select renders the pre-selected item
            setVideoOptions(prev => {
              if (prev.find(v => v.id === video.id)) return prev
              return [video, ...prev]
            })
          })
          .catch(() => {})
      } else {
        setVideoId(undefined)
        setVideoMode('select')
      }

      // Fetch existing document file info to pre-populate the upload preview
      if (initialData.type === LessonType.DOCUMENT && initialData.contentId) {
        getDocumentDetail({ id: initialData.contentId })
          .then(async doc => {
            const name = doc.file?.originalName ?? doc.title
            let url = doc.file?.url ?? undefined
            if (!url) {
              url = await getDocumentDownloadUrl(initialData.contentId!).catch(() => undefined)
            }
            setExistingDocFile({ url, name, type: 'document', onView: () => setOpenPdfModal(true) })
          })
          .catch(() => {})
      } else {
        setExistingDocFile(null)
      }
    } else {
      form.resetFields()
      form.setFieldsValue({ type: LessonType.VIDEO })
      setVideoId(undefined)
      setVideoMode('select')
      setExistingDocFile(null)
    }
    setDocMode('upload')
  }, [open, mode, initialData, form])

  // Load initial video options when VIDEO section becomes active
  useEffect(() => {
    if (!open || lessonType !== LessonType.VIDEO) return
    setVideoSearchLoading(true)
    listVideos({ pageSize: 20 })
      .then(videos => {
        setVideoOptions(prev => {
          // Merge without losing the pre-selected current video
          const existing = prev.filter(v => !videos.find(nv => nv.id === v.id))
          return [...existing, ...videos]
        })
      })
      .catch(() => {})
      .finally(() => setVideoSearchLoading(false))
  }, [open, lessonType])

  // Load author options when upload mode is active
  useEffect(() => {
    if (!open || lessonType !== LessonType.VIDEO || videoMode !== 'upload') return
    listUser({ pageSize: 50 })
      .then(data => setAuthorOptions(data.items))
      .catch(() => {})
  }, [open, lessonType, videoMode])

  useEffect(() => {
    if (
      !open ||
      mode !== 'edit' ||
      initialData?.type !== LessonType.QUIZ ||
      !initialData?.contentId
    ) {
      setQuizDetail(null)
      return
    }
    setIsLoadingQuiz(true)
    getQuizDetail({ id: initialData.contentId })
      .then(setQuizDetail)
      .catch(() => setQuizDetail(null))
      .finally(() => setIsLoadingQuiz(false))
  }, [open, mode, initialData])

  const handleClose = () => {
    form.resetFields()
    setVideoId(undefined)
    setVideoMode('select')
    setUploadedAssetId(undefined)
    setNewVideoAuthorId(undefined)
    setNewVideoTitle('')
    createdVideoIdRef.current = undefined
    createdVideoAssetIdRef.current = undefined
    setCurrentVideo(null)
    setVideoOptions([])
    setDocMode('upload')
    setExistingDocFile(null)
    setOpenPdfModal(false)
    onClose()
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setIsSaving(true)

      const type = values.type as LessonType
      let contentId: string | undefined

      if (type === LessonType.VIDEO) {
        if (videoMode === 'select') {
          // videoId is already a Video.id chosen from the library
          contentId = videoId
          if (!contentId && mode === 'create') {
            void message.warning('Vui lòng chọn video trước khi lưu bài học')
            return
          }
        } else {
          // 'upload' mode: create a new Video learning object from the uploaded asset
          if (!uploadedAssetId) {
            void message.warning('Vui lòng upload video trước khi lưu bài học')
            return
          }
          if (!newVideoTitle.trim()) {
            void message.warning('Vui lòng nhập tiêu đề video')
            return
          }
          // Avoid duplicate creation: reuse if same asset already created a Video this session
          if (createdVideoIdRef.current && createdVideoAssetIdRef.current === uploadedAssetId) {
            contentId = createdVideoIdRef.current
          } else {
            const newVideo = await createVideo({
              assetId: uploadedAssetId,
              authorId: newVideoAuthorId,
              title: newVideoTitle.trim(),
            })
            createdVideoIdRef.current = newVideo.id
            createdVideoAssetIdRef.current = uploadedAssetId
            contentId = newVideo.id
          }
        }
      } else if (type === LessonType.DOCUMENT) {
        contentId = values.documentId as string | undefined
      } else if (type === LessonType.QUIZ && mode === 'create') {
        // Create quiz first, then use its id as contentId
        const quizValues = values.quiz as {
          passingScore: number
          maxAttempts?: number
          timeLimit?: number
          questions?: (QuestionInput & { correctOptionIndex?: number })[]
        }

        if (!quizValues?.questions?.length) {
          void message.warning('Quiz phải có ít nhất một câu hỏi')
          return
        }

        const enrichedQuestions: QuestionInput[] = (quizValues.questions ?? []).map((q, qIdx) => {
          const { correctOptionIndex, ...rest } = q
          const isSingle = q.type === 'single_choice'
          return {
            ...rest,
            order: q.order ?? qIdx + 1,
            options: q.options?.map((opt, oIdx) => ({
              content: opt.content,
              order: oIdx + 1,
              isCorrect: isSingle ? oIdx === correctOptionIndex : opt.isCorrect,
            })),
          }
        })

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

      const basePayload = {
        title: values.title as string,
        description: (values.description as string | undefined) || undefined,
        type,
        contentId,
        durationMinutes: (values.durationMinutes as number | undefined) || undefined,
        isRequired: (values.isRequired as boolean | undefined) ?? true,
        isPreview: (values.isPreview as boolean | undefined) ?? false,
      }

      if (mode === 'create') {
        await createLesson({ moduleId, ...basePayload })
        void message.success('Tạo bài học thành công')
      } else if (initialData) {
        await updateLesson({
          id: initialData.id,
          ...basePayload,
          order: (values.order as number | undefined) ?? undefined,
        })
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
    <>
      <Modal
        title={
          <Space>
            {mode === 'create' ? 'Thêm bài học' : 'Cập nhật bài học'}
            {lessonType && (
              <Tag color={lessonTypeColorMap[lessonType]}>{lessonTypeLabelMap[lessonType]}</Tag>
            )}
          </Space>
        }
        width="80%"
        open={open}
        onCancel={handleClose}
        destroyOnClose
        zIndex={1100}
        styles={{
          body: { maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', padding: '16px 0' },
        }}
        footer={
          <Space>
            <Button onClick={handleClose}>Hủy</Button>
            <Button type="primary" loading={isSaving} onClick={handleSave}>
              {mode === 'create' ? 'Tạo bài học' : 'Lưu thay đổi'}
            </Button>
          </Space>
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
            {mode === 'edit' && (
              <Col span={3}>
                <Form.Item name="order" label="Thứ tự">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            )}
            <Col span={3}>
              <Form.Item name="durationMinutes" label="Thời lượng (phút)">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="description" label="Mô tả bài học">
                <Input.TextArea rows={2} placeholder="Mô tả ngắn về bài học (tuỳ chọn)" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                name="isRequired"
                label="Bắt buộc"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                name="isPreview"
                label="Xem trước"
                valuePropName="checked"
                initialValue={false}
              >
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
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {/* Mode toggle */}
                  <Radio.Group
                    value={videoMode}
                    onChange={e => {
                      const next = e.target.value as 'select' | 'upload'
                      setVideoMode(next)
                      // Clear the opposite mode's selection
                      if (next === 'select') {
                        setUploadedAssetId(undefined)
                        setNewVideoTitle('')
                        setNewVideoAuthorId(undefined)
                        createdVideoIdRef.current = undefined
                        createdVideoAssetIdRef.current = undefined
                        // Restore edit-mode selection if switching back
                        if (
                          mode === 'edit' &&
                          initialData?.type === LessonType.VIDEO &&
                          initialData.contentId
                        ) {
                          setVideoId(initialData.contentId)
                        } else {
                          setVideoId(undefined)
                        }
                      } else {
                        setVideoId(undefined)
                      }
                    }}
                    optionType="button"
                    buttonStyle="solid"
                    options={[
                      { label: 'Chọn video có sẵn', value: 'select' },
                      { label: 'Tạo video mới', value: 'upload' },
                    ]}
                  />

                  {/* Select existing video */}
                  {videoMode === 'select' && (
                    <div>
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 12, display: 'block', marginBottom: 6 }}
                      >
                        Tìm và chọn video từ kho học liệu
                      </Typography.Text>
                      <Select
                        showSearch
                        style={{ width: '100%' }}
                        placeholder="Tìm video theo tiêu đề..."
                        filterOption={false}
                        loading={videoSearchLoading}
                        value={videoId}
                        onSearch={search => {
                          setVideoSearchLoading(true)
                          listVideos({ search, pageSize: 20 })
                            .then(videos => {
                              setVideoOptions(prev => {
                                const kept = prev.filter(v => !videos.find(nv => nv.id === v.id))
                                return [...kept, ...videos]
                              })
                            })
                            .catch(() => {})
                            .finally(() => setVideoSearchLoading(false))
                        }}
                        onChange={(val: string) => setVideoId(val)}
                        options={videoOptions.map(v => ({
                          value: v.id,
                          label: v.title,
                        }))}
                      />
                      {currentVideo && videoId === currentVideo.id && (
                        <Typography.Text
                          type="secondary"
                          style={{ fontSize: 12, marginTop: 4, display: 'block' }}
                        >
                          Hiện tại: <strong>{currentVideo.title}</strong>
                        </Typography.Text>
                      )}
                    </div>
                  )}

                  {/* Create new video inline */}
                  {videoMode === 'upload' && (
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      <UploadSingleVideo
                        label={form.getFieldValue('title') as string | undefined}
                        onVideoReady={assetId => {
                          // Reset created video when a new asset is uploaded
                          if (assetId !== createdVideoAssetIdRef.current) {
                            createdVideoIdRef.current = undefined
                            createdVideoAssetIdRef.current = undefined
                          }
                          setUploadedAssetId(assetId)
                        }}
                        onVideoRemoved={() => {
                          setUploadedAssetId(undefined)
                          createdVideoIdRef.current = undefined
                          createdVideoAssetIdRef.current = undefined
                        }}
                        hideUploadOnFilled={true}
                        size="block"
                      />
                      <Row gutter={12}>
                        <Col span={16}>
                          <Form.Item label="Tiêu đề video" style={{ marginBottom: 0 }}>
                            <Input
                              placeholder="Nhập tiêu đề video..."
                              value={newVideoTitle}
                              onChange={e => setNewVideoTitle(e.target.value)}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item label="Tác giả" style={{ marginBottom: 0 }}>
                            <Select
                              showSearch
                              placeholder="Chọn tác giả..."
                              style={{ width: '100%' }}
                              filterOption={(input, option) =>
                                ((option?.label as string) ?? '')
                                  .toLowerCase()
                                  .includes(input.toLowerCase())
                              }
                              value={newVideoAuthorId}
                              onChange={(val: string) => setNewVideoAuthorId(val)}
                              options={authorOptions.map(u => ({
                                value: u.id,
                                label: u.fullName || u.email,
                              }))}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Space>
                  )}
                </Space>
              )}

              {/* ── Document ── */}
              {lessonType === LessonType.DOCUMENT && (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Radio.Group
                    value={docMode}
                    onChange={e => {
                      setDocMode(e.target.value as 'select' | 'upload')
                      form.setFieldValue('documentId', undefined)
                    }}
                    optionType="button"
                    buttonStyle="solid"
                    options={[
                      { label: 'Chọn từ hệ thống', value: 'select' },
                      { label: 'Tải lên tệp mới', value: 'upload' },
                    ]}
                  />

                  {docMode === 'select' && (
                    <Form.Item
                      name="documentId"
                      label="Tài liệu"
                      rules={[{ required: true, message: 'Vui lòng chọn tài liệu' }]}
                      style={{ marginBottom: 0 }}
                    >
                      <DocumentSelect
                        onChange={val => form.setFieldValue('documentId', val)}
                        value={form.getFieldValue('documentId') as string | undefined}
                      />
                    </Form.Item>
                  )}

                  {docMode === 'upload' && (
                    <Form.Item
                      name="documentId"
                      label="Tải lên tài liệu"
                      rules={[{ required: true, message: 'Vui lòng tải lên tài liệu' }]}
                      style={{ marginBottom: 0 }}
                    >
                      <UploadSingleDocument
                        existingFile={existingDocFile ?? undefined}
                        hideUploadOnFilled={true}
                        onRemoveExisting={() => setExistingDocFile(null)}
                        onSuccess={async (resource: FileResource) => {
                          try {
                            const doc = await createDocument({
                              title: resource.originalName ?? resource.fileName ?? 'Tài liệu',
                              price: 0,
                              fileId: resource.id,
                            })
                            form.setFieldValue('documentId', doc.id)
                          } catch {
                            void message.error('Không thể tạo tài liệu từ file đã tải lên')
                          }
                        }}
                      />
                    </Form.Item>
                  )}
                </Space>
              )}

              {/* ── Quiz ── */}
              {lessonType === LessonType.QUIZ && (
                <>
                  {/* Edit mode: quiz already created, show info only */}
                  {mode === 'edit' && initialData?.contentId ? (
                    <Card size="small" loading={isLoadingQuiz}>
                      {quizDetail ? (
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                          <Space wrap>
                            <Typography.Text strong>{quizDetail.title}</Typography.Text>
                            <Tag color="purple">{quizDetail.questions?.length ?? 0} câu hỏi</Tag>
                            <Tag color="blue">Điểm đạt: {quizDetail.passingScore}%</Tag>
                            {quizDetail.timeLimit && (
                              <Tag color="orange">Thời gian: {quizDetail.timeLimit} phút</Tag>
                            )}
                            {quizDetail.maxAttempts && (
                              <Tag>Tối đa {quizDetail.maxAttempts} lần thử</Tag>
                            )}
                          </Space>
                          <Button
                            size="small"
                            type="primary"
                            ghost
                            onClick={() => {
                              handleClose()
                              navigate(`/quizzes/${initialData.contentId}`)
                            }}
                          >
                            Chỉnh sửa câu hỏi
                          </Button>
                        </Space>
                      ) : (
                        <Typography.Text type="secondary">
                          Không thể tải thông tin quiz
                        </Typography.Text>
                      )}
                    </Card>
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
                            <InputNumber
                              min={0}
                              max={100}
                              style={{ width: '100%' }}
                              addonAfter="%"
                            />
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
                              addonAfter="phút"
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
                                  correctOptionIndex: 0,
                                  options: [
                                    { content: '', order: 1 },
                                    { content: '', order: 2 },
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
      </Modal>

      <PdfPreviewModal
        open={openPdfModal}
        title={existingDocFile?.name}
        url={existingDocFile?.url}
        zIndex={1200}
        onCancel={() => setOpenPdfModal(false)}
      />
    </>
  )
}
