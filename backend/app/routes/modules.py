from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.models import Module, Simulation, UserProgress
from ..schemas.modules import ModuleResponse, SimulationResponse, ModuleDetailResponse
from ..services.content_loader import load_concept

router = APIRouter()


def _resolve_module_status(
    module: Module, progress: UserProgress | None, completed_numbers: set[int]
) -> str:
    """Determine module status based on unlock_after and user progress."""
    if progress and progress.completed:
        return "completed"
    # Check unlock condition
    if module.unlock_after is None:
        return "completed" if (progress and progress.completed) else "available"
    if module.unlock_after in completed_numbers:
        return "completed" if (progress and progress.completed) else "available"
    return "locked"


@router.get("/modules", response_model=list[ModuleResponse])
async def list_modules(db: Session = Depends(get_db)):
    """List all modules with user progress for user_id=1."""
    modules = db.query(Module).order_by(Module.order_index, Module.number).all()

    # Get all progress for user 1
    progress_records = (
        db.query(UserProgress)
        .filter(UserProgress.user_id == 1)
        .all()
    )
    progress_map = {p.module_id: p for p in progress_records}

    # Determine which modules are completed
    completed_numbers: set[int] = set()
    for p in progress_records:
        if p.completed:
            mod = next((m for m in modules if m.id == p.module_id), None)
            if mod:
                completed_numbers.add(mod.number)

    result = []
    for mod in modules:
        prog = progress_map.get(mod.id)
        status = _resolve_module_status(mod, prog, completed_numbers)
        result.append(ModuleResponse(
            id=mod.id,
            number=mod.number,
            title=mod.title,
            part=mod.part,
            part_title=mod.part_title,
            description=mod.description,
            pass_threshold=mod.pass_threshold,
            unlock_after=mod.unlock_after,
            status=status,
            best_score=prog.best_score if prog else 0.0,
            attempts=prog.attempts if prog else 0,
        ))

    return result


@router.get("/modules/{module_id}", response_model=ModuleDetailResponse)
async def get_module_detail(module_id: int, db: Session = Depends(get_db)):
    """Get detailed module info including simulation and concept content."""
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    # User progress
    progress = (
        db.query(UserProgress)
        .filter(UserProgress.user_id == 1, UserProgress.module_id == module_id)
        .first()
    )

    # Completed modules for status resolution
    completed_numbers: set[int] = set()
    all_progress = db.query(UserProgress).filter(
        UserProgress.user_id == 1, UserProgress.completed == True
    ).all()
    for p in all_progress:
        mod = db.query(Module).filter(Module.id == p.module_id).first()
        if mod:
            completed_numbers.add(mod.number)

    status = _resolve_module_status(module, progress, completed_numbers)
    concept_content = load_concept(module.number)

    module_resp = ModuleResponse(
        id=module.id,
        number=module.number,
        title=module.title,
        part=module.part,
        part_title=module.part_title,
        description=module.description,
        pass_threshold=module.pass_threshold,
        unlock_after=module.unlock_after,
        status=status,
        best_score=progress.best_score if progress else 0.0,
        attempts=progress.attempts if progress else 0,
    )

    sim_resp = None
    if module.simulation:
        sim = module.simulation
        sim_resp = SimulationResponse(
            id=sim.id,
            sim_id=sim.sim_id,
            title=sim.title,
            type=sim.type,
            instructions=sim.instructions,
            config_json=sim.config_json,
            default_model=sim.default_model,
            allowed_models=sim.allowed_models,
            concept_content=concept_content,
        )

    return ModuleDetailResponse(
        module=module_resp,
        simulation=sim_resp,
        concept_content=concept_content,
    )


@router.get("/modules/{module_id}/simulation", response_model=SimulationResponse)
async def get_simulation(module_id: int, db: Session = Depends(get_db)):
    """Get simulation config for a module."""
    sim = db.query(Simulation).filter(Simulation.module_id == module_id).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation not found for this module")

    concept_content = None
    if sim.module:
        concept_content = load_concept(sim.module.number)

    return SimulationResponse(
        id=sim.id,
        sim_id=sim.sim_id,
        title=sim.title,
        type=sim.type,
        instructions=sim.instructions,
        config_json=sim.config_json,
        default_model=sim.default_model,
        allowed_models=sim.allowed_models,
        concept_content=concept_content,
    )
