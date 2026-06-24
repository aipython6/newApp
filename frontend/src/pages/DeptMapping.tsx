import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Switch, message, Space } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { deptApi, DeptMapping } from '../api'

const DeptMappingPage: React.FC = () => {
  const [depts, setDepts] = useState<DeptMapping[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadDepts()
  }, [])

  const loadDepts = async () => {
    try {
      const res = await deptApi.getDepts()
      setDepts(res.data)
    } catch (error) {
      message.error('加载失败')
    }
  }

  const handleAdd = () => {
    setEditingId(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: DeptMapping) => {
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
          await deptApi.deleteDept(id)
          message.success('删除成功')
          loadDepts()
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingId) {
        await deptApi.updateDept(editingId, values)
        message.success('更新成功')
      } else {
        await deptApi.createDept(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadDepts()
    } catch (error) {
      message.error('保存失败')
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '旧HIS ID', dataIndex: 'old_his_id', key: 'old_his_id' },
    { title: '旧HIS名称', dataIndex: 'old_his_name', key: 'old_his_name' },
    { title: '新HIS ID', dataIndex: 'new_his_id', key: 'new_his_id' },
    { title: '新HIS名称', dataIndex: 'new_his_name', key: 'new_his_name' },
    { title: 'JXKS ID', dataIndex: 'jxks_id', key: 'jxks_id' },
    { title: 'JXKS名称', dataIndex: 'jxks_name', key: 'jxks_name' },
    { title: '一级父科室', dataIndex: 'first_parent_name', key: 'first_parent_name' },
    { title: '二级父科室', dataIndex: 'second_parent_name', key: 'second_parent_name' },
    { title: '分类', dataIndex: 'category', key: 'category' },
    { title: '来源', dataIndex: 'source', key: 'source' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: DeptMapping) => (
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
        <h2>科室映射</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={depts}
        rowKey="id"
        scroll={{ x: 1500 }}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingId ? '编辑' : '新建'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="old_his_id" label="旧HIS ID">
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item name="old_his_name" label="旧HIS名称">
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item name="new_his_id" label="新HIS ID">
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item name="new_his_name" label="新HIS名称">
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item name="jxks_id" label="JXKS ID">
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item name="jxks_name" label="JXKS名称">
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item name="first_parent_name" label="一级父科室">
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item name="second_parent_name" label="二级父科室">
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item name="source" label="来源">
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item name="version" label="版本">
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item name="is_zb" label="是否总部" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default DeptMappingPage
