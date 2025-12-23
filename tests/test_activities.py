from fastapi.testclient import TestClient
from src.app import app, activities


client = TestClient(app)


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    # basic known activity from fixture
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    email = "testuser@example.com"

    # Ensure clean state
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    # Sign up
    res = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert res.status_code == 200
    assert email in activities[activity]["participants"]

    # Duplicate signup should be rejected
    dup = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert dup.status_code == 400

    # Unregister
    res_un = client.delete(f"/activities/{activity}/signup", params={"email": email})
    assert res_un.status_code == 200
    assert email not in activities[activity]["participants"]

    # Unregistering again should return 404
    res_un2 = client.delete(f"/activities/{activity}/signup", params={"email": email})
    assert res_un2.status_code == 404
