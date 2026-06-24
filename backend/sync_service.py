from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from datetime import datetime
import logging
from models import SyncTask, SyncLog, SystemMessage
from db_service import test_mysql_connection, get_mysql_columns
import pymysql

logger = logging.getLogger(__name__)
scheduler = BackgroundScheduler()


def sync_task_executor(task_id: int, db: Session):
    task = db.query(SyncTask).filter(SyncTask.id == task_id).first()
    if not task:
        return

    try:
        source_conn = db.query(
            __import__('models').models.SourceDBConnection
        ).filter_by(id=task.source_db_id).first()
        target_conn = db.query(
            __import__('models').models.TargetDBConnection
        ).filter_by(id=task.target_db_id).first()

        if not source_conn or not target_conn:
            raise Exception("数据库连接不存在")

        # 使用源数据库的 database 字段连接数据库
        source_db = pymysql.connect(
            host=source_conn.host,
            port=source_conn.port,
            user=source_conn.username,
            password=source_conn.password,
            database=source_conn.database
        )
        target_db = pymysql.connect(
            host=target_conn.host,
            port=target_conn.port,
            user=target_conn.username,
            password=target_conn.password,
            database=target_conn.database
        )

        source_cursor = source_db.cursor(pymysql.cursors.DictCursor)
        target_cursor = target_db.cursor()

        # 获取源表数据
        source_cursor.execute(f"SELECT * FROM {task.source_table}")
        source_data = source_cursor.fetchall()

        success_count = 0
        failed_count = 0
        record_count = len(source_data)

        if record_count > 0:
            # 处理字段映射
            field_mapping = task.field_mapping or {}
            source_columns = list(source_data[0].keys())
            
            # 如果没有指定映射，使用默认映射
            if not field_mapping:
                field_mapping = {col: col for col in source_columns}
            
            # 构建插入语句
            target_columns = list(field_mapping.values())
            placeholders = ', '.join(['%s'] * len(target_columns))
            insert_sql = f"INSERT INTO {task.target_table} ({', '.join(target_columns)}) VALUES ({placeholders})"
            
            # 执行同步
            for row in source_data:
                try:
                    values = [row[src_col] for src_col in field_mapping.keys()]
                    target_cursor.execute(insert_sql, values)
                    success_count += 1
                except Exception as e:
                    logger.error(f"同步行失败: {str(e)}")
                    failed_count += 1
            
            target_db.commit()

        # 关闭连接
        source_cursor.close()
        target_cursor.close()
        source_db.close()
        target_db.close()

        sync_log = SyncLog(
            task_id=task.id,
            status="success",
            record_count=record_count,
            success_count=success_count,
            failed_count=failed_count
        )
        db.add(sync_log)

        task.last_sync_status = "success"
        task.last_sync_time = datetime.utcnow()

        message = SystemMessage(
            title=f"同步任务完成: {task.task_name}",
            content=f"同步任务 {task.task_name} 执行成功，共同步 {record_count} 条记录，成功 {success_count} 条，失败 {failed_count} 条",
            type="success"
        )
        db.add(message)

        db.commit()

    except Exception as e:
        logger.error(f"同步任务 {task_id} 执行失败: {str(e)}")
        sync_log = SyncLog(
            task_id=task.id,
            status="failed",
            error_message=str(e)
        )
        db.add(sync_log)

        task.last_sync_status = "failed"
        task.last_sync_time = datetime.utcnow()

        message = SystemMessage(
            title=f"同步任务失败: {task.task_name}",
            content=f"同步任务 {task.task_name} 执行失败: {str(e)}",
            type="error"
        )
        db.add(message)

        db.commit()


def setup_scheduler(db: Session):
    if not scheduler.running:
        scheduler.start()

    tasks = db.query(SyncTask).filter(SyncTask.is_active == True).all()
    for task in tasks:
        add_task_to_scheduler(task, db)


def add_task_to_scheduler(task: SyncTask, db: Session):
    job_id = f"sync_task_{task.id}"

    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)

    def job_func():
        from database import SessionLocal
        db_session = SessionLocal()
        try:
            sync_task_executor(task.id, db_session)
        finally:
            db_session.close()

    if task.sync_frequency == "daily":
        if task.sync_time:
            scheduler.add_job(
                job_func,
                trigger=CronTrigger(
                    hour=task.sync_time.hour,
                    minute=task.sync_time.minute,
                    second=task.sync_time.second
                ),
                id=job_id,
                replace_existing=True
            )
    elif task.sync_frequency.startswith("weekly"):
        day_of_week = task.sync_frequency.split("_")[1] if "_" in task.sync_frequency else 0
        if task.sync_time:
            scheduler.add_job(
                job_func,
                trigger=CronTrigger(
                    day_of_week=day_of_week,
                    hour=task.sync_time.hour,
                    minute=task.sync_time.minute,
                    second=task.sync_time.second
                ),
                id=job_id,
                replace_existing=True
            )
    elif task.sync_frequency.startswith("monthly"):
        day = task.sync_frequency.split("_")[1] if "_" in task.sync_frequency else 1
        if task.sync_time:
            scheduler.add_job(
                job_func,
                trigger=CronTrigger(
                    day=day,
                    hour=task.sync_time.hour,
                    minute=task.sync_time.minute,
                    second=task.sync_time.second
                ),
                id=job_id,
                replace_existing=True
            )


def remove_task_from_scheduler(task_id: int):
    job_id = f"sync_task_{task_id}"
    if scheduler.get_job(job_id):
        scheduler.remove_job(job_id)
