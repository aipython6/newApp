import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, message, Space, Avatar } from 'antd'
import { PlusOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons'
import { userApi, User } from '../api'
import { formatToUTC8 } from '../utils/timeUtils'

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const res = await userApi.getUsers()
      setUsers(res.data)
    } catch (error) {
      message.error('加载失败')
    }
  }

  const handleAdd = () => {
    form.resetFields()
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '您确定要删除这个用户吗？此操作无法撤销。',
      okText: '是',
      cancelText: '否',
      onOk: async () => {
        try {
          await userApi.deleteUser(id)
          message.success('删除成功')
          loadUsers()
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      await userApi.createUser(values)
      message.success('创建成功')
      setModalVisible(false)
      loadUsers()
    } catch (error) {
      message.error('创建失败')
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { 
      title: '头像', 
      dataIndex: 'avatar', 
      key: 'avatar',
      render: (avatar: string) => (
        <Avatar src={avatar} icon={<UserOutlined />} />
      )
    },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '状态', dataIndex: 'is_active', key: 'is_active', render: (v: boolean) => v ? '启用' : '禁用' },
    { 
      title: '创建时间', 
      dataIndex: 'created_at', 
      key: 'created_at', 
      render: (t: string) => formatToUTC8(t) 
    },
    { 
      title: '更新时间', 
      dataIndex: 'updated_at', 
      key: 'updated_at', 
      render: (t: string) => formatToUTC8(t) 
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: User) => (
        <Space>
          {record.username !== 'admin' && (
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              onClick={() => handleDelete(record.id)}
            >
              删除
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>用户管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建用户
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
      />

      <Modal
        title="新建用户"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="创建"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default UserManagement
