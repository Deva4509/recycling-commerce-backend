from app.database.models import RoleName
from app.dependencies.auth import require_roles


def test_role_dependency_factory_exists():
    dependency = require_roles(RoleName.ADMIN, RoleName.STAFF)

    assert callable(dependency)


def test_supported_roles():
    assert RoleName.ADMIN.value == "ADMIN"
    assert RoleName.STAFF.value == "STAFF"
    assert RoleName.CUSTOMER.value == "CUSTOMER"
