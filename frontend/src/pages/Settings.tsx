import React, { useState, useEffect } from 'react'
import { Card, Form, Input, Button, Upload, Avatar, message, Divider } from 'antd'
import { UserOutlined, EditOutlined, LockOutlined, UploadOutlined } from '@ant-design/icons'
import { authApi, User } from '../api'
import { formatToUTC8 } from '../utils/timeUtils'

const Settings: React.FC = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [passwordForm] = Form.useForm()

  useEffect(() => {
    loadUserInfo()
  }, [])

  const loadUserInfo = async () => {
    try {
      const res = await authApi.getMe()
      setUser(res.data)
    } catch (error) {
      message.error('获取用户信息失败')
    }
  }

  const handleAvatarUpload = async (file: File) => {
    setAvatarLoading(true)
    try {
      const res = await authApi.uploadAvatar(file)
      setUser(prev => prev ? { ...prev, avatar: res.data.avatar } : null)
      message.success('头像上传成功')
    } catch (error) {
      message.error('头像上传失败')
    } finally {
      setAvatarLoading(false)
    }
    return false
  }

  const handlePasswordUpdate = async (values: any) => {
    if (values.new_password !== values.confirm_password) {
      message.error('两次输入的密码不一致')
      return
    }
    setLoading(true)
    try {
      await authApi.updatePassword({
        old_password: values.old_password,
        new_password: values.new_password
      })
      message.success('密码修改成功')
      passwordForm.resetFields()
    } catch (error: any) {
      message.error(error.response?.data?.detail || '密码修改失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card title="个人设置中心" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <Avatar
            size={120}
            src={user?.avatar}
            icon={<UserOutlined />}
            style={{ marginBottom: 16 }}
          />
          <Upload
            beforeUpload={handleAvatarUpload}
            showUploadList={false}
            accept="image/*"
          >
            <Button icon={<UploadOutlined />} loading={avatarLoading}>
              更换头像
            </Button>
          </Upload>
        </div>

        <Divider />

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>基本信息</h3>
          <Form layout="vertical">
            <Form.Item label="用户名">
              <Input value={user?.username} disabled />
            </Form.Item>
            <Form.Item label="注册时间">
              <Input value={user?.created_at ? formatToUTC8(user.created_at) : ''} disabled />
            </Form.Item>
          </Form>
        </div>

        <Divider />

        <div>
          <h3 style={{ marginBottom: 16 }}>修改密码</h3>
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordUpdate}
          >
            <Form.Item
              name="old_password"
              label="当前密码"
              rules={[{ required: true, message: '请输入当前密码' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请输入当前密码" />
            </Form.Item>
            <Form.Item
              name="new_password"
              label="新密码"
              rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '密码长度至少 6 位' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请输入新密码" />
            </Form.Item>
            <Form.Item
              name="confirm_password"
              label="确认新密码"
              rules={[{ required: true, message: '请再次输入新密码' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请再次输入新密码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} icon={<EditOutlined />}>
                修改密码
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Card>
    </div>
  )
}

export default Settings
