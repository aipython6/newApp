from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any
from datetime import datetime


class UserBase(BaseModel):
    username: str


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: int
    is_active: bool
    avatar: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class Captcha(BaseModel):
    captcha_key: str
    captcha_code: Optional[str] = None
    captcha_image: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str
    captcha: str
    captcha_key: str


class SourceDBConnectionBase(BaseModel):
    name: str
    db_type: str
    host: str
    port: int
    database: str
    username: Optional[str] = None
    password: Optional[str] = None


class SourceDBConnectionCreate(SourceDBConnectionBase):
    pass


class SourceDBConnection(SourceDBConnectionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TargetDBConnectionBase(BaseModel):
    name: str
    host: str
    port: int
    database: str
    username: Optional[str] = None
    password: Optional[str] = None


class TargetDBConnectionCreate(TargetDBConnectionBase):
    pass


class TargetDBConnection(TargetDBConnectionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SyncTaskBase(BaseModel):
    task_name: str
    source_db_id: int
    target_db_id: int
    source_table: str
    target_table: str
    field_mapping: Dict[str, Any]
    sync_frequency: str
    sync_time: Optional[datetime] = None


class SyncTaskCreate(SyncTaskBase):
    pass


class SyncTaskUpdate(BaseModel):
    task_name: Optional[str] = None
    source_db_id: Optional[int] = None
    target_db_id: Optional[int] = None
    source_table: Optional[str] = None
    target_table: Optional[str] = None
    field_mapping: Optional[Dict[str, Any]] = None
    sync_frequency: Optional[str] = None
    sync_time: Optional[datetime] = None
    is_active: Optional[bool] = None


class SyncTask(SyncTaskBase):
    id: int
    last_sync_status: str
    last_sync_time: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SyncLogBase(BaseModel):
    task_id: int
    status: str
    record_count: int = 0
    success_count: int = 0
    failed_count: int = 0
    error_message: Optional[str] = None


class SyncLogCreate(SyncLogBase):
    pass


class SyncLog(SyncLogBase):
    id: int
    sync_time: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class SystemMessageBase(BaseModel):
    title: str
    content: str
    type: str = "info"


class SystemMessageCreate(SystemMessageBase):
    pass


class SystemMessage(SystemMessageBase):
    id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class KnowledgeDocumentBase(BaseModel):
    title: str
    content: str
    doc_metadata: Optional[Dict[str, Any]] = None


class KnowledgeDocumentCreate(KnowledgeDocumentBase):
    pass


class KnowledgeDocument(KnowledgeDocumentBase):
    id: int
    vector_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class QueryRequest(BaseModel):
    query: str


class ConnectionTestRequest(BaseModel):
    db_type: Optional[str] = None
    host: str
    port: int
    database: str
    username: Optional[str] = None
    password: Optional[str] = None


class TableCreateRequest(BaseModel):
    target_db_id: int
    table_name: str
    create_mode: str
    sql: Optional[str] = None
    columns: Optional[List[Dict[str, Any]]] = None


class DeptMappingBase(BaseModel):
    old_his_id: Optional[str] = None
    old_his_name: Optional[str] = None
    new_his_id: Optional[str] = None
    new_his_name: Optional[str] = None
    jxks_id: Optional[str] = None
    jxks_name: Optional[str] = None
    first_parent_name: Optional[str] = None
    second_parent_name: Optional[str] = None
    category: Optional[str] = None
    source: Optional[str] = None
    version: Optional[str] = None
    is_zb: Optional[bool] = None
    is_delete: Optional[bool] = None


class DeptMappingCreate(DeptMappingBase):
    pass


class DeptMappingUpdate(DeptMappingBase):
    pass


class DeptMapping(DeptMappingBase):
    id: int
    create_time: Optional[datetime] = None

    class Config:
        from_attributes = True


class KspxBase(BaseModel):
    xh: Optional[int] = None
    parent_dept_name: Optional[str] = None
    dept_name: Optional[str] = None
    fjxh: Optional[int] = None


class KspxCreate(KspxBase):
    pass


class KspxUpdate(KspxBase):
    pass


class Kspx(KspxBase):
    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_records: int
    successful_tasks: int
    failed_tasks: int
    total_success_records: int


class UpdatePassword(BaseModel):
    old_password: str
    new_password: str


class UpdateAvatar(BaseModel):
    avatar: str
