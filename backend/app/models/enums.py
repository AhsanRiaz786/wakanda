from enum import StrEnum


class SourceType(StrEnum):
    PDF_REPORT = "pdf_report"
    WEB_ARTICLE = "web_article"
    CSV_JSON = "csv_json"
    TABLE_DASHBOARD = "table_dashboard"
    REALTIME_FEED = "realtime_feed"


class IncidentType(StrEnum):
    ROAD_BLOCKAGE = "road_blockage"
    POWER_OUTAGE = "power_outage"
    WATER_LEAK = "water_leak"
    ACCIDENT = "accident"
    OTHER = "other"
    UNKNOWN = "unknown"


class Severity(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
    UNKNOWN = "unknown"


class IncidentStatus(StrEnum):
    REPORTED = "reported"
    TRIAGED = "triaged"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"


class ActionStepType(StrEnum):
    VALIDATE_INCIDENT = "validate_incident"
    NOTIFY_DEPARTMENT = "notify_department"
    DISPATCH_CREW = "dispatch_crew"
    MANAGE_ROAD_IMPACT = "manage_road_impact"
    SCHEDULE_FOLLOWUP = "schedule_followup"


class TraceStepType(StrEnum):
    LLM_CALL = "llm_call"
    TOOL_CALL = "tool_call"
    DECISION = "decision"
    STATE_UPDATE = "state_update"
    ERROR = "error"


class TraceStepStatus(StrEnum):
    SUCCESS = "success"
    WARNING = "warning"
    FAILURE = "failure"
