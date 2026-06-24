import React, { useState, useEffect } from 'react'
import { Layout as AntLayout, Menu, Dropdown, Avatar, Badge, Button, Modal } from 'antd'
import {
  DashboardOutlined,
  DatabaseOutlined,
  SyncOutlined,
  FileTextOutlined,
  UserOutlined,
  TeamOutlined,
  OrderedListOutlined,
  BookOutlined,
  MessageOutlined,
  LogoutOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { systemApi, messageApi, authApi, User } from '../api'
import { formatToUTC8 } from '../utils/timeUtils'

const { Header, Sider, Content } = AntLayout

interface LayoutProps {
  children: React.ReactNode
  onLogout: () => void
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false)
  const [systemName, setSystemName] = useState('医院数据管理系统')
  const [messages, setMessages] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    loadSystemName()
    loadMessages()
    loadCurrentUser()
  }, [])

  const loadSystemName = async () => {
    try {
      const res = await systemApi.getName()
      setSystemName(res.data.name)
    } catch (error) {
      console.error('Failed to load system name')
    }
  }

  const loadMessages = async () => {
    try {
      const res = await messageApi.getMessages()
      setMessages(res.data)
    } catch (error) {
      console.error('Failed to load messages')
    }
  }

  const loadCurrentUser = async () => {
    try {
      const res = await authApi.getMe()
      setCurrentUser(res.data)
    } catch (error) {
      console.error('Failed to load user')
    }
  }

  const handleMessageClick = async (msg: any) => {
    setSelectedMessage(msg)
    setModalVisible(true)
    if (!msg.is_read) {
      try {
        await messageApi.markRead(msg.id)
        loadMessages()
      } catch (error) {
        console.error('Failed to mark message as read')
      }
    }
  }

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '首页'
    },
    {
      key: 'data-sync',
      icon: <DatabaseOutlined />,
      label: '数据同步',
      children: [
        { key: '/source-db', label: '源数据库连接' },
        { key: '/target-db', label: '目标数据库' },
        { key: '/sync-tasks', label: '同步任务' },
        { key: '/sync-logs', label: '同步日志信息' }
      ]
    },
    {
      key: 'system',
      icon: <TeamOutlined />,
      label: '系统管理',
      children: [
        { key: '/users', label: '用户管理' },
        { key: '/depts', label: '科室映射' },
        { key: '/kspx', label: '科室排序' }
      ]
    },
    {
      key: '/knowledge',
      icon: <BookOutlined />,
      label: '知识库'
    }
  ]

  const userMenuItems = [
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '个人设置',
      onClick: () => navigate('/settings')
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: onLogout
    }
  ]

  const messageMenuItems = messages.map(msg => ({
    key: msg.id.toString(),
    label: (
      <div onClick={() => handleMessageClick(msg)}>
        <div style={{ fontWeight: msg.is_read ? 'normal' : 'bold' }}>{msg.title}</div>
        <div style={{ fontSize: 12, color: '#999' }}>{msg.content.substring(0, 30)}...</div>
      </div>
    )
  }))

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? 16 : 18,
          fontWeight: 'bold'
        }}>
          {collapsed ? '医院' : systemName}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <AntLayout>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Dropdown menu={{ items: messageMenuItems }} placement="bottomRight">
              <Badge count={messages.filter(m => !m.is_read).length} size="small">
                <Button type="text" icon={<MessageOutlined />} />
              </Badge>
            </Dropdown>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
                <Avatar src={currentUser?.avatar} icon={<UserOutlined />} />
                <span>{currentUser?.username}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content style={{
          margin: '24px',
          padding: '24px',
          background: '#fff',
          minHeight: 280,
          borderRadius: 8
        }}>
          {children}
        </Content>
        
        <Modal
          title="消息详情"
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setModalVisible(false)}>
              关闭
            </Button>
          ]}
        >
          {selectedMessage && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ margin: 0, marginBottom: 8 }}>{selectedMessage.title}</h3>
                <div style={{ fontSize: 12, color: '#999' }}>
                  创建时间: {formatToUTC8(selectedMessage.created_at)}
                </div>
                {selectedMessage.is_read && (
                  <div style={{ fontSize: 12, color: '#52c41a', marginTop: 4 }}>
                    已读
                  </div>
                )}
                {!selectedMessage.is_read && (
                  <div style={{ fontSize: 12, color: '#faad14', marginTop: 4 }}>
                    未读
                  </div>
                )}
              </div>
              <div style={{ padding: '12px 0', borderTop: '1px solid #f0f0f0' }}>
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {selectedMessage.content}
                </p>
              </div>
            </div>
          )}
        </Modal>
      </AntLayout>
    </AntLayout>
  )
}

export default Layout
