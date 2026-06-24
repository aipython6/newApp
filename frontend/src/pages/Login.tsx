import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined, ClearOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import { authApi } from '../api'

interface LoginProps {
  onLogin: () => void
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [form] = Form.useForm()
  const [captchaKey, setCaptchaKey] = useState('')
  const [captchaText, setCaptchaText] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    refreshCaptcha()
  }, [])

  const refreshCaptcha = async () => {
    try {
      const res = await authApi.getCaptcha()
      setCaptchaKey(res.data.captcha_key)
      setCaptchaText(res.data.captcha_code || '')
    } catch (error) {
      message.error('获取验证码失败')
    }
  }

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const res = await authApi.login({
        ...values,
        captcha_key: captchaKey
      })
      localStorage.setItem('token', res.data.access_token)
      message.success('登录成功')
      onLogin()
    } catch (error: any) {
      message.error(error.response?.data?.detail || '登录失败')
      refreshCaptcha()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card
        title="医院数据管理系统"
        style={{ width: 400 }}
        headStyle={{ textAlign: 'center', fontSize: 20 }}
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              allowClear={{ clearIcon: <ClearOutlined /> }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              allowClear={{ clearIcon: <ClearOutlined /> }}
              iconRender={(visible) =>
                visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <Form.Item
            name="captcha"
            rules={[{ required: true, message: '请输入验证码' }]}
          >
            <div style={{ display: 'flex', gap: 10 }}>
              <Input
                placeholder="验证码"
                allowClear={{ clearIcon: <ClearOutlined /> }}
                style={{ flex: 1 }}
              />
              <Button onClick={refreshCaptcha} style={{ minWidth: 100, fontSize: 18, fontWeight: 'bold', letterSpacing: 4 }}>
                {captchaText}
              </Button>
            </div>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default Login
