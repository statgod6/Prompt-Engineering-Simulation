from sqlalchemy.orm import Session
from app.models.models import Module, Simulation
from app.services.content_loader import discover_modules, load_simulation_config


def seed_modules(db: Session):
    """Seed the database with module and simulation data from content files."""
    modules = discover_modules()

    for mod_data in modules:
        # Check if module already exists
        existing = db.query(Module).filter(Module.number == mod_data["number"]).first()
        if existing:
            # Update existing module
            existing.title = mod_data["title"]
            existing.part = mod_data["part"]
            existing.part_title = mod_data["part_title"]
            continue

        # Create new module
        module = Module(
            number=mod_data["number"],
            title=mod_data["title"],
            part=mod_data["part"],
            part_title=mod_data["part_title"],
            description=f"Part {mod_data['part']}: {mod_data['part_title']}",
            pass_threshold=0.7,
            unlock_after=mod_data["number"] - 1 if mod_data["number"] > 1 else None,
            order_index=mod_data["number"],
        )
        db.add(module)
        db.flush()  # Get the module ID

        # Load and create simulation if config exists
        sim_config = load_simulation_config(mod_data["number"])
        if sim_config:
            simulation = Simulation(
                sim_id=sim_config.get("id", f"sim-{mod_data['number']:02d}"),
                module_id=module.id,
                title=sim_config.get("title", f"Simulation {mod_data['number']}"),
                type=sim_config.get("type", "free_lab"),
                instructions=sim_config.get("instructions", ""),
                config_json=sim_config,
                default_model=sim_config.get("default_model", "openai/gpt-4o"),
                allowed_models=sim_config.get("allowed_models", []),
            )
            db.add(simulation)

    db.commit()
    print(f"Seeded {len(modules)} modules")
