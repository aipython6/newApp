import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, DatePicker } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, DatabaseOutlined, SyncOutlined } from '@ant-design/icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { dashboardApi, syncLogApi } from '../api'
import type { DashboardStats, SyncLog } from '../api'

const { RangePicker } = DatePicker

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [logs, setLogs] = useState<SyncLog[]>([])

  useEffect(() => {
    loadStats()
    loadLogs()
  }, [])

  const loadStats = async () => {
    try {
      const res = await dashboardApi.getStats()
      setStats(res.data)
    } catch (error) {
      console.error('Failed to load stats')
    }
  }

  const loadLogs = async () => {
    try {
      const res = await syncLogApi.getSyncLogs()
      setLogs(res.data)
    } catch (error) {
      console.error('Failed to load logs')
    }
  }

  const chartData = logs.slice(0, 10).reverse().map(log => ({
    time: new Date(log.sync_time).toLocaleDateString(),
    success: log.success_count,
    failed: log.failed_count
  }))

  const columns = [
    { title: '任务ID', dataIndex: 'task_id', key: 'task_id' },
    { title: '同步时间', dataIndex: 'sync_time', key: 'sync_time', render: (t: string) => new Date(t).toLocaleString() },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => s === 'success' ? '成功' : '失败' },
    { title: '记录数', dataIndex: 'record_count', key: 'record_count' },
    { title: '成功数', dataIndex: 'success_count', key: 'success_count' },
    { title: '失败数', dataIndex: 'failed_count', key: 'failed_count' }
  ]

  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>数据概览</h2>
        <RangePicker />
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="本月同步记录数"
              value={stats?.total_records || 0}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="成功任务数"
              value={stats?.successful_tasks || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="失败任务数"
              value={stats?.failed_tasks || 0}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="成功同步记录"
              value={stats?.total_success_records || 0}
              prefix={<SyncOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="同步趋势">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="success" stroke="#52c41a" name="成功" />
                <Line type="monotone" dataKey="failed" stroke="#ff4d4f" name="失败" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="任务状态分布">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: '成功', value: stats?.successful_tasks || 0 },
                { name: '失败', value: stats?.failed_tasks || 0 },
                { name: '待执行', value: 0 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#1890ff" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Card title="最近同步日志">
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}

export default Dashboard
