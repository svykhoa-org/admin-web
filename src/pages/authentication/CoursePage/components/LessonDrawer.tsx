import { PdfPreviewModal } from '@/components/ModalVariants/PdfPreviewModal'
import { DocumentSelect } from '@/components/SelectionVariants'
import { UploadSingleDocument, UploadSingleVideo } from '@/components/Upload'
import type { ExistingFileData } from '@/components/Upload'
import { LessonType, type Lesson } from '@/models/Course'
import type { FileResource } from '@/models/FileResource'
import { createDocument, getDocumentDetail, getDocumentDownloadUrl } from '@/services/Document'
import { createLesson, updateLesson } from '@/services/Lesson'
import { RoutePath } from '@/router/RoutePath'
import { getCourseQuizSummary, type CourseQuizSummaryItem } from '@/services/Course'
import { createVideo, getVideo, listVideos } from '@/services/Video'
import type { VideoDto } from '@/services/Video'
import { listUser } from '@/services/User'
import type { User } from '@/models/User'
import { getApiErrorMessage } from '@/utils/apiResponse'
import {
  Alert,
  App,
  Button,
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
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  mode: 'create' | 'edit'
  courseId: string
  moduleId: string
  initialData?: Lesson
  onClose: () => void
  onSaved: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const lessonTypeOptions = [
  { label: 'Video', value: LessonType.VIDEO },
  { label: 'Tài liệu', value: LessonType.DOCUMENT },
  { label: 'Bài kiểm tra', value: LessonType.QUIZ },
]

const lessonTypeColorMap: Record<LessonType, string> = {
  [LessonType.VIDEO]: 'blue',
  [LessonType.DOCUMENT]: 'green',
  [LessonType.QUIZ]: 'purple',
}

const lessonTypeLabelMap: Record<LessonType, string> = {
  [LessonType.VIDEO]: 'Video',
  [LessonType.DOCUMENT]: 'Tài liệu',
  [LessonType.QUIZ]: 'Bài kiểm tra',
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────

export const LessonDrawer = ({
  open,
  mode,
  courseId,
  moduleId,
  initialData,
  onClose,
  onSaved,
}: Props) => {
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
  const [quizzes, setQuizzes] = useState<CourseQuizSummaryItem[] | null>(null)

  const lessonType = Form.useWatch('type', form) as LessonType | undefined
  const selectedQuizId = Form.useWatch('quizId', form) as string | undefined

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
        durationMinutes: initialData.durationMinutes ?? 0,
        isRequired: initialData.isRequired ?? true,
        isPreview: initialData.isPreview ?? false,
        documentId:
          initialData.type === LessonType.DOCUMENT
            ? (initialData.contentId ?? undefined)
            : undefined,
        quizId:
          initialData.type === LessonType.QUIZ ? (initialData.contentId ?? undefined) : undefined,
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
    if (!open || lessonType !== LessonType.QUIZ) return
    let isCurrent = true
    getCourseQuizSummary(courseId)
      .then(result => {
        if (isCurrent) setQuizzes(result)
      })
      .catch(() => {
        if (isCurrent) setQuizzes([])
        void message.error('Không thể tải danh sách bài kiểm tra')
      })
    return () => {
      isCurrent = false
    }
  }, [open, lessonType, courseId, message])

  // A lesson only offers quizzes no other lesson uses, plus its own.
  const quizOptions = (quizzes ?? []).filter(
    quiz => !quiz.linkedLesson || quiz.linkedLesson.id === initialData?.id,
  )
  const selectedQuiz = quizOptions.find(quiz => quiz.quizId === selectedQuizId)
  const currentQuiz = quizOptions.find(quiz => quiz.linkedLesson?.id === initialData?.id)
  // The server refuses replacing a quiz learners already submitted.
  const isQuizLocked = mode === 'edit' && (currentQuiz?.attempted ?? 0) > 0

  const handleSelectQuiz = (quizId: string) => {
    const title = quizOptions.find(quiz => quiz.quizId === quizId)?.title
    if (title && !(form.getFieldValue('title') as string | undefined)?.trim()) {
      form.setFieldValue('title', title)
    }
  }

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
      } else if (type === LessonType.QUIZ) {
        contentId = values.quizId as string
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
        })
        void message.success('Cập nhật bài học thành công')
      }

      handleClose()
      onSaved()
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) return
      const msg = getApiErrorMessage(err, 'Có lỗi xảy ra. Vui lòng thử lại.')
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
              {lessonType === LessonType.QUIZ &&
                (quizzes && quizOptions.length === 0 ? (
                  <Alert
                    type="info"
                    showIcon
                    title="Chưa có bài kiểm tra nào để chọn"
                    description="Tạo bài kiểm tra trước, rồi quay lại đây để gắn vào bài học."
                    action={
                      <Button
                        size="small"
                        onClick={() => {
                          handleClose()
                          navigate(RoutePath.CourseExamsPage.getPath(courseId))
                        }}
                      >
                        Mở Bài kiểm tra
                      </Button>
                    }
                  />
                ) : (
                  <>
                    <Form.Item
                      name="quizId"
                      label="Bài kiểm tra"
                      rules={[{ required: true, message: 'Chọn một bài kiểm tra' }]}
                      extra={
                        isQuizLocked
                          ? 'Đã có học viên nộp bài nên không thể đổi. Muốn dùng bài khác, hãy tạo bài học mới.'
                          : 'Chỉ hiện các bài chưa gắn vào bài học nào của khoá.'
                      }
                    >
                      <Select
                        showSearch={{ optionFilterProp: 'label' }}
                        loading={!quizzes}
                        disabled={isQuizLocked}
                        placeholder="Chọn bài kiểm tra"
                        onChange={handleSelectQuiz}
                        options={quizOptions.map(quiz => ({
                          value: quiz.quizId,
                          label:
                            quiz.questionCount > 0
                              ? `${quiz.title} · ${quiz.questionCount} câu · đạt ${quiz.passingScore}%`
                              : `${quiz.title} · chưa có câu hỏi`,
                          disabled: quiz.questionCount === 0,
                        }))}
                      />
                    </Form.Item>
                    {!isQuizLocked && selectedQuiz && selectedQuiz.attempted > 0 && (
                      <Alert
                        type="warning"
                        showIcon
                        className="mb-4"
                        title={`Bài này đã có ${selectedQuiz.attempted} học viên làm. Các lượt cũ vẫn được tính vào số lần làm bài của họ.`}
                      />
                    )}
                    {selectedQuizId && (
                      <Button
                        size="small"
                        onClick={() => {
                          handleClose()
                          navigate(RoutePath.CourseExamEditPage.getPath(courseId, selectedQuizId))
                        }}
                      >
                        Sửa câu hỏi
                      </Button>
                    )}
                  </>
                ))}
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
