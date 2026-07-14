class TestRegister:
    def test_register_success(self, client):
        response = client.post(
            "/auth/register",
            json={
                "name": "Test User",
                "email": "test@example.com",
                "country": "India",
                "password": "testpass123",
                "role": "user",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["name"] == "Test User"

    def test_register_email_normalized(self, client):
        response = client.post(
            "/auth/register",
            json={
                "name": "Test User",
                "email": "TEST@EXAMPLE.COM",
                "country": "India",
                "password": "testpass123",
                "role": "user",
            },
        )
        assert response.status_code == 201
        assert response.json()["email"] == "test@example.com"

    def test_register_duplicate_email(self, client):
        client.post(
            "/auth/register",
            json={
                "name": "User One",
                "email": "duplicate@example.com",
                "country": "India",
                "password": "testpass123",
            },
        )
        response = client.post(
            "/auth/register",
            json={
                "name": "User Two",
                "email": "duplicate@example.com",
                "country": "India",
                "password": "testpass123",
            },
        )
        assert response.status_code == 409

    def test_register_invalid_role(self, client):
        response = client.post(
            "/auth/register",
            json={
                "name": "Admin User",
                "email": "admin@example.com",
                "country": "India",
                "password": "testpass123",
                "role": "admin",
            },
        )
        assert response.status_code == 400

    def test_register_password_too_short(self, client):
        response = client.post(
            "/auth/register",
            json={
                "name": "Test User",
                "email": "short@example.com",
                "country": "India",
                "password": "abc",
            },
        )
        assert response.status_code == 422


class TestLogin:
    def test_login_success(self, client):
        client.post(
            "/auth/register",
            json={
                "name": "Test User",
                "email": "login@example.com",
                "country": "India",
                "password": "testpass123",
            },
        )
        response = client.post(
            "/auth/login",
            json={"email": "login@example.com", "password": "testpass123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert "access_jti" in data
        assert data["token_type"] == "bearer"

    def test_login_email_case_insensitive(self, client):
        client.post(
            "/auth/register",
            json={
                "name": "Test User",
                "email": "case@test.com",
                "country": "India",
                "password": "testpass123",
            },
        )
        response = client.post(
            "/auth/login",
            json={"email": "CASE@TEST.COM", "password": "testpass123"},
        )
        assert response.status_code == 200

    def test_login_invalid_email(self, client):
        response = client.post(
            "/auth/login",
            json={"email": "notfound@example.com", "password": "testpass123"},
        )
        assert response.status_code == 401

    def test_login_invalid_password(self, client):
        client.post(
            "/auth/register",
            json={
                "name": "Test User",
                "email": "wrongpass@test.com",
                "country": "India",
                "password": "testpass123",
            },
        )
        response = client.post(
            "/auth/login",
            json={"email": "wrongpass@test.com", "password": "wrongpassword"},
        )
        assert response.status_code == 401


class TestMe:
    def test_me_success(self, client):
        client.post(
            "/auth/register",
            json={
                "name": "Test User",
                "email": "me@test.com",
                "country": "India",
                "password": "testpass123",
            },
        )
        login_resp = client.post(
            "/auth/login",
            json={"email": "me@test.com", "password": "testpass123"},
        )
        token = login_resp.json()["access_token"]

        response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        assert response.json()["email"] == "me@test.com"

    def test_me_no_token(self, client):
        response = client.get("/auth/me")
        assert response.status_code == 401

    def test_me_invalid_token(self, client):
        response = client.get("/auth/me", headers={"Authorization": "Bearer invalid"})
        assert response.status_code == 401


class TestRefresh:
    def test_refresh_success(self, client):
        client.post(
            "/auth/register",
            json={
                "name": "Test User",
                "email": "refresh@test.com",
                "country": "India",
                "password": "testpass123",
            },
        )
        login_resp = client.post(
            "/auth/login",
            json={"email": "refresh@test.com", "password": "testpass123"},
        )
        refresh_token = login_resp.json()["refresh_token"]

        response = client.post(
            "/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    def test_refresh_invalid_token(self, client):
        response = client.post(
            "/auth/refresh",
            json={"refresh_token": "testpass123"},
        )
        assert response.status_code == 401


class TestLogout:
    def test_logout_success(self, client):
        client.post(
            "/auth/register",
            json={
                "name": "Test User",
                "email": "logout@test.com",
                "country": "India",
                "password": "testpass123",
            },
        )
        login_resp = client.post(
            "/auth/login",
            json={"email": "logout@test.com", "password": "testpass123"},
        )
        token = login_resp.json()["access_token"]

        response = client.post(
            "/auth/logout", headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200

        me_resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_resp.status_code == 401

    def test_logout_no_token(self, client):
        response = client.post("/auth/logout")
        assert response.status_code == 401
