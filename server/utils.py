import uuid
import logging
from models import db, Report

logger = logging.getLogger(__name__)

def validate_basic_url(url: str) -> bool:
    return url is not None and url.startswith("http")

def create_new_report(data: dict, user_id: str) -> dict:
    report_id = str(uuid.uuid4())

    try:
        user_id_int = int(user_id)

        new_db_report = Report(
            id=report_id,
            github_url=data['githubUrl'],
            email=data['email'],
            date_range=f"{data['startDate']} - {data['endDate']}",
            status='pending',
            user_id=user_id_int,
        )

        db.session.add(new_db_report)
        db.session.commit()
        logger.info(f"Report request {report_id} added to database for user {user_id_int}")

        return {
            'id': new_db_report.id,
            'githubUrl': new_db_report.github_url,
            'email': new_db_report.email,
            'dateRange': new_db_report.date_range,
            'status': new_db_report.status,
            'createdAt': new_db_report.created_at.isoformat(),
        }

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating report request entry for user {user_id}: {e}", exc_info=True)
        raise

def get_user_reports(user_id: str) -> list:
    try:
        user_id_int = int(user_id)
        user_reports_db = Report.query.filter_by(user_id=user_id_int)\
                                      .order_by(Report.created_at.desc())\
                                      .all()

        reports_list = [
            {
                'id': r.id,
                'githubUrl': r.github_url,
                'email': r.email,
                'dateRange': r.date_range,
                'status': r.status,
                'createdAt': r.created_at.isoformat(),
            } for r in user_reports_db
        ]
        logger.debug(f"Fetched {len(reports_list)} report requests for user {user_id_int}")
        return reports_list

    except Exception as e:
        logger.error(f"Error fetching report requests for user {user_id}: {e}", exc_info=True)
        return []