# AppyFlow

AppyFlow is a Rails 8.1 JSON API with a separate React development frontend.

## Requirements

- Docker Desktop with Docker Compose
- PowerShell (for the optional local `.env` creation command below)

## Docker Compose development

Compose runs three services: Rails (`web`), PostgreSQL 16 (`db`), and the React/esbuild plus Tailwind development servers (`frontend`). The database is isolated in a Compose named volume and does not use or change a PostgreSQL installation running on Windows.

### Configure the local database password

Compose reads the root `.env` file for `APPLYFLOW_DATABASE_PASSWORD`. It is ignored by Git and excluded from Docker build contexts. To create a local file with a random password without printing it to the terminal, run this once in PowerShell from the project root:

```powershell
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
$bytes = New-Object byte[] 32
$rng.GetBytes($bytes)
$password = [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', 'x').Replace('/', 'y')
[IO.File]::WriteAllText((Join-Path (Get-Location) '.env'), "APPLYFLOW_DATABASE_PASSWORD=$password`n", [Text.UTF8Encoding]::new($false))
$rng.Dispose()
Remove-Variable bytes, password, rng
```

If you prefer to choose a password manually, copy `.env.example` to `.env` and replace the example value. Do not commit `.env` or paste its value into logs or chat.

### Start the development environment

On a fresh Compose database volume, run these commands in order:

```powershell
docker compose build web
docker compose up -d db
docker compose run --rm web ruby ./bin/rails db:migrate
docker compose up -d web frontend
```

The PostgreSQL image creates `applyflow_development` on first initialization. The migration command is explicit; starting the Rails container does not run `db:prepare` or migrations.

Open:

- Frontend: <http://localhost:8000>
- Rails API health check: <http://localhost:3000/up>

The Compose database is reachable from Rails at `db:5432`. It is not published on the Windows host, so it cannot conflict with the Windows PostgreSQL service on port 5432.

### Test from a mobile device on the local network

The frontend uses the hostname in the page URL for its API host, with port `3000`. Desktop access at `http://localhost:8000` therefore continues to call `http://localhost:3000`; a phone opening the PC's LAN address calls that same address on port `3000`.

1. Find the development PC's Wi-Fi IPv4 address with `ipconfig`, or use a hostname that the phone can resolve on the local network.
2. In PowerShell, set the exact frontend origins to allow. Include localhost for desktop and the address or hostname you will use on the phone:

   ```powershell
   $env:FRONTEND_ORIGINS = "http://localhost:8000,http://192.168.0.7:8000"
   $env:APP_ALLOWED_HOSTS = "192.168.0.7"
   docker compose up -d --force-recreate web frontend
   ```

   `FRONTEND_ORIGINS` is the exact browser-origin allowlist for CORS. `APP_ALLOWED_HOSTS` contains the exact LAN hostnames/IPs only, without scheme or port; it is passed to Rails Host Authorization and the frontend's development proxy. Localhost remains allowed by default. The esbuild server listens on container loopback port `8001`; the proxy on port `8000` forwards only requests whose Host matches localhost or a configured host.
3. On the phone, open `http://192.168.0.7:8000`. The frontend calls the API at `http://192.168.0.7:3000`. Keep the phone and PC on the same Wi-Fi network. Windows Firewall must allow inbound TCP ports `8000` and `3000` on the private network profile.

The API URL can be explicitly overridden by setting the `applyflow-api-base-url` meta tag in `frontend/public/index.html` to an absolute API base URL such as `http://192.168.0.7:3000`. Leave it empty for the hostname-based behavior above. CORS uses exact origins: development reads `FRONTEND_ORIGINS`, while non-development environments allow only origins explicitly supplied through `CORS_ALLOWED_ORIGINS` and deny browser cross-origin access when it is unset.

### Rails tests

The test database is separate from the development database. Create it once, then run the suite:

```powershell
docker compose run --rm -e RAILS_ENV=test web ruby ./bin/rails db:create
docker compose run --rm -e RAILS_ENV=test web ruby ./bin/rails test
```

Rails’ test helper maintains the test schema from `db/schema.rb` as needed. Test records are kept in `applyflow_test`, not the development database.

### Logs and stopping

Follow logs for all services or a selected service:

```powershell
docker compose logs -f
docker compose logs -f web
```

Stop containers while retaining them and all data:

```powershell
docker compose stop
```

Remove the stopped containers and Compose network while preserving named volumes:

```powershell
docker compose down
```

Permanently remove the containers, network, **and the PostgreSQL data volume**:

```powershell
docker compose down --volumes
```

**Warning:** `docker compose down --volumes` deletes the Compose PostgreSQL data, including development and test databases. Do not use it unless you intend to discard that data. The separate Windows PostgreSQL installation is not affected.

### Changing the local Compose password

To rotate the password for an already initialized Compose database, open an interactive PostgreSQL administration session:

```powershell
docker compose exec db psql -U applyflow -d postgres
```

At the `psql` prompt, run `\password applyflow`, enter the new password twice when prompted, and exit with `\q`. Then update `APPLYFLOW_DATABASE_PASSWORD` in the ignored root `.env` to that same value and recreate the services so Rails receives it:

```powershell
docker compose up -d --force-recreate db web
```

This reuses the existing named database volume and preserves its data. Changing `POSTGRES_PASSWORD` in `.env` alone does not rotate the role password in an initialized database; the image only uses that variable during first-time database initialization.

### Running Rails natively on Windows

`config/database.yml` defaults `DB_HOST` to `127.0.0.1` and `DB_PORT` to `5432`, so native Rails continues to use the Windows PostgreSQL installation. Set `APPLYFLOW_DATABASE_PASSWORD` in the PowerShell process that launches Rails. For hidden password input:

```powershell
$securePassword = Read-Host -AsSecureString -Prompt "PostgreSQL password for applyflow"
$credential = [PSCredential]::new("applyflow", $securePassword)
$env:APPLYFLOW_DATABASE_PASSWORD = $credential.GetNetworkCredential().Password
Remove-Variable securePassword, credential
```

This variable is available to Rails and child processes launched from that terminal. Clear it when finished with `Remove-Item Env:APPLYFLOW_DATABASE_PASSWORD`.

## Production

The existing production [Dockerfile](Dockerfile) and Kamal configuration remain separate from the development Compose setup.
