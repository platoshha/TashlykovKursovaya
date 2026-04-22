"""
Backend API tests for the Fitness Tracker.

10 tests covering:
  - Auth: register, duplicate register (400), login with bad password (401), /me
  - Workouts: create, list, detail (404 for another user's workout)
  - Measurements: create + list
  - Goals: create + list
  - Unauthorized access (401 on protected endpoint)
"""
import uuid
from datetime import date

import pytest
from fastapi.testclient import TestClient

from tests.conftest import register_and_login


# ── 1. Register a new user ────────────────────────────────────────────────────

def test_register_success(client: TestClient):
    resp = client.post("/api/v1/auth/register", json={
        "email": "newuser@example.com",
        "password": "securepass",
        "name": "New User",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "newuser@example.com"
    assert "password" not in data
    assert "password_hash" not in data
    assert "id" in data


# ── 2. Duplicate registration returns 400 ────────────────────────────────────

def test_register_duplicate_email(client: TestClient):
    payload = {"email": "dup@example.com", "password": "password123", "name": "Dup"}
    client.post("/api/v1/auth/register", json=payload)
    resp = client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 400
    assert "email" in resp.json()["detail"].lower() or "зарегистрирован" in resp.json()["detail"]


# ── 3. Login with wrong password returns 401 ─────────────────────────────────

def test_login_wrong_password(client: TestClient):
    client.post("/api/v1/auth/register", json={
        "email": "auth@example.com",
        "password": "correctpass",
        "name": "Auth User",
    })
    resp = client.post("/api/v1/auth/login", json={
        "email": "auth@example.com",
        "password": "wrongpassword",
    })
    assert resp.status_code == 401


# ── 4. GET /auth/me returns current user ─────────────────────────────────────

def test_me_returns_current_user(client: TestClient, auth_headers: dict):
    resp = client.get("/api/v1/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "test@example.com"
    assert "password_hash" not in data


# ── 5. Protected endpoint without token returns 401 ──────────────────────────

def test_unauthorized_access_without_token(client: TestClient):
    resp = client.get("/api/v1/workouts")
    # HTTPBearer returns 401 (missing credentials) in Starlette ≥0.37 / 403 in older versions
    assert resp.status_code in (401, 403)


# ── 6. Create a workout ───────────────────────────────────────────────────────

def test_create_workout(client: TestClient, auth_headers: dict):
    resp = client.post("/api/v1/workouts", json={
        "workout_type_id": 1,
        "workout_date": str(date.today()),
        "duration_minutes": 60,
    }, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["workout_type_id"] == 1
    assert data["duration_minutes"] == 60
    assert data["exercises"] == []
    assert "id" in data


# ── 7. List workouts returns only the current user's workouts ─────────────────

def test_list_workouts_returns_own_only(client: TestClient):
    # Create user A and a workout
    headers_a = register_and_login(client, "usera@example.com", "password123", "User A")
    client.post("/api/v1/workouts", json={
        "workout_type_id": 1,
        "workout_date": str(date.today()),
        "duration_minutes": 45,
    }, headers=headers_a)

    # Create user B — their list should be empty
    headers_b = register_and_login(client, "userb@example.com", "password123", "User B")
    resp = client.get("/api/v1/workouts", headers=headers_b)
    assert resp.status_code == 200
    assert resp.json()["total"] == 0
    assert resp.json()["items"] == []


# ── 8. Get workout by ID — 404 for another user's workout ────────────────────

def test_get_workout_404_for_other_user(client: TestClient):
    # User A creates a workout
    headers_a = register_and_login(client, "owner@example.com", "password123", "Owner")
    create_resp = client.post("/api/v1/workouts", json={
        "workout_type_id": 2,
        "workout_date": str(date.today()),
        "duration_minutes": 30,
    }, headers=headers_a)
    workout_id = create_resp.json()["id"]

    # User B tries to fetch it — should get 404 (ownership check)
    headers_b = register_and_login(client, "intruder@example.com", "password123", "Intruder")
    resp = client.get(f"/api/v1/workouts/{workout_id}", headers=headers_b)
    assert resp.status_code == 404


# ── 9. Create and list body measurements ─────────────────────────────────────

def test_create_and_list_measurements(client: TestClient, auth_headers: dict):
    payload = {
        "measured_at": str(date.today()),
        "weight_kg": "80.5",
        "body_fat_pct": "15.0",
        "notes": "Morning measurement",
    }
    create_resp = client.post("/api/v1/measurements", json=payload, headers=auth_headers)
    assert create_resp.status_code == 201
    data = create_resp.json()
    assert float(data["weight_kg"]) == pytest.approx(80.5, rel=1e-3)
    assert data["notes"] == "Morning measurement"

    list_resp = client.get("/api/v1/measurements", headers=auth_headers)
    assert list_resp.status_code == 200
    body = list_resp.json()
    assert body["total"] == 1
    assert body["items"][0]["id"] == data["id"]


# ── 10. Create and list goals ─────────────────────────────────────────────────

def test_create_and_list_goals(client: TestClient, auth_headers: dict):
    payload = {
        "goal_type_id": 1,
        "target_value": "75.0",
        "target_date": "2026-12-31",
        "notes": "Lose weight by end of year",
    }
    create_resp = client.post("/api/v1/goals", json=payload, headers=auth_headers)
    assert create_resp.status_code == 201
    goal = create_resp.json()
    assert goal["goal_type_id"] == 1
    assert goal["is_achieved"] is False

    list_resp = client.get("/api/v1/goals", headers=auth_headers)
    assert list_resp.status_code == 200
    body = list_resp.json()
    assert body["total"] == 1
    assert body["items"][0]["id"] == goal["id"]
