import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, Space } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { sourceDBApi, SourceDB } from '../api'
import { formatToUTC8 } from '../utils/timeUtils'

const { Option } = Select

const dbTypes = [
  'oceanbase', 'starrocks', 'mysql8', 'mysql5.7',
  'oracle11g', 'oracle9c', 'sqlserver2008'
]

const SourceDBPage: React.FC = () => {
  const [dbs, setDbs] = useState<SourceDB[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [testModalVisible, setTestModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [testingRecord, setTestingRecord] = useState<SourceDB | null>(null)
  const [form] = Form.useForm()
  const [testForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [testLoading, setTestLoading] = useState(false)

  useEffect(() => {
    loadDbs()
  }, [])

  const loadDbs = async () => {
    try {
      const res = await sourceDBApi.getSourceDBs()
      setDbs(res.data)
    } catch (error) {
      message.error('加载失败')
    }
  }

  const handleAdd = () => {
    setEditingId(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: SourceDB) => {
    setEditingId(record.id)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '您确定要删除这条记录吗？此操作无法撤销。',
      okText: '是',
      cancelText: '否',
      onOk: async () => {
        try {
          await sourceDBApi.deleteSourceDB(id)
          message.success('删除成功')
          loadDbs()
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }

  const handleTestConnection = (record: SourceDB) => {
    setTestingRecord(record)
    testForm.resetFields()
    testForm.setFieldsValue({
      username: record.username,
      password: ''
    })
    setTestModalVisible(true)
  }

  const submitTestConnection = async () => {
    if (!testingRecord) return
    try {
      const values = await testForm.validateFields()
      setTestLoading(true)
      const res = await sourceDBApi.testConnection({
        db_type: testingRecord.db_type,
        host: testingRecord.host,
        port: testingRecord.port,
        database: testingRecord.database,
        username: values.username,
        password: values.password
      })
      if (res.data.success) {
        message.success('连接成功')
        setTestModalVisible(false)
      } else {
        message.error('连接失败: ' + res.data.message)
      }
    } catch (error) {
      message.error('测试连接失败')
    } finally {
      setTestLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingId) {
        await sourceDBApi.updateSourceDB(editingId, values)
        message.success('更新成功')
      } else {
        await sourceDBApi.createSourceDB(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadDbs()
    } catch (error) {
      message.error('保存失败')
    }
  }

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '数据库类型', dataIndex: 'db_type', key: 'db_type' },
    { title: '主机', dataIndex: 'host', key: 'host' },
    { title: '端口', dataIndex: 'port', key: 'port' },
    { title: '数据库', dataIndex: 'database', key: 'database' },
    { 
      title: '创建时间', 
      dataIndex: 'created_at', 
      key: 'created_at',
      render: (time: string) => formatToUTC8(time)
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: SourceDB) => (
        <Space>
          <Button
            icon={<ThunderboltOutlined />}
            size="small"
            onClick={() => handleTestConnection(record)}
          >
            测试连接
          </Button>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>源数据库连接</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建连接
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={dbs}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingId ? '编辑连接' : '新建连接'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="请输入名称" />
          </Form.Item>

          <Form.Item
            name="db_type"
            label="数据库类型"
            rules={[{ required: true, message: '请选择数据库类型' }]}
          >
            <Select placeholder="请选择数据库类型">
              {dbTypes.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="host"
            label="主机"
            rules={[{ required: true, message: '请输入主机' }]}
          >
            <Input placeholder="请输入主机" />
          </Form.Item>

          <Form.Item
            name="port"
            label="端口"
            rules={[{ required: true, message: '请输入端口' }]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="请输入端口" />
          </Form.Item>

          <Form.Item
            name="database"
            label="数据库"
            rules={[{ required: true, message: '请输入数据库' }]}
          >
            <Input placeholder="请输入数据库" />
          </Form.Item>

          <Form.Item
            name="username"
            label="用户名"
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="测试数据库连接"
        open={testModalVisible}
        onOk={submitTestConnection}
        onCancel={() => setTestModalVisible(false)}
        okText="测试连接"
        cancelText="取消"
        confirmLoading={testLoading}
      >
        <Form form={testForm} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SourceDBPage
