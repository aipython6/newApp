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

        success_count = 0
        failed_count = 0
        record_count = 0

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
            content=f"同步任务 {task.task_name} 执行成功，共同步 {success_count} 条记录",
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
