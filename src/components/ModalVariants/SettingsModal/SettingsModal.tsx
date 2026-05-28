import { SettingOutlined } from '@ant-design/icons'
import { Modal, theme, Typography } from 'antd'
import { useState } from 'react'
import { SiteSettingsPanel } from './SiteSettingsPanel'

// ─── Nav items ────────────────────────────────────────────────────────────────

type PanelKey = 'site-settings'

interface NavItem {
  key: PanelKey
  label: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  {
    key: 'site-settings',
    label: 'Site Settings',
    icon: <SettingOutlined />,
  },
]

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { token } = theme.useToken()
  const [activeKey, setActiveKey] = useState<PanelKey>('site-settings')

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={900}
      footer={null}
      title={null}
      closable
      top={60}
      styles={{
        body: {
          height: 600,
          display: 'flex',
          overflow: 'hidden',
          padding: 0,
        },
      }}
      destroyOnHidden
    >
      {/* ── Sidebar ── */}
      <div
        style={{
          width: 220,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 12px',
          flexShrink: 0,
        }}
      >
        <Typography.Text
          type="secondary"
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            paddingLeft: 8,
            marginBottom: 8,
            display: 'block',
          }}
        >
          Settings
        </Typography.Text>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => setActiveKey(item.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                borderRadius: token.borderRadius,
                border: 'none',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                fontSize: 14,
                color: token.colorText,
                background: activeKey === item.key ? token.colorFillSecondary : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* ── Panel ── */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px 32px',
        }}
      >
        {activeKey === 'site-settings' && <SiteSettingsPanel />}
      </div>
    </Modal>
  )
}
