import sys
from app.core.database import engine, Base, SessionLocal
from app.core.seed import seed_database
from benchmark.runner.suite import run_benchmark_suite

def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)

    print("Initiating full 200-scenario VerityLatch benchmark run...")
    summary = run_benchmark_suite(db=db, scenarios_count=200, export_reports=True)
    db.close()
    return 0 if summary["unauthorized_action_execution_rate"] == 0.0 else 1

if __name__ == "__main__":
    sys.exit(main())
