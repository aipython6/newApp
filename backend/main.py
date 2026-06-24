from fastapi import FastAPI, Depends, HTTPException, status, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Dict, Any
import pymysql
import uuid
import os
import shutil

from config import get_settings
from database import get_db, init_db
from auth import (
    verify_password, get_password_hash, create_access_token,
    get_current_user, generate_captcha
)
from models import (
    User, SourceDBConnection, TargetDBConnection, SyncTask,
    SyncLog, SystemMessage, KnowledgeDocument, LoginLog
)
from schemas import (
    User as UserSchema, UserCreate, Token, LoginRequest, Captcha,
    SourceDBConnection as SourceDBSchema, SourceDBConnectionCreate,
    TargetDBConnection as TargetDBSchema, TargetDBConnectionCreate,
    SyncTask as SyncTaskSchema, SyncTaskCreate, SyncTaskUpdate,
    SyncLog as SyncLogSchema, SystemMessage as SystemMessageSchema,
    KnowledgeDocument as KnowledgeDocumentSchema, KnowledgeDocumentCreate,
    QueryRequest, ConnectionTestRequest, TableCreateRequest,
    DashboardStats, DeptMapping, DeptMappingCreate, DeptMappingUpdate,
    Kspx, KspxCreate, KspxUpdate, UpdatePassword, UpdateAvatar
)
from db_service import (
    test_connection, get_mysql_tables, get_mysql_columns,
    get_jxks_db_connection, execute_sql
)
from knowledge_service import knowledge_service
from sync_service import setup_scheduler, add_task_to_scheduler, remove_task_from_scheduler

settings = get_settings()

app = FastAPI(title=settings.APP_NAME, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 验证码存储: {captcha_key: (code, expire_time)}
captcha_store = {}
CAPTCHA_EXPIRE_SECONDS = 60


@app.on_event("startup")
def startup_event():
    init_db()
    db = next(get_db())
    if not db.query(User).filter(User.username == "admin").first():
        admin = User(
            username="admin",
            password_hash=get_password_hash("admin123"),
            is_active=True
        )
        db.add(admin)
        db.commit()
    setup_scheduler(db)
    
    # 创建静态文件目录
    static_dir = os.path.join(os.path.dirname(__file__), "static")
    if not os.path.exists(static_dir):
        os.makedirs(static_dir)

# 挂载静态文件
app.mount("/api/static", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "static")), name="static")

# 个人设置相关 API
@app.post("/api/users/me/password")
async def update_password(
    request: UpdatePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(request.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="原密码不正确"
        )
    current_user.password_hash = get_password_hash(request.new_password)
    db.commit()
    return {"message": "密码修改成功"}


@app.post("/api/users/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 确保静态文件目录存在
    static_dir = os.path.join(os.path.dirname(__file__), "static")
    if not os.path.exists(static_dir):
        os.makedirs(static_dir)
    
    # 生成唯一文件名
    file_extension = file.filename.split(".")[-1] if "." in file.filename else "png"
    filename = f"avatar_{current_user.id}_{uuid.uuid4().hex[:8]}.{file_extension}"
    file_path = os.path.join(static_dir, filename)
    
    # 保存文件
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # 更新用户头像
    current_user.avatar = f"/api/static/{filename}"
    db.commit()
    
    return {"avatar": current_user.avatar, "message": "头像上传成功"}


@app.get("/")
async def root():
    return {"message": settings.APP_NAME}


@app.post("/api/auth/captcha", response_model=Captcha)
async def get_captcha():
    captcha_key = str(uuid.uuid4())
    captcha_code, captcha_display = generate_captcha()
    expire_time = datetime.utcnow() + timedelta(seconds=CAPTCHA_EXPIRE_SECONDS)
    captcha_store[captcha_key] = (captcha_code, expire_time)
    return Captcha(captcha_key=captcha_key, captcha_code=captcha_display)


@app.post("/api/auth/login", response_model=Token)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    if request.captcha_key not in captcha_store:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证码错误"
        )
    
    captcha_code, expire_time = captcha_store[request.captcha_key]
    
    # 检查是否过期
    if datetime.utcnow() > expire_time:
        del captcha_store[request.captcha_key]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证码已过期，请重新获取"
        )
    
    # 检查验证码是否正确
    if captcha_code != request.captcha.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证码错误"
        )
    
    del captcha_store[request.captcha_key]

    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )

    login_log = LoginLog(
        user_id=user.id,
        ip_address="127.0.0.1",
        user_agent="Unknown"
    )
    db.add(login_log)
    db.commit()

    access_token = create_access_token(data={"sub": user.username})
    return Token(access_token=access_token, token_type="bearer")


