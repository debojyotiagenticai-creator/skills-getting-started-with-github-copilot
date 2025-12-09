from fastapi.testclient import TestClient
import urllib.parse

from src.app import app

client = TestClient(app)


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    # Basic known activity from the in-memory store
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    email = "tester@example.com"

    # Ensure clean state: if email exists remove it first
    encoded_activity = urllib.parse.quote(activity, safe='')
    client.delete(f"/activities/{encoded_activity}/unregister?email={urllib.parse.quote(email, safe='')}" )

    # Sign up
    res = client.post(f"/activities/{encoded_activity}/signup?email={urllib.parse.quote(email, safe='')}" )
    assert res.status_code == 200
    assert f"Signed up {email}" in res.json().get("message", "")

    # Verify participant appears in the list
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert email in data[activity]["participants"]

    # Unregister
    res = client.delete(f"/activities/{encoded_activity}/unregister?email={urllib.parse.quote(email, safe='')}" )
    assert res.status_code == 200
    assert f"Unregistered {email}" in res.json().get("message", "")

    # Verify participant removed
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert email not in data[activity]["participants"]


def test_unregister_nonexistent_participant_returns_404():
    activity = "Chess Club"
    email = "not-a-user@example.com"
    encoded_activity = urllib.parse.quote(activity, safe='')
    res = client.delete(f"/activities/{encoded_activity}/unregister?email={urllib.parse.quote(email, safe='')}" )
    assert res.status_code == 404
