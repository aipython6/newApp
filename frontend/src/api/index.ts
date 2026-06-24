import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 检查是否是登录接口的 401 错误，如果是则不做重定向处理
    const isLoginRequest = error.config?.url?.includes('/auth/login')
    
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export interface User {
  id: number
  username: string
  is_active: boolean
  avatar: string
  created_at: string
  updated_at: string
}

export interface SourceDB {
  id: number
  name: string
  db_type: string
  host: string
  port: number
  database: string
  username?: string
  created_at: string
  updated_at: string
}

export interface TargetDB {
  id: number
  name: string
  host: string
  port: number
  database: string
  username?: string
  created_at: string
  updated_at: string
}

export interface SyncTask {
  id: number
  task_name: string
  source_db_id: number
  target_db_id: number
  source_table: string
  target_table: string
  field_mapping: any
  sync_frequency: string
  sync_time?: string
  last_sync_status: string
  last_sync_time?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SyncLog {
  id: number
  task_id: number
  sync_time: string
  status: string
  record_count: number
  success_count: number
  failed_count: number
  error_message?: string
  created_at: string
}

export interface SystemMessage {
  id: number
  title: string
  content: string
  type: string
  is_read: boolean
  created_at: string
}

export interface KnowledgeDocument {
  id: number
  title: string
  content: string
  doc_metadata?: any
  vector_id?: string
  created_at: string
  updated_at: string
}

export interface DeptMapping {
  id: number
  old_his_id?: string
  old_his_name?: string
  new_his_id?: string
  new_his_name?: string
  jxks_id?: string
  jxks_name?: string
  first_parent_name?: string
  second_parent_name?: string
  category?: string
  source?: string
  version?: string
  is_zb?: boolean
  is_delete?: boolean
  create_time?: string
}

export interface Kspx {
  xh?: number
  parent_dept_name?: string
  dept_name?: string
  fjxh?: number
}

export interface DashboardStats {
  total_records: number
  successful_tasks: number
  failed_tasks: number
  total_success_records: number
}

export const authApi = {
  getCaptcha: () => api.post('/auth/captcha'),
  login: (data: { username: string; password: string; captcha: string; captcha_key: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get<User>('/users/me'),
  updatePassword: (data: { old_password: string; new_password: string }) =>
    api.post('/users/me/password', data),
  uploadAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

export const userApi = {
  getUsers: () => api.get<User[]>('/users'),
  createUser: (data: { username: string; password: string }) => api.post<User>('/users', data),
  deleteUser: (id: number) => api.delete(`/users/${id}`)
}

export const sourceDBApi = {
  getSourceDBs: () => api.get<SourceDB[]>('/source-dbs'),
  createSourceDB: (data: any) => api.post<SourceDB>('/source-dbs', data),
  updateSourceDB: (id: number, data: any) => api.put<SourceDB>(`/source-dbs/${id}`, data),
  deleteSourceDB: (id: number) => api.delete(`/source-dbs/${id}`),
  testConnection: (data: any) => api.post('/source-dbs/test', data)
}

export const targetDBApi = {
  getTargetDBs: () => api.get<TargetDB[]>('/target-dbs'),
  createTargetDB: (data: any) => api.post<TargetDB>('/target-dbs', data),
  updateTargetDB: (id: number, data: any) => api.put<TargetDB>(`/target-dbs/${id}`, data),
  deleteTargetDB: (id: number) => api.delete(`/target-dbs/${id}`),
  testConnection: (data: any) => api.post('/target-dbs/test', data),
  createTable: (data: any) => api.post('/target-dbs/create-table', data)
}

export const syncTaskApi = {
  getSyncTasks: () => api.get<SyncTask[]>('/sync-tasks'),
  createSyncTask: (data: any) => api.post<SyncTask>('/sync-tasks', data),
  updateSyncTask: (id: number, data: any) => api.put<SyncTask>(`/sync-tasks/${id}`, data),
  deleteSyncTask: (id: number) => api.delete(`/sync-tasks/${id}`)
}

export const syncLogApi = {
  getSyncLogs: () => api.get<SyncLog[]>('/sync-logs')
}

export const messageApi = {
  getMessages: () => api.get<SystemMessage[]>('/messages'),
  markRead: (id: number) => api.put(`/messages/${id}/read`)
}

export const dashboardApi = {
  getStats: () => api.get<DashboardStats>('/dashboard/stats')
}

export const knowledgeApi = {
  getDocuments: () => api.get<KnowledgeDocument[]>('/knowledge/documents'),
  createDocument: (data: any) => api.post<KnowledgeDocument>('/knowledge/documents', data),
  deleteDocument: (id: number) => api.delete(`/knowledge/documents/${id}`),
  query: (query: string) => api.post('/knowledge/query', { query })
}

export const deptApi = {
  getDepts: () => api.get<DeptMapping[]>('/depts'),
  createDept: (data: any) => api.post('/depts', data),
  updateDept: (id: number, data: any) => api.put(`/depts/${id}`, data),
  deleteDept: (id: number) => api.delete(`/depts/${id}`)
}

export const kspxApi = {
  getKspx: () => api.get<Kspx[]>('/kspx'),
  createKspx: (data: any) => api.post('/kspx', data),
  updateKspx: (xh: number, data: any) => api.put(`/kspx/${xh}`, data),
  deleteKspx: (xh: number) => api.delete(`/kspx/${xh}`)
}

export const systemApi = {
  getName: () => api.get('/system/name')
}

export default api