@app.get("/api/users/me", response_model=UserSchema)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@app.get("/api/users", response_model=List[UserSchema])
async def get_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(User).all()


@app.post("/api/users", response_model=UserSchema)
async def create_user(user: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="用户名已存在")
    hashed_password = get_password_hash(user.password)
    db_user = User(username=user.username, password_hash=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.delete("/api/users/{user_id}")
async def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    db.delete(user)
    db.commit()
    return {"message": "删除成功"}


@app.get("/api/source-dbs", response_model=List[SourceDBSchema])
async def get_source_dbs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(SourceDBConnection).all()


@app.post("/api/source-dbs", response_model=SourceDBSchema)
async def create_source_db(db_conn: SourceDBConnectionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_obj = SourceDBConnection(**db_conn.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


@app.put("/api/source-dbs/{db_id}", response_model=SourceDBSchema)
async def update_source_db(db_id: int, db_conn: SourceDBConnectionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_obj = db.query(SourceDBConnection).filter(SourceDBConnection.id == db_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="数据库连接不存在")
    for key, value in db_conn.dict().items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


@app.delete("/api/source-dbs/{db_id}")
async def delete_source_db(db_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_obj = db.query(SourceDBConnection).filter(SourceDBConnection.id == db_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="数据库连接不存在")
    db.delete(db_obj)
    db.commit()
    return {"message": "删除成功"}


@app.post("/api/source-dbs/test")
async def test_source_db_connection(request: ConnectionTestRequest, current_user: User = Depends(get_current_user)):
    success, message = test_connection(
        request.db_type, request.host, request.port, request.database,
        request.username, request.password
    )
    return {"success": success, "message": message}


@app.get("/api/target-dbs", response_model=List[TargetDBSchema])
async def get_target_dbs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(TargetDBConnection).all()


@app.post("/api/target-dbs", response_model=TargetDBSchema)
async def create_target_db(db_conn: TargetDBConnectionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_obj = TargetDBConnection(**db_conn.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


@app.put("/api/target-dbs/{db_id}", response_model=TargetDBSchema)
async def update_target_db(db_id: int, db_conn: TargetDBConnectionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_obj = db.query(TargetDBConnection).filter(TargetDBConnection.id == db_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="数据库连接不存在")
    for key, value in db_conn.dict().items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


@app.delete("/api/target-dbs/{db_id}")
async def delete_target_db(db_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_obj = db.query(TargetDBConnection).filter(TargetDBConnection.id == db_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="数据库连接不存在")
    db.delete(db_obj)
    db.commit()
    return {"message": "删除成功"}


@app.post("/api/target-dbs/test")
async def test_target_db_connection(request: ConnectionTestRequest, current_user: User = Depends(get_current_user)):
    success, message = test_connection(
        "mysql8", request.host, request.port, request.database,
        request.username, request.password
    )
    return {"success": success, "message": message}


@app.post("/api/target-dbs/create-table")
async def create_table(request: TableCreateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    target_db = db.query(TargetDBConnection).filter(TargetDBConnection.id == request.target_db_id).first()
    if not target_db:
        raise HTTPException(status_code=404, detail="目标数据库不存在")

    if request.create_mode == "sql" and request.sql:
        success, message = execute_sql(
            target_db.host, target_db.port, target_db.database,
            target_db.username or "", target_db.password or "", request.sql
        )
    elif request.create_mode == "ui" and request.columns:
        sql = f"CREATE TABLE {request.table_name} ("
        column_defs = []
        for col in request.columns:
            col_def = f"{col['name']} {col['type']}"
            if col.get('primary_key'):
                col_def += " PRIMARY KEY"
            if col.get('auto_increment'):
                col_def += " AUTO_INCREMENT"
            column_defs.append(col_def)
        sql += ", ".join(column_defs) + ")"
        success, message = execute_sql(
            target_db.host, target_db.port, target_db.database,
            target_db.username or "", target_db.password or "", sql
        )
    else:
        raise HTTPException(status_code=400, detail="无效的创建模式")

    return {"success": success, "message": message}


@app.get("/api/sync-tasks", response_model=List[SyncTaskSchema])
async def get_sync_tasks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(SyncTask).all()


@app.post("/api/sync-tasks", response_model=SyncTaskSchema)
async def create_sync_task(task: SyncTaskCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_task = SyncTask(**task.dict())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    add_task_to_scheduler(db_task, db)
    return db_task


@app.put("/api/sync-tasks/{task_id}", response_model=SyncTaskSchema)
async def update_sync_task(task_id: int, task_update: SyncTaskUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_task = db.query(SyncTask).filter(SyncTask.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="同步任务不存在")
    for key, value in task_update.dict(exclude_unset=True).items():
        setattr(db_task, key, value)
    db.commit()
    db.refresh(db_task)
    add_task_to_scheduler(db_task, db)
    return db_task


@app.delete("/api/sync-tasks/{task_id}")
async def delete_sync_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_task = db.query(SyncTask).filter(SyncTask.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="同步任务不存在")
    remove_task_from_scheduler(task_id)
    db.delete(db_task)
    db.commit()
    return {"message": "删除成功"}


@app.get("/api/sync-logs", response_model=List[SyncLogSchema])
async def get_sync_logs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(SyncLog).order_by(SyncLog.created_at.desc()).limit(100).all()


@app.get("/api/messages", response_model=List[SystemMessageSchema])
async def get_messages(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(SystemMessage).order_by(SystemMessage.created_at.desc()).limit(50).all()


@app.put("/api/messages/{msg_id}/read")
async def mark_message_read(msg_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    msg = db.query(SystemMessage).filter(SystemMessage.id == msg_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="消息不存在")
    msg.is_read = True
    db.commit()
    return {"message": "标记成功"}


@app.get("/api/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    logs = db.query(SyncLog).filter(SyncLog.sync_time >= month_start).all()
    total_records = sum(log.record_count for log in logs)
    total_success_records = sum(log.success_count for log in logs)

    tasks = db.query(SyncTask).all()
    successful_tasks = len([t for t in tasks if t.last_sync_status == "success"])
    failed_tasks = len([t for t in tasks if t.last_sync_status == "failed"])

    return DashboardStats(
        total_records=total_records,
        successful_tasks=successful_tasks,
        failed_tasks=failed_tasks,
        total_success_records=total_success_records
    )


@app.get("/api/knowledge/documents", response_model=List[KnowledgeDocumentSchema])
async def get_knowledge_documents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(KnowledgeDocument).all()


@app.post("/api/knowledge/documents", response_model=KnowledgeDocumentSchema)
async def create_knowledge_document(doc: KnowledgeDocumentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_doc = KnowledgeDocument(**doc.dict())
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)

    vector_id = knowledge_service.add_document(
        str(db_doc.id),
        doc.content,
        doc.doc_metadata
    )
    db_doc.vector_id = vector_id
    db.commit()
    db.refresh(db_doc)

    return db_doc


@app.delete("/api/knowledge/documents/{doc_id}")
async def delete_knowledge_document(doc_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(KnowledgeDocument).filter(KnowledgeDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="文档不存在")
    if doc.vector_id:
        knowledge_service.delete_document(doc.vector_id)
    db.delete(doc)
    db.commit()
    return {"message": "删除成功"}


@app.post("/api/knowledge/query")
async def query_knowledge(request: QueryRequest, current_user: User = Depends(get_current_user)):
    results = knowledge_service.search_documents(request.query)
    return {"results": results}


@app.get("/api/depts", response_model=List[DeptMapping])
async def get_depts(current_user: User = Depends(get_current_user)):
    conn = get_jxks_db_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    cursor.execute("SELECT * FROM sys_depts WHERE is_delete = 0 OR is_delete IS NULL")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows


@app.post("/api/depts", response_model=Dict)
async def create_dept(dept: DeptMappingCreate, current_user: User = Depends(get_current_user)):
    conn = get_jxks_db_connection()
    cursor = conn.cursor()
    columns = []
    values = []
    placeholders = []
    for key, value in dept.dict(exclude_unset=True).items():
        columns.append(key)
        values.append(value)
        placeholders.append("%s")
    sql = f"INSERT INTO sys_depts ({', '.join(columns)}) VALUES ({', '.join(placeholders)})"
    cursor.execute(sql, values)
    conn.commit()
    new_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return {"id": new_id, **dept.dict()}


@app.put("/api/depts/{dept_id}", response_model=Dict)
async def update_dept(dept_id: int, dept: DeptMappingUpdate, current_user: User = Depends(get_current_user)):
    conn = get_jxks_db_connection()
    cursor = conn.cursor()
    updates = []
    values = []
    for key, value in dept.dict(exclude_unset=True).items():
        updates.append(f"{key} = %s")
        values.append(value)
    values.append(dept_id)
    sql = f"UPDATE sys_depts SET {', '.join(updates)} WHERE id = %s"
    cursor.execute(sql, values)
    conn.commit()
    cursor.close()
    conn.close()
    return {"id": dept_id, **dept.dict()}


@app.delete("/api/depts/{dept_id}")
async def delete_dept(dept_id: int, current_user: User = Depends(get_current_user)):
    conn = get_jxks_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE sys_depts SET is_delete = 1 WHERE id = %s", (dept_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "删除成功"}


@app.get("/api/kspx", response_model=List[Kspx])
async def get_kspx(current_user: User = Depends(get_current_user)):
    conn = get_jxks_db_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    cursor.execute("SELECT * FROM kspx")
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows


@app.post("/api/kspx", response_model=Dict)
async def create_kspx(kspx: KspxCreate, current_user: User = Depends(get_current_user)):
    conn = get_jxks_db_connection()
    cursor = conn.cursor()
    columns = []
    values = []
    placeholders = []
    for key, value in kspx.dict(exclude_unset=True).items():
        columns.append(key)
        values.append(value)
        placeholders.append("%s")
    sql = f"INSERT INTO kspx ({', '.join(columns)}) VALUES ({', '.join(placeholders)})"
    cursor.execute(sql, values)
    conn.commit()
    cursor.close()
    conn.close()
    return kspx.dict()


@app.put("/api/kspx/{xh}", response_model=Dict)
async def update_kspx(xh: int, kspx: KspxUpdate, current_user: User = Depends(get_current_user)):
    conn = get_jxks_db_connection()
    cursor = conn.cursor()
    updates = []
    values = []
    for key, value in kspx.dict(exclude_unset=True).items():
        updates.append(f"{key} = %s")
        values.append(value)
    values.append(xh)
    sql = f"UPDATE kspx SET {', '.join(updates)} WHERE xh = %s"
    cursor.execute(sql, values)
    conn.commit()
    cursor.close()
    conn.close()
    return {"xh": xh, **kspx.dict()}


@app.delete("/api/kspx/{xh}")
async def delete_kspx(xh: int, current_user: User = Depends(get_current_user)):
    conn = get_jxks_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM kspx WHERE xh = %s", (xh,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "删除成功"}


@app.get("/api/system/name")
async def get_system_name():
    return {"name": settings.APP_NAME}
