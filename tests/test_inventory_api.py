from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_inventory_locations_endpoint_exists() -> None:
    response = client.get("/api/v1/inventory/locations")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_inventory_items_endpoint_exists() -> None:
    response = client.get(
        f"/api/v1/inventory/items/{uuid4()}",
    )

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_inventory_movements_endpoint_exists() -> None:
    response = client.get(
        f"/api/v1/inventory/items/{uuid4()}/movements",
    )

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
