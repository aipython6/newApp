# 医院数据管理系统 - API文档

## 基础信息

- **Base URL**: `http://localhost:8000`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON

## 认证流程

### 1. 获取验证码

```http
POST /api/auth/captcha
```

**响应示例**:
```json
{
  "captcha_key": "uuid-string",
  "captcha_image": "base64-image-optional"
}
```

### 2. 登录

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123",
  "captcha": "ABCD",
  "captcha_key": "uuid-string"
}
```

**响应示例**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### 3. 使用Token

后续请求需要在Header中携带Token:
```
Authorization: Bearer <access_token>
```

---

## 用户管理

### 获取当前用户信息

```http
GET /api/users/me
```

**响应示例**:
```json
{
  "id": 1,
  "username": "admin",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00"
}
```

### 获取用户列表

```http
GET /api/users
```

### 创建用户

```http
POST /api/users
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123"
}
```

### 删除用户

```http
DELETE /api/users/{user_id}
```

---

## 源数据库管理

### 获取源数据库列表

```http
GET /api/source-dbs
```

**响应示例**:
```json
[
  {
    "id": 1,
    "name": "生产数据库",
    "db_type": "mysql8",
    "host": "192.168.1.100",
    "port": 3306,
    "database": "his_db",
    "username": "root",
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  }
]
```

### 创建源数据库连接

```http
POST /api/source-dbs
Content-Type: application/json

{
  "name": "生产数据库",
    "db_type": "mysql8",
    "host": "192.168.1.100",
    "port": 3306,
    "database": "his_db",
    "username": "root",
    "password": "password"
}
```

**数据库类型支持**: `oceanbase`, `starrocks`, `mysql8`, `mysql5.7`, `oracle11g`, `oracle9c`, `sqlserver2008`

### 更新源数据库连接

```http
PUT /api/source-dbs/{id}
Content-Type: application/json

{
  "name": "生产数据库",
  "db_type": "mysql8",
  "host": "192.168.1.100",
  "port": 3306,
  "database": "his_db",
  "username": "root",
  "password": "newpassword"
}
```

### 删除源数据库连接

```http
DELETE /api/source-dbs/{id}
```

### 测试源数据库连接

```http
POST /api/source-dbs/test
Content-Type: application/json

{
  "db_type": "mysql8",
  "host": "192.168.1.100",
  "port": 3306,
  "database": "his_db",
  "username": "root",
  "password": "password"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "连接成功"
}
```

---

## 目标数据库管理

### 获取目标数据库列表

```http
GET /api/target-dbs
```

### 创建目标数据库连接

```http
POST /api/target-dbs
Content-Type: application/json

{
  "name": "目标数据库",
  "host": "192.168.1.200",
  "port": 3306,
  "database": "target_db",
  "username": "root",
  "password": "password"
}
```

### 更新目标数据库连接

```http
PUT /api/target-dbs/{id}
```

### 删除目标数据库连接

```http
DELETE /api/target-dbs/{id}
```

### 测试目标数据库连接

```http
POST /api/target-dbs/test
```

### 创建表

```http
POST /api/target-dbs/create-table
Content-Type: application/json

{
  "target_db_id": 1,
  "table_name": "new_table",
  "create_mode": "ui",
  "columns": [
    {
      "name": "id",
      "type": "INT",
      "primary_key": true,
      "auto_increment": true
    },
    {
      "name": "name",
      "type": "VARCHAR(255)",
      "primary_key": false,
      "auto_increment": false
    }
  ]
}
```

或使用SQL模式:

```json
{
  "target_db_id": 1,
  "table_name": "new_table",
  "create_mode": "sql",
  "sql": "CREATE TABLE new_table (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255));"
}
```

---

## 同步任务管理

### 获取同步任务列表

```http
GET /api/sync-tasks
```

**响应示例**:
```json
[
  {
    "id": 1,
    "task_name": "患者数据同步",
    "source_db_id": 1,
    "target_db_id": 1,
    "source_table": "patients",
    "target_table": "sync_patients",
    "field_mapping": {
      "id": "patient_id",
      "name": "patient_name"
    },
    "sync_frequency": "daily",
    "sync_time": "2024-01-01T02:00:00",
    "last_sync_status": "success",
    "last_sync_time": "2024-01-02T02:00:00",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  }
]
```

**同步频率选项**:
- `daily`: 每天
- `weekly_0` 到 `weekly_6`: 每周日到周六
- `monthly_1`, `monthly_15`: 每月1号或15号

### 创建同步任务

```http
POST /api/sync-tasks
Content-Type: application/json

