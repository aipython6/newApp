import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, Space, Tag, DatePicker } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { syncTaskApi, SyncTask, sourceDBApi, targetDBApi, SourceDB, TargetDB } from '../api'
import type { Dayjs } from 'dayjs'
import { formatToUTC8 } from '../utils/timeUtils'

const { Option } = Select
const { TimePicker } = DatePicker

const SyncTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<SyncTask[]>([])
  const [sourceDBs, setSourceDBs] = useState<SourceDB[]>([])
  const [targetDBs, setTargetDBs] = useState<TargetDB[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm()
  const [fieldMapping, setFieldMapping] = useState<string>('{}')

  useEffect(() => {
    loadTasks()
    loadSourceDBs()
    loadTargetDBs()
  }, [])

  const loadTasks = async () => {
    try {
      const res = await syncTaskApi.getSyncTasks()
      setTasks(res.data)
    } catch (error) {
      message.error('加载失败')
    }
  }

  const loadSourceDBs = async () => {
    try {
      const res = await sourceDBApi.getSourceDBs()
      setSourceDBs(res.data)
    } catch (error) {
      console.error('Failed to load source DBs')
    }
  }

  const loadTargetDBs = async () => {
    try {
      const res = await targetDBApi.getTargetDBs()
      setTargetDBs(res.data)
    } catch (error) {
      console.error('Failed to load target DBs')
    }
  }

  const handleAdd = () => {
    setEditingId(null)
    form.resetFields()
    setFieldMapping('{}')
    setModalVisible(true)
  }

  const handleEdit = (record: SyncTask) => {
    setEditingId(record.id)
    form.setFieldsValue({
      ...record,
      sync_time: record.sync_time ? record.sync_time : null
    })
    setFieldMapping(JSON.stringify(record.field_mapping, null, 2))
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
          await syncTaskApi.deleteSyncTask(id)
          message.success('删除成功')
          loadTasks()
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      let parsedMapping
      try {
        parsedMapping = JSON.parse(fieldMapping)
      } catch (e) {
        message.error('字段映射 JSON 格式错误')
        return
      }

      const data = {
        ...values,
        field_mapping: parsedMapping,
        sync_time: values.sync_time ? values.sync_time : null
      }

      if (editingId) {
        await syncTaskApi.updateSyncTask(editingId, data)
        message.success('更新成功')
      } else {
        await syncTaskApi.createSyncTask(data)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadTasks()
    } catch (error) {
      message.error('保存失败')
    }
  }

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'success':
        return <Tag color="success">成功</Tag>
      case 'failed':
        return <Tag color="error">失败</Tag>
      default:
        return <Tag color="default">待执行</Tag>
    }
  }

  const columns = [
    { title: '任务名称', dataIndex: 'task_name', key: 'task_name' },
    { title: '源数据库ID', dataIndex: 'source_db_id', key: 'source_db_id' },
    { title: '目标数据库ID', dataIndex: 'target_db_id', key: 'target_db_id' },
    { title: '源表', dataIndex: 'source_table', key: 'source_table' },
    { title: '目标表', dataIndex: 'target_table', key: 'target_table' },
    { title: '同步频率', dataIndex: 'sync_frequency', key: 'sync_frequency' },
    { 
      title: '上次同步时间', 
      dataIndex: 'last_sync_time', 
      key: 'last_sync_time',
      render: (time: string) => formatToUTC8(time)
    },
    { title: '上次状态', dataIndex: 'last_sync_status', key: 'last_sync_status', render: getStatusTag },
    { title: '启用', dataIndex: 'is_active', key: 'is_active', render: (v: boolean) => v ? '是' : '否' },
    { 
      title: '创建时间', 
      dataIndex: 'created_at', 
      key: 'created_at',
      render: (time: string) => formatToUTC8(time)
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: SyncTask) => (
        <Space>
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
        <h2>同步任务</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建任务
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={tasks}
        rowKey="id"
      />

      <Modal
        title={editingId ? '编辑任务' : '新建任务'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="task_name"
            label="任务名称"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input placeholder="请输入任务名称" />
          </Form.Item>

          <Form.Item
            name="source_db_id"
            label="源数据库"
            rules={[{ required: true, message: '请选择源数据库' }]}
          >
            <Select placeholder="请选择源数据库">
              {sourceDBs.map(db => (
                <Option key={db.id} value={db.id}>{db.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="target_db_id"
            label="目标数据库"
            rules={[{ required: true, message: '请选择目标数据库' }]}
          >
            <Select placeholder="请选择目标数据库">
              {targetDBs.map(db => (
                <Option key={db.id} value={db.id}>{db.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="source_table"
            label="源表"
            rules={[{ required: true, message: '请输入源表' }]}
          >
            <Input placeholder="请输入源表" />
          </Form.Item>

          <Form.Item
            name="target_table"
            label="目标表"
            rules={[{ required: true, message: '请输入目标表' }]}
          >
            <Input placeholder="请输入目标表" />
          </Form.Item>

          <Form.Item
            label="字段映射 (JSON)"
          >
            <Input.TextArea
              value={fieldMapping}
              onChange={e => setFieldMapping(e.target.value)}
              rows={6}
              placeholder='{"source_field": "target_field"}'
            />
          </Form.Item>

          <Form.Item
            name="sync_frequency"
            label="同步频率"
            rules={[{ required: true, message: '请选择同步频率' }]}
          >
            <Select placeholder="请选择同步频率">
              <Option value="daily">每天</Option>
              <Option value="weekly_1">每周一</Option>
              <Option value="weekly_2">每周二</Option>
              <Option value="weekly_3">每周三</Option>
              <Option value="weekly_4">每周四</Option>
              <Option value="weekly_5">每周五</Option>
              <Option value="weekly_6">每周六</Option>
              <Option value="weekly_0">每周日</Option>
              <Option value="monthly_1">每月1号</Option>
              <Option value="monthly_15">每月15号</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="sync_time"
            label="同步时间"
          >
            <TimePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="启用"
            initialValue={true}
          >
            <Select>
              <Option value={true}>是</Option>
              <Option value={false}>否</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SyncTasksPage
