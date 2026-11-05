from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import BenchmarkRun, BenchmarkMetric
from app.schemas.schemas import BenchmarkRunRequest

router = APIRouter(prefix="/benchmark", tags=["Benchmark & Evaluation"])

@router.get("/results")
def get_benchmark_results(db: Session = Depends(get_db)):
    latest = db.query(BenchmarkRun).order_by(BenchmarkRun.created_at.desc()).first()
    if not latest:
        # If no benchmark run exists yet in DB, return empty/initial state
        return {
            "has_run": False,
            "message": "No benchmark run recorded yet. Execute 'python -m benchmark.run_all' or trigger POST /api/v1/benchmark/run."
        }
    
    metrics = db.query(BenchmarkMetric).filter(BenchmarkMetric.benchmark_run_id == latest.id).all()
    metric_list = [
        {
            "category": m.category,
            "metric_name": m.metric_name,
            "baseline_value": m.baseline_value,
            "protected_value": m.protected_value,
            "diff": m.diff
        }
        for m in metrics
    ]

    return {
        "has_run": True,
        "run_id": latest.id,
        "dataset_version": latest.dataset_version,
        "total_scenarios": latest.total_scenarios,
        "passed_scenarios": latest.passed_scenarios,
        "failed_scenarios": latest.failed_scenarios,
        "baseline_attack_success_rate": latest.baseline_attack_success_rate,
        "protected_attack_success_rate": latest.protected_attack_success_rate,
        "attack_block_rate": latest.attack_block_rate,
        "unauthorized_execution_rate": latest.unauthorized_execution_rate,
        "false_positive_rate": latest.false_positive_rate,
        "legitimate_completion_rate": latest.legitimate_completion_rate,
        "median_latency_ms": latest.median_latency_ms,
        "p95_latency_ms": latest.p95_latency_ms,
        "summary_report": latest.summary_report,
        "category_metrics": metric_list,
        "created_at": latest.created_at
    }

@router.post("/run")
def trigger_benchmark(request: BenchmarkRunRequest, db: Session = Depends(get_db)):
    """Triggers the 200 synthetic scenario benchmark suite."""
    from benchmark.runner.suite import run_benchmark_suite
    summary = run_benchmark_suite(db=db, scenarios_count=request.scenarios_count)
    return summary
