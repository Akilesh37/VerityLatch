from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.entities import PolicyDefinition, PolicyVersion, User
from app.schemas.schemas import PolicyResponse, PolicyCreate, PolicyUpdate
from app.api.deps import require_roles

router = APIRouter(prefix="/policies", tags=["Policy Management"])

@router.get("", response_model=List[PolicyResponse])
def list_policies(db: Session = Depends(get_db)):
    policies = db.query(PolicyDefinition).order_by(PolicyDefinition.priority.asc()).all()
    return policies

@router.get("/{policy_id}", response_model=PolicyResponse)
def get_policy(policy_id: str, db: Session = Depends(get_db)):
    policy = db.query(PolicyDefinition).filter(PolicyDefinition.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policy

@router.post("", response_model=PolicyResponse, status_code=status.HTTP_201_CREATED)
def create_policy(
    policy_in: PolicyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Enterprise Administrator"]))
):
    existing = db.query(PolicyDefinition).filter(PolicyDefinition.id == policy_in.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Policy with this ID already exists")

    policy = PolicyDefinition(
        id=policy_in.id,
        name=policy_in.name,
        description=policy_in.description,
        category=policy_in.category,
        rego_code=policy_in.rego_code,
        priority=policy_in.priority,
        is_active=policy_in.is_active
    )
    db.add(policy)
    db.flush()

    # Create initial version
    version = PolicyVersion(
        policy_id=policy.id,
        version=1,
        rego_code=policy.rego_code,
        author=current_user.email,
        change_summary="Initial policy creation"
    )
    db.add(version)
    db.commit()
    db.refresh(policy)
    return policy

@router.patch("/{policy_id}", response_model=PolicyResponse)
def update_policy(
    policy_id: str,
    policy_in: PolicyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Enterprise Administrator"]))
):
    policy = db.query(PolicyDefinition).filter(PolicyDefinition.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    rego_changed = policy_in.rego_code is not None and policy_in.rego_code != policy.rego_code

    update_data = policy_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(policy, field, value)

    if rego_changed:
        latest_version = db.query(PolicyVersion).filter(PolicyVersion.policy_id == policy.id).count()
        new_version = PolicyVersion(
            policy_id=policy.id,
            version=latest_version + 1,
            rego_code=policy.rego_code,
            author=current_user.email,
            change_summary="Policy updated via admin console"
        )
        db.add(new_version)

    policy.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(policy)
    return policy
