import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, Space, Tabs } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ThunderboltOutlined } from '@ant-design/icons'
import Editor from '@monaco-editor/react'
import { targetDBApi, TargetDB } from '../api'
import { formatToUTC8 } from '../utils/timeUtils'

const { Option } = Select
const { TabPane } = Tabs

const TargetDBPage: React.FC = () => {
  const [dbs, setDbs] = useState<TargetDB[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [tableModalVisible, setTableModalVisible] = useState(false)
  const [testModalVisible, setTestModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [testingRecord, setTestingRecord] = useState<TargetDB | null>(null)
  const [form] = Form.useForm()
  const [tableForm] = Form.useForm()
  const [testForm] = Form.useForm()
  const [testLoading, setTestLoading] = useState(false)
  const [createMode, setCreateMode] = useState('ui')
  const [columns, setColumns] = useState([{ name: '', type: 'INT', primary_key: false, auto_increment: false }])

  useEffect(() => {
    loadDbs()
  }, [])

  const loadDbs = async () => {
    try {
      const res = await targetDBApi.getTargetDBs()
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

  const handleEdit = (record: TargetDB) => {
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
          await targetDBApi.deleteTargetDB(id)
          message.success('删除成功')
          loadDbs()
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }

  const handleTestConnection = (record: TargetDB) => {
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
      const res = await targetDBApi.testConnection({
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
        await targetDBApi.updateTargetDB(editingId, values)
        message.success('更新成功')
      } else {
        await targetDBApi.createTargetDB(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadDbs()
    } catch (error) {
      message.error('保存失败')
    }
  }

  const handleCreateTable = () => {
    setTableModalVisible(true)
    tableForm.resetFields()
    setColumns([{ name: '', type: 'INT', primary_key: false, auto_increment: false }])
  }

  const handleTableSubmit = async () => {
    try {
      const values = await tableForm.validateFields()
      const data: any = {
        target_db_id: values.target_db_id,
        table_name: values.table_name,
        create_mode: createMode
      }
      if (createMode === 'sql') {
        data.sql = values.sql
      } else {
        data.columns = columns
      }
      await targetDBApi.createTable(data)
      message.success('创建表成功')
      setTableModalVisible(false)
    } catch (error) {
      message.error('创建表失败')
    }
  }

  const addColumn = () => {
    setColumns([...columns, { name: '', type: 'INT', primary_key: false, auto_increment: false }])
  }

  const removeColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index))
  }

  const updateColumn = (index: number, field: string, value: any) => {
    const newColumns = [...columns]
    newColumns[index] = { ...newColumns[index], [field]: value }
    setColumns(newColumns)
  }

  const columnsDef = [
    { title: '名称', dataIndex: 'name', key: 'name' },
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
      render: (_: any, record: TargetDB) => (
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
        <h2>目标数据库</h2>
        <Space>
          <Button type="default" onClick={handleCreateTable}>
            新建表
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建连接
          </Button>
        </Space>
      </div>

      <Table
        columns={columnsDef}
        dataSource={dbs}
        rowKey="id"
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
        title="新建表"
        open={tableModalVisible}
        onOk={handleTableSubmit}
        onCancel={() => setTableModalVisible(false)}
        okText="创建"
        cancelText="取消"
        width={800}
      >
        <Form form={tableForm} layout="vertical">
          <Form.Item
            name="target_db_id"
            label="目标数据库"
            rules={[{ required: true, message: '请选择目标数据库' }]}
          >
            <Select placeholder="请选择目标数据库">
              {dbs.map(db => (
                <Option key={db.id} value={db.id}>{db.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="table_name"
            label="表名"
            rules={[{ required: true, message: '请输入表名' }]}
          >
            <Input placeholder="请输入表名" />
          </Form.Item>

          <Tabs activeKey={createMode} onChange={setCreateMode}>
            <TabPane tab="界面配置" key="ui">
              <div style={{ marginBottom: 16 }}>
                {columns.map((col, index) => (
                  <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <Input
                      placeholder="列名"
                      value={col.name}
                      onChange={e => updateColumn(index, 'name', e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <Select
                      value={col.type}
                      onChange={v => updateColumn(index, 'type', v)}
                      style={{ width: 120 }}
                    >
                      <Option value="INT">INT</Option>
                      <Option value="VARCHAR(255)">VARCHAR(255)</Option>
                      <Option value="TEXT">TEXT</Option>
                      <Option value="DATETIME">DATETIME</Option>
                      <Option value="DOUBLE">DOUBLE</Option>
                    </Select>
                    <Select
                      value={`${col.primary_key ? 'PK' : ''}${col.auto_increment ? ',AI' : ''}`}
                      onChange={v => {
                        updateColumn(index, 'primary_key', v.includes('PK'))
                        updateColumn(index, 'auto_increment', v.includes('AI'))
                      }}
                      style={{ width: 120 }}
                    >
                      <Option value="">普通</Option>
                      <Option value="PK">主键</Option>
                      <Option value="PK,AI">主键+自增</Option>
                    </Select>
                    <Button type="text" danger onClick={() => removeColumn(index)} disabled={columns.length === 1}>
                      删除
                    </Button>
                  </div>
                ))}
                <Button type="dashed" onClick={addColumn} block>
                  添加列
                </Button>
              </div>
            </TabPane>
            <TabPane tab="SQL 语句" key="sql">
              <Form.Item name="sql">
                <Editor
                  height={300}
                  defaultLanguage="sql"
                  defaultValue="CREATE TABLE table_name (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  name VARCHAR(255)\n);"
                />
              </Form.Item>
            </TabPane>
          </Tabs>
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

export default TargetDBPage
