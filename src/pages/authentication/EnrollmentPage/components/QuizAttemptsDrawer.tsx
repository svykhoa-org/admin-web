import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { Badge, Collapse, Descriptions, Drawer, Space, Tag, Typography } from 'antd'
import type { QuizAttempt, SnapshotAnswerRecord } from '@/models/EnrollmentProgress'
import { QuizAttemptStatus } from '@/models/EnrollmentProgress'
import { formatTimestamp } from '@/utils/time'

interface Props {
  open: boolean
  onClose: () => void
  lessonTitle: string
  attempts: QuizAttempt[]
}

function AnswerDetail({ record }: { record: SnapshotAnswerRecord }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
        {record.isCorrect ? (
          <CheckCircleOutlined style={{ color: '#52c41a', marginTop: 2 }} />
        ) : (
          <CloseCircleOutlined style={{ color: '#ff4d4f', marginTop: 2 }} />
        )}
        <div style={{ flex: 1 }}>
          <Typography.Text strong>{record.questionContent}</Typography.Text>
          <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
            {record.pointsEarned} / {record.maxPoints} điểm
          </div>
        </div>
      </div>

      {record.allOptions.length > 0 ? (
        <div style={{ paddingLeft: 24 }}>
          {record.allOptions.map(opt => {
            const isSelected = record.selectedOptionIds?.includes(opt.id)
            const isCorrect = opt.isCorrect
            let color: string = '#f5f5f5'
            let textColor: string = '#333'
            if (isSelected && isCorrect) {
              color = '#f6ffed'
              textColor = '#52c41a'
            } else if (isSelected && !isCorrect) {
              color = '#fff2f0'
              textColor = '#ff4d4f'
            } else if (!isSelected && isCorrect) {
              color = '#e6fffb'
              textColor = '#13c2c2'
            }
            return (
              <div
                key={opt.id}
                style={{
                  padding: '4px 8px',
                  marginBottom: 4,
                  borderRadius: 4,
                  background: color,
                  color: textColor,
                  fontSize: 13,
                  border: `1px solid ${isCorrect ? '#b7eb8f' : isSelected ? '#ffa39e' : '#f0f0f0'}`,
                }}
              >
                {isSelected ? '● ' : '○ '}
                {opt.content}
                {isCorrect && !isSelected && (
                  <span style={{ marginLeft: 8, fontSize: 11 }}>(đáp án đúng)</span>
                )}
              </div>
            )
          })}
        </div>
      ) : record.textAnswer ? (
        <div style={{ paddingLeft: 24, fontSize: 13, color: '#555' }}>
          Trả lời: <em>{record.textAnswer}</em>
        </div>
      ) : null}
    </div>
  )
}

export function QuizAttemptsDrawer({ open, onClose, lessonTitle, attempts }: Props) {
  const submitted = attempts.filter(a => a.status === QuizAttemptStatus.SUBMITTED)

  return (
    <Drawer
      title={`Lịch sử làm bài — ${lessonTitle}`}
      open={open}
      onClose={onClose}
      width={600}
      styles={{ body: { padding: 16 } }}
    >
      {submitted.length === 0 ? (
        <Typography.Text type="secondary">Chưa có lần nộp bài nào.</Typography.Text>
      ) : (
        <Collapse
          accordion
          items={submitted.map(attempt => ({
            key: attempt.id,
            label: (
              <Space>
                <Typography.Text strong>Lần {attempt.attemptNumber}</Typography.Text>
                <Tag color={attempt.isPassed ? 'success' : 'error'}>
                  {attempt.isPassed ? 'Đạt' : 'Không đạt'}
                </Tag>
                <Typography.Text>
                  Điểm: <strong>{Number(attempt.score).toFixed(1)}%</strong>
                </Typography.Text>
                {attempt.submittedAt && (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {formatTimestamp(attempt.submittedAt)}
                  </Typography.Text>
                )}
              </Space>
            ),
            children: attempt.answers ? (
              <div>
                <Descriptions size="small" style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="Bắt đầu">
                    {formatTimestamp(attempt.startedAt)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Nộp bài">
                    {attempt.submittedAt ? formatTimestamp(attempt.submittedAt) : '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Kết quả">
                    <Badge
                      status={attempt.isPassed ? 'success' : 'error'}
                      text={attempt.isPassed ? 'Đạt' : 'Chưa đạt'}
                    />
                  </Descriptions.Item>
                </Descriptions>
                {attempt.answers.map((record, idx) => (
                  <AnswerDetail key={idx} record={record} />
                ))}
              </div>
            ) : (
              <Typography.Text type="secondary">Không có dữ liệu chi tiết.</Typography.Text>
            ),
          }))}
        />
      )}
    </Drawer>
  )
}
