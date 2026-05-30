import {
  Activity,
  AlertCircle,
  Bell,
  BookOpen,
  CheckCircle,
  ClipboardList,
  Clock,
  Eye,
  FileText,
  FlaskConical,
  Folder,
  Globe,
  GraduationCap,
  Heart,
  Image,
  Layers,
  Library,
  Lock,
  Mic,
  Pencil,
  Pill,
  Settings,
  Shield,
  Star,
  Stethoscope,
  Tag,
  Users,
  Video,
  Zap,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react'
import type { JSX } from 'react'

// ─── Icon registry ────────────────────────────────────────────────────────────

export const ICON_OPTIONS: { value: string; Icon: LucideIcon; label: string; category: string }[] =
  [
    // Academic
    { value: 'BookOpen', Icon: BookOpen, label: 'Sách mở', category: 'Học thuật' },
    { value: 'GraduationCap', Icon: GraduationCap, label: 'Tốt nghiệp', category: 'Học thuật' },
    { value: 'Library', Icon: Library, label: 'Thư viện', category: 'Học thuật' },
    { value: 'Pencil', Icon: Pencil, label: 'Bút chì', category: 'Học thuật' },
    { value: 'ClipboardList', Icon: ClipboardList, label: 'Danh sách', category: 'Học thuật' },
    // Medical
    { value: 'Heart', Icon: Heart, label: 'Tim', category: 'Y tế' },
    { value: 'Stethoscope', Icon: Stethoscope, label: 'Ống nghe', category: 'Y tế' },
    { value: 'Pill', Icon: Pill, label: 'Thuốc', category: 'Y tế' },
    { value: 'Activity', Icon: Activity, label: 'Hoạt động', category: 'Y tế' },
    { value: 'FlaskConical', Icon: FlaskConical, label: 'Bình thí nghiệm', category: 'Y tế' },
    { value: 'Shield', Icon: Shield, label: 'Bảo vệ', category: 'Y tế' },
    // Content
    { value: 'FileText', Icon: FileText, label: 'Tài liệu', category: 'Nội dung' },
    { value: 'Video', Icon: Video, label: 'Video', category: 'Nội dung' },
    { value: 'Mic', Icon: Mic, label: 'Mic', category: 'Nội dung' },
    { value: 'Image', Icon: Image, label: 'Hình ảnh', category: 'Nội dung' },
    { value: 'Layers', Icon: Layers, label: 'Lớp', category: 'Nội dung' },
    { value: 'Tag', Icon: Tag, label: 'Nhãn', category: 'Nội dung' },
    // Navigation
    { value: 'Users', Icon: Users, label: 'Người dùng', category: 'Điều hướng' },
    { value: 'Globe', Icon: Globe, label: 'Toàn cầu', category: 'Điều hướng' },
    { value: 'Star', Icon: Star, label: 'Nổi bật', category: 'Điều hướng' },
    { value: 'Clock', Icon: Clock, label: 'Thời gian', category: 'Điều hướng' },
    { value: 'Bell', Icon: Bell, label: 'Thông báo', category: 'Điều hướng' },
    { value: 'Settings', Icon: Settings, label: 'Cài đặt', category: 'Điều hướng' },
    { value: 'Folder', Icon: Folder, label: 'Thư mục', category: 'Điều hướng' },
    // Status
    { value: 'CheckCircle', Icon: CheckCircle, label: 'Xác nhận', category: 'Trạng thái' },
    { value: 'AlertCircle', Icon: AlertCircle, label: 'Cảnh báo', category: 'Trạng thái' },
    { value: 'Eye', Icon: Eye, label: 'Xem', category: 'Trạng thái' },
    { value: 'Lock', Icon: Lock, label: 'Khoá', category: 'Trạng thái' },
    { value: 'Zap', Icon: Zap, label: 'Nhanh', category: 'Trạng thái' },
  ]

// ─── Renderer helper ──────────────────────────────────────────────────────────

export function renderIcon(iconValue?: string | null, props?: LucideProps): JSX.Element | null {
  if (!iconValue) return null
  const entry = ICON_OPTIONS.find(o => o.value === iconValue)
  if (!entry) return null
  return <entry.Icon size={16} {...props} />
}
