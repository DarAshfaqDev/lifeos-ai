from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
import pytest

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_register():
    response = client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "strongpassword123",
        "name": "Test User",
        "age": 25,
        "education": "Bachelor",
        "occupation": "Student",
        "career_goal": "Data Analyst",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


def test_login():
    client.post("/api/auth/register", json={
        "email": "test@example.com",
        "password": "strongpassword123",
        "name": "Test User",
    })
    response = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "strongpassword123",
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_invalid():
    response = client.post("/api/auth/login", json={
        "email": "wrong@example.com",
        "password": "wrongpassword",
    })
    assert response.status_code == 401
