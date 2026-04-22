"""
Populate reference tables with initial data.

Usage (from backend/ directory):
    python seed_data.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models.models import Exercise, ExerciseCategory, GoalType, WorkoutType


def seed_workout_types(db):
    data = [
        ("strength", "Силовая"),
        ("cardio", "Кардио"),
        ("functional", "Функциональная"),
    ]
    for code, name in data:
        exists = db.query(WorkoutType).filter(WorkoutType.code == code).first()
        if not exists:
            db.add(WorkoutType(code=code, name=name))
    db.commit()
    print(f"workout_types: seeded {len(data)} rows (skipped existing)")


def seed_exercise_categories(db):
    data = [
        ("chest", "Грудь"),
        ("back", "Спина"),
        ("legs", "Ноги"),
        ("shoulders", "Плечи"),
        ("arms", "Руки"),
        ("core", "Кор"),
        ("cardio", "Кардио"),
    ]
    for code, name in data:
        exists = db.query(ExerciseCategory).filter(ExerciseCategory.code == code).first()
        if not exists:
            db.add(ExerciseCategory(code=code, name=name))
    db.commit()
    print(f"exercise_categories: seeded {len(data)} rows (skipped existing)")


def seed_goal_types(db):
    data = [
        ("weight_loss", "Снижение веса"),
        ("weight_gain", "Набор массы"),
        ("weekly_workouts", "Тренировки в неделю"),
        ("weight_maintain", "Поддержание веса"),
    ]
    for code, name in data:
        exists = db.query(GoalType).filter(GoalType.code == code).first()
        if not exists:
            db.add(GoalType(code=code, name=name))
    db.commit()
    print(f"goal_types: seeded {len(data)} rows (skipped existing)")


def seed_exercises(db):
    # Map category code → category id
    categories = {cat.code: cat.id for cat in db.query(ExerciseCategory).all()}

    data = [
        # (name, category_code)
        ("Жим лёжа", "chest"),
        ("Жим лёжа на наклонной скамье", "chest"),
        ("Разводка гантелей", "chest"),
        ("Отжимания", "chest"),
        ("Подтягивания", "back"),
        ("Тяга штанги в наклоне", "back"),
        ("Тяга блока к груди", "back"),
        ("Тяга нижнего блока", "back"),
        ("Приседания со штангой", "legs"),
        ("Жим ногами", "legs"),
        ("Выпады", "legs"),
        ("Румынская тяга", "legs"),
        ("Жим штанги стоя", "shoulders"),
        ("Разводка гантелей стоя", "shoulders"),
        ("Тяга штанги к подбородку", "shoulders"),
        ("Подъём штанги на бицепс", "arms"),
        ("Французский жим", "arms"),
        ("Сгибания с гантелями", "arms"),
        ("Разгибания на блоке", "arms"),
        ("Скручивания", "core"),
        ("Планка", "core"),
        ("Подъём ног в висе", "core"),
        ("Русский твист", "core"),
        ("Бег", "cardio"),
        ("Велосипед", "cardio"),
        ("Прыжки на скакалке", "cardio"),
        ("Гребля", "cardio"),
    ]

    added = 0
    for name, category_code in data:
        exists = (
            db.query(Exercise)
            .filter(Exercise.name == name, Exercise.is_system == True)  # noqa: E712
            .first()
        )
        if not exists:
            db.add(
                Exercise(
                    name=name,
                    category_id=categories.get(category_code),
                    is_system=True,
                    is_active=True,
                )
            )
            added += 1
    db.commit()
    print(f"exercises: seeded {added} system exercises (skipped existing)")


def main():
    db = SessionLocal()
    try:
        seed_workout_types(db)
        seed_exercise_categories(db)
        seed_goal_types(db)
        seed_exercises(db)
        print("Seeding completed successfully.")
    except Exception as exc:
        db.rollback()
        print(f"Seeding failed: {exc}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
