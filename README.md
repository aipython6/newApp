# 医院数据管理系统

一个功能完整的医院数据管理系统，支持多源数据同步、科室管理和智能知识库功能。

## 功能特性

### 核心功能
- ✅ 用户登录与认证 (JWT Token)
- ✅ 验证码支持
- ✅ 仪表盘数据统计
- ✅ 多源数据库连接管理
  - OceanBase
  - StarRocks
  - MySQL 5.7/8.0
  - Oracle 11g/9c
  - SQL Server 2008+
- ✅ 目标数据库管理 (MySQL 8)
- ✅ 数据同步任务配置与调度
- ✅ 同步日志监控
- ✅ 科室映射管理
- ✅ 科室排序管理
- ✅ 智能知识库 (基于向量搜索)

### 技术栈

#### 前端
- React 18 + TypeScript
- Ant Design 5.x
- Monaco Editor
- React Router v6
- Axios
- Recharts
- Vite

#### 后端
- Python 3.11+
- FastAPI
- SQLAlchemy 2.0
- SQLite
- APScheduler
- ChromaDB
- JWT Authentication

## 快速开始

### 前置要求
- Docker 20.10+
- Docker Compose 2.0+

### Docker Compose 部署

1. 克隆项目
```bash
cd /home/aaa/myapp/traeProject
```

2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，修改相关配置
```

3. 启动服务
```bash
docker-compose up -d --build
```

4. 访问系统
- 前端: http://localhost:3000
- 后端API: http://localhost:8000
- API文档: http://localhost:8000/docs

默认账号:
- 用户名: `admin`
- 密码: `admin123`

### 本地运行（推荐 ⭐）

#### 前置要求
- Python 3.11+ (推荐使用 conda 环境: `meta`)
- Node.js 18+

#### 方式一：使用启动脚本（最简单）

```bash
# 1. 激活 conda 环境（如果使用）
conda activate meta

# 2. 启动后端（终端 1
./start-backend.sh

# 3. 启动前端（终端 2）
./start-frontend.sh

# 或者使用 tmux/screen 同时启动（可选）
./start-all.sh
```

#### 方式二：手动启动后端

```bash
cd backend

# 如果使用 conda 环境
conda activate meta

# 安装依赖（首次运行）
pip install -r requirements.txt

# 启动方式 1: 使用 Python 脚本
python start.py

# 启动方式 2: 使用 shell 脚本
./start.sh

# 启动方式 3: 直接使用 uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 方式三：手动启动前端

```bash
cd frontend

# 安装依赖（首次运行）
npm install

# 启动方式 1: npm start（新增）
npm start

# 启动方式 2: npm run dev
npm run dev

# 启动方式 3: 使用脚本
./start.sh
```

### Docker Compose 部署

## 项目结构

```
traeProject/
├── backend/                 # 后端服务
│   ├── main.py             # FastAPI 应用入口
│   ├── start.py            # Python 启动脚本
│   ├── start.sh            # Shell 启动脚本
│   ├── config.py           # 配置管理
│   ├── models.py           # SQLAlchemy 模型
│   ├── schemas.py          # Pydantic 模式
│   ├── auth.py             # 认证模块
│   ├── database.py         # 数据库连接
│   ├── db_service.py       # 数据库服务
│   ├── sync_service.py     # 同步服务
│   ├── knowledge_service.py # 知识服务
│   └── requirements.txt    # Python 依赖
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── components/     # 公共组件
│   │   ├── pages/          # 页面组件
│   │   ├── api/            # API 调用
│   │   └── main.tsx        # 应用入口
│   ├── start.sh            # 启动脚本
│   └── package.json
├── docs/                   # 项目文档
│   ├── 系统架构文档.md
│   ├── API文档.md
│   ├── 数据库表设计文档.md
│   └── 系统部署文档.md
├── start-backend.sh       # 后端启动脚本
├── start-frontend.sh      # 前端启动脚本
├── start-all.sh           # 一键启动脚本
├── docker-compose.yml      # Docker Compose 配置
└── README.md              # 项目说明
```

## 文档

- [系统架构文档](./docs/系统架构文档.md)
- [API文档](./docs/API文档.md)
- [数据库表设计文档](./docs/数据库表设计文档.md)
- [系统部署文档](./docs/系统部署文档.md)

## 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| APP_NAME | 应用名称 | 医院数据管理系统 |
| DEBUG | 调试模式 | false |
| SECRET_KEY | JWT密钥 | - |
| ACCESS_TOKEN_EXPIRE_MINUTES | Token过期时间(分钟) | 1440 |
| MYSQL_HOST | 外部MySQL主机 | 192.168.100.76 |
| MYSQL_PORT | 外部MySQL端口 | 3306 |
| MYSQL_USER | 外部MySQL用户 | root |
| MYSQL_PASSWORD | 外部MySQL密码 | 123456 |
| MYSQL_DATABASE | 外部MySQL数据库 | jxks |

## 开发计划

- [ ] 支持更多数据库类型
- [ ] 数据同步进度可视化
- [ ] 更丰富的图表展示
- [ ] 操作审计日志
- [ ] 多租户支持
- [ ] 数据质量检查

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交 Issue。
