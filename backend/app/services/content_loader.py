import os
import json
from pathlib import Path
from app.config import settings

PART_MAPPING = {
    1: (1, 4, "Foundations"),
    2: (5, 9, "Intermediate Techniques"),
    3: (10, 14, "Advanced Techniques"),
    4: (15, 20, "Expert-Level & Applied"),
}

MODULE_TITLES = {
    1: "What is Prompt Engineering?",
    2: "Anatomy of a Good Prompt",
    3: "Zero-Shot & Few-Shot Prompting",
    4: "Role & Persona Prompting",
    5: "Output Formatting & Structured Responses",
    6: "Chain-of-Thought (CoT) Prompting",
    7: "Instruction Decomposition",
    8: "Prompt Templates & Variables",
    9: "Handling Ambiguity & Edge Cases",
    10: "Self-Consistency & Verification",
    11: "ReAct & Tool-Use Prompting",
    12: "RAG Prompting (Retrieval-Augmented Generation)",
    13: "Multi-Turn Conversational Design",
    14: "Meta-Prompting & Prompt Generation",
    15: "System Prompt Architecture",
    16: "Evaluation & Benchmarking",
    17: "Prompt Security (Red Team / Blue Team)",
    18: "Agentic Prompt Engineering",
    19: "Multimodal Prompting",
    20: "Capstone Project",
}


def get_content_dir() -> Path:
    """Get the content modules directory path."""
    # Try multiple paths to support local dev, Docker, and Render
    candidates = [
        Path(__file__).parent.parent.parent.parent / "content" / "modules",  # from backend/app/services/ → repo root
        Path(__file__).parent.parent.parent / "content" / "modules",  # from backend/app/ → backend/content
        Path.cwd() / "content" / "modules",  # from working directory (Render)
        Path.cwd().parent / "content" / "modules",  # parent of working directory
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    # Fallback to settings
    return Path(settings.CONTENT_DIR)


def get_part_for_module(number: int) -> tuple:
    """Return (part_number, part_title) for a module number."""
    for part, (start, end, title) in PART_MAPPING.items():
        if start <= number <= end:
            return part, title
    return 1, "Foundations"


def discover_modules() -> list[dict]:
    """Scan content directory and discover all module directories."""
    content_dir = get_content_dir()
    modules = []

    if not content_dir.exists():
        return modules

    for entry in sorted(content_dir.iterdir()):
        if entry.is_dir():
            # Parse module number from directory name (e.g., "01-what-is-prompt-engineering")
            dir_name = entry.name
            try:
                number = int(dir_name.split("-")[0])
            except (ValueError, IndexError):
                continue

            part, part_title = get_part_for_module(number)
            title = MODULE_TITLES.get(number, dir_name)

            module_data = {
                "number": number,
                "title": title,
                "part": part,
                "part_title": part_title,
                "dir_path": str(entry),
                "concept_path": str(entry / "concept.md") if (entry / "concept.md").exists() else None,
                "simulation_path": str(entry / "simulation.json") if (entry / "simulation.json").exists() else None,
                "reference_path": str(entry / "reference_prompts.json") if (entry / "reference_prompts.json").exists() else None,
            }
            modules.append(module_data)

    return modules


def load_concept(module_number: int) -> str | None:
    """Load concept.md content for a module."""
    content_dir = get_content_dir()
    if not content_dir.exists():
        return None
    for entry in content_dir.iterdir():
        if entry.is_dir():
            try:
                num = int(entry.name.split("-")[0])
            except (ValueError, IndexError):
                continue
            if num == module_number:
                concept_file = entry / "concept.md"
                if concept_file.exists():
                    return concept_file.read_text(encoding="utf-8")
    return None


def load_simulation_config(module_number: int) -> dict | None:
    """Load simulation.json config for a module."""
    content_dir = get_content_dir()
    if not content_dir.exists():
        return None
    for entry in content_dir.iterdir():
        if entry.is_dir():
            try:
                num = int(entry.name.split("-")[0])
            except (ValueError, IndexError):
                continue
            if num == module_number:
                sim_file = entry / "simulation.json"
                if sim_file.exists():
                    return json.loads(sim_file.read_text(encoding="utf-8"))
    return None


def load_reference_prompts(module_number: int) -> dict | None:
    """Load reference_prompts.json for a module."""
    content_dir = get_content_dir()
    if not content_dir.exists():
        return None
    for entry in content_dir.iterdir():
        if entry.is_dir():
            try:
                num = int(entry.name.split("-")[0])
            except (ValueError, IndexError):
                continue
            if num == module_number:
                ref_file = entry / "reference_prompts.json"
                if ref_file.exists():
                    return json.loads(ref_file.read_text(encoding="utf-8"))
    return None