{
  "task_name": "患者数据同步",
  "source_db_id": 1,
  "target_db_id": 1,
  "source_table": "patients",
  "target_table": "sync_patients",
  "field_mapping": {
    "id": "patient_id",
    "name": "patient_name"
  },
  "sync_frequency": "daily",
  "sync_time": "2024-01-01T02:00:00"
}
```

### 更新同步任务

```http
PUT /api/sync-tasks/{id}
```

### 删除同步任务

```http
DELETE /api/sync-tasks/{id}
```

---

## 同步日志

### 获取同步日志

```http
GET /api/sync-logs
```

**响应示例**:
```json
[
  {
    "id": 1,
    "task_id": 1,
    "sync_time": "2024-01-02T02:00:00",
    "status": "success",
    "record_count": 1000,
    "success_count": 1000,
    "failed_count": 0,
    "error_message": null,
    "created_at": "2024-01-02T02:00:00"
  }
]
```

**状态值**: `success`, `failed`, `pending`

---

## 系统消息

### 获取系统消息

```http
GET /api/messages
```

### 标记消息已读

```http
PUT /api/messages/{id}/read
```

---

## 仪表盘

### 获取仪表盘统计数据

```http
GET /api/dashboard/stats
```

**响应示例**:
```json
{
  "total_records": 15000,
  "successful_tasks": 10,
  "failed_tasks": 2,
  "total_success_records": 14500
}
```

---

## 知识库管理

### 获取文档列表

```http
GET /api/knowledge/documents
```

### 创建文档

```http
POST /api/knowledge/documents
Content-Type: application/json

{
  "title": "住院病历模板",
  "content": "# 住院病历\n\n患者基本信息...",
  "metadata": {
    "category": "病历",
    "type": "住院"
  }
}
```

### 删除文档

```http
DELETE /api/knowledge/documents/{id}
```

### 搜索知识库

```http
POST /api/knowledge/query
Content-Type: application/json

{
  "query": "如何填写患者信息"
}
```

**响应示例**:
```json
{
  "results": [
    {
      "content": "文档内容...",
      "metadata": {},
      "distance": 0.123
    }
  ]
}
```

---

## 科室映射管理

### 获取科室列表

```http
GET /api/depts
```

**响应示例**:
```json
[
  {
    "id": 1,
    "old_his_id": "001",
    "old_his_name": "内科",
    "new_his_id": "101",
    "new_his_name": "心内科",
    "jxks_id": "201",
    "jxks_name": "心脏内科",
    "first_parent_name": "内科",
    "second_parent_name": "心血管",
    "category": "临床",
    "source": "HIS",
    "version": "1.0",
    "is_zb": true,
    "is_delete": false,
    "create_time": "2024-01-01T00:00:00"
  }
]
```

### 创建科室映射

```http
POST /api/depts
Content-Type: application/json

{
  "old_his_id": "001",
  "old_his_name": "内科",
  "new_his_id": "101",
  "new_his_name": "心内科",
  "jxks_id": "201",
  "jxks_name": "心脏内科",
  "first_parent_name": "内科",
  "second_parent_name": "心血管",
  "category": "临床",
  "source": "HIS",
  "version": "1.0",
  "is_zb": true
}
```

### 更新科室映射

```http
PUT /api/depts/{id}
```

### 删除科室映射（软删除）

```http
DELETE /api/depts/{id}
```

---

## 科室排序管理

### 获取排序列表

```http
GET /api/kspx
```

**响应示例**:
```json
[
  {
    "xh": 1,
    "parent_dept_name": "内科",
    "dept_name": "心内科",
    "fjxh": 0
  }
]
```

### 创建排序项

```http
POST /api/kspx
Content-Type: application/json

{
  "xh": 1,
  "parent_dept_name": "内科",
  "dept_name": "心内科",
  "fjxh": 0
}
```

### 更新排序项

```http
PUT /api/kspx/{xh}
```

### 删除排序项

```http
DELETE /api/kspx/{xh}
```

---

## 系统配置

### 获取系统名称

```http
GET /api/system/name
```

**响应示例**:
```json
{
  "name": "医院数据管理系统"
}
```

---

## 错误响应格式

```json
{
  "detail": "错误描述信息"
}
```

### HTTP状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权/登录失效 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
