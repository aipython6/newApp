import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, message, Space } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { kspxApi, Kspx } from '../api'

const KspxManagement: React.FC = () => {
  const [items, setItems] = useState<Kspx[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingXh, setEditingXh] = useState<number | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    try {
      const res = await kspxApi.getKspx()
      setItems(res.data)
    } catch (error) {
      message.error('加载失败')
    }
  }

  const handleAdd = () => {
    setEditingXh(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: Kspx) => {
    setEditingXh(record.xh || null)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (xh: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '您确定要删除这条记录吗？此操作无法撤销。',
      okText: '是',
      cancelText: '否',
      onOk: async () => {
        try {
          await kspxApi.deleteKspx(xh)
          message.success('删除成功')
          loadItems()
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingXh) {
        await kspxApi.updateKspx(editingXh, values)
        message.success('更新成功')
      } else {
        await kspxApi.createKspx(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadItems()
    } catch (error) {
      message.error('保存失败')
    }
  }

  const columns = [
    { title: '序号', dataIndex: 'xh', key: 'xh' },
    { title: '父科室名称', dataIndex: 'parent_dept_name', key: 'parent_dept_name' },
    { title: '科室名称', dataIndex: 'dept_name', key: 'dept_name' },
    { title: '父序号', dataIndex: 'fjxh', key: 'fjxh' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Kspx) => (
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
            onClick={() => record.xh && handleDelete(record.xh)}
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
        <h2>科室排序</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={items}
        rowKey="xh"
      />

      <Modal
        title={editingXh ? '编辑' : '新建'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="xh"
            label="序号"
          >
            <InputNumber style={{ width: '100%' }} placeholder="请输入" />
          </Form.Item>
          <Form.Item
            name="parent_dept_name"
            label="父科室名称"
          >
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item
            name="dept_name"
            label="科室名称"
          >
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item
            name="fjxh"
            label="父序号"
          >
            <InputNumber style={{ width: '100%' }} placeholder="请输入" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default KspxManagement
