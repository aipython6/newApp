import React, { useState, useEffect } from 'react'
import { Table, Card, Tag } from 'antd'
import { syncLogApi, SyncLog } from '../api'
import { formatToUTC8 } from '../utils/timeUtils'

const SyncLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<SyncLog[]>([])

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    try {
      const res = await syncLogApi.getSyncLogs()
      setLogs(res.data)
    } catch (error) {
      console.error('Failed to load logs')
    }
  }

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'success':
        return <Tag color="success">成功</Tag>
      case 'failed':
        return <Tag color="error">失败</Tag>
      default:
        return <Tag color="default">执行中</Tag>
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '任务ID', dataIndex: 'task_id', key: 'task_id' },
    { 
      title: '同步时间', 
      dataIndex: 'sync_time', 
      key: 'sync_time', 
      render: (t: string) => formatToUTC8(t) 
    },
    { title: '状态', dataIndex: 'status', key: 'status', render: getStatusTag },
    { title: '总记录数', dataIndex: 'record_count', key: 'record_count' },
    { title: '成功数', dataIndex: 'success_count', key: 'success_count' },
    { title: '失败数', dataIndex: 'failed_count', key: 'failed_count' },
    { title: '错误信息', dataIndex: 'error_message', key: 'error_message', render: (m: string) => m || '-' },
    { 
      title: '创建时间', 
      dataIndex: 'created_at', 
      key: 'created_at',
      render: (time: string) => formatToUTC8(time)
    }
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>同步日志信息</h2>
      <Card>
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  )
}

export default SyncLogsPage
