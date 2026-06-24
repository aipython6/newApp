import React, { useState, useEffect } from 'react'
import { Card, Button, Input, List, Modal, Form, message, Space, Row, Col, Tag, Typography } from 'antd'
import { PlusOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import Editor from '@monaco-editor/react'
import { knowledgeApi, KnowledgeDocument } from '../api'
import { formatToUTC8 } from '../utils/timeUtils'

const { Text } = Typography

const { TextArea } = Input

const KnowledgeBase: React.FC = () => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      const res = await knowledgeApi.getDocuments()
      setDocuments(res.data)
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
      content: '您确定要删除这个文档吗？此操作无法撤销。',
      okText: '是',
      cancelText: '否',
      onOk: async () => {
        try {
          await knowledgeApi.deleteDocument(id)
          message.success('删除成功')
          loadDocuments()
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      let doc_metadata
      try {
        doc_metadata = values.metadata ? JSON.parse(values.metadata) : {}
      } catch (e) {
        message.error('元数据 JSON 格式错误')
        return
      }
      await knowledgeApi.createDocument({
        title: values.title,
        content: values.content,
        doc_metadata
      })
      message.success('创建成功')
      setModalVisible(false)
      loadDocuments()
    } catch (error) {
      message.error('保存失败')
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const res = await knowledgeApi.query(searchQuery)
      setSearchResults(res.data.results)
    } catch (error) {
      message.error('搜索失败')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div>
      <Row gutter={24}>
        <Col span={14}>
          <Card
            title="知识库"
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                添加文档
              </Button>
            }
            style={{ marginBottom: 16 }}
          >
            <List
              dataSource={documents}
              renderItem={item => (
                <List.Item
                  actions={[
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(item.id)}>
                      删除
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{item.title}</span>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {formatToUTC8(item.created_at)}
                        </Text>
                      </div>
                    }
                    description={
                      <div>
                        <div style={{ color: '#666', marginBottom: 8 }}>
                          {item.content.substring(0, 100)}...
                        </div>
                        <div>
                          {item.doc_metadata && Object.entries(item.doc_metadata).map(([k, v]) => (
                            <Tag key={k} style={{ marginRight: 4 }}>
                              {k}: {String(v)}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col span={10}>
          <Card title="智能搜索">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input.Search
                placeholder="输入查询内容"
                enterButton={<Button icon={<SearchOutlined />}>搜索</Button>}
                size="large"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onSearch={handleSearch}
                loading={searching}
              />

              {searchResults.length > 0 && (
                <div>
                  <h4 style={{ marginBottom: 16 }}>搜索结果 ({searchResults.length} 条)</h4>
                  {searchResults.map((result, index) => (
                    <Card key={index} size="small" style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                        {result.content}
                      </div>
                      {result.distance && (
                        <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                          相似度: {(1 - result.distance).toFixed(2)}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <Modal
        title="添加文档"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入标题" />
          </Form.Item>

          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <Editor
              height={300}
              defaultLanguage="markdown"
              defaultValue=""
            />
          </Form.Item>

          <Form.Item
            name="metadata"
            label="元数据 (JSON)"
          >
            <TextArea
              rows={4}
              placeholder='{"category": "病历", "type": "住院"}'
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default KnowledgeBase
