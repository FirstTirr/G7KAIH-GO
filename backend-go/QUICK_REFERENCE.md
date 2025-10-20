# 🚀 Quick Reference - CORS & IP Configuration

## 📱 Ganti IP CORS dengan Mudah (3 Cara)

### Cara 1: Edit File .env (Recommended)

```bash
# Edit .env
CORS_MODE=custom
CORS_CUSTOM_ORIGINS=http://192.168.1.100:3000,http://192.168.1.101:3000
```

### Cara 2: Gunakan Makefile (Linux/Mac)

```bash
# Set IP secara otomatis
make set-cors-ip IP=192.168.1.100 PORT=3000

# Switch mode CORS
make cors-dev        # Development (localhost)
make cors-staging    # Staging server
make cors-prod       # Production
make cors-custom     # Custom IPs
```

### Cara 3: Environment Variable (Docker)

```bash
# Start dengan custom IP
docker-compose up -d -e CORS_CUSTOM_ORIGINS=http://192.168.1.100:3000
```

---

## 🎯 Mode CORS

| Mode          | Kapan Digunakan         | Contoh             |
| ------------- | ----------------------- | ------------------ |
| `development` | Development lokal       | localhost:3000     |
| `staging`     | Testing di server       | staging.g7kaih.com |
| `production`  | Live production         | https://g7kaih.com |
| `custom`      | Multiple IPs/URLs       | 192.168.1.100:3000 |
| `all`         | Development (semua env) | Semua diatas       |

---

## 🏃 Quick Start Commands

### Development (Monolith)

```bash
# Linux/Mac
make quick-start

# Windows
deploy.bat monolith development

# Manual
docker-compose up -d
```

### Production (Microservices)

```bash
# Linux/Mac
make deploy-micro

# Windows
deploy.bat microservices production

# Manual
docker-compose -f docker-compose.microservices.yml up -d
```

---

## 🔧 Konfigurasi Berdasarkan Scenario

### Scenario 1: Development di Localhost

```env
CORS_MODE=development
CORS_DEV_FRONTEND_URL=http://localhost:3000
CORS_DEV_ADMIN_URL=http://localhost:3001
MICROSERVICES_ENABLED=false
```

**Command:** `make quick-start` atau `deploy.bat monolith`

### Scenario 2: Team dengan IP Lokal Berbeda

```env
CORS_MODE=custom
CORS_CUSTOM_ORIGINS=http://192.168.1.100:3000,http://192.168.1.101:3000,http://192.168.1.102:3000
ALLOWED_FRONTEND_IPS=192.168.1.100,192.168.1.101,192.168.1.102
MICROSERVICES_ENABLED=false
```

**Command:** `make set-cors-ip IP=192.168.1.100 PORT=3000`

### Scenario 3: Server Staging

```env
CORS_MODE=staging
CORS_STAGING_FRONTEND_URL=http://staging.g7kaih.com
CORS_STAGING_ADMIN_URL=http://admin-staging.g7kaih.com
ENVIRONMENT=staging
MICROSERVICES_ENABLED=false
```

**Command:** `make cors-staging && make deploy-mono`

### Scenario 4: Production dengan Microservices

```env
CORS_MODE=production
CORS_PROD_FRONTEND_URL=https://g7kaih.com
CORS_PROD_ADMIN_URL=https://admin.g7kaih.com
ENVIRONMENT=production
MICROSERVICES_ENABLED=true
```

**Command:** `make deploy-micro`

---

## 📝 Useful Commands

### Makefile Commands (Linux/Mac)

```bash
make help              # Tampilkan semua commands
make dev               # Run development server
make test              # Run tests
make docker-compose-up # Start monolith
make docker-micro-up   # Start microservices
make logs              # View logs
make health            # Check health
make env-check         # Check environment vars
make stop              # Stop services
```

### Windows Commands

```cmd
deploy.bat monolith development          # Start monolith dev
deploy.bat microservices production      # Start microservices
docker-compose logs -f api               # View logs
docker-compose ps                        # List containers
docker-compose down                      # Stop all
```

### Docker Commands

```bash
# View logs
docker-compose logs -f api
docker-compose logs -f postgres

# Restart service
docker-compose restart api

# Execute command in container
docker-compose exec api sh

# View running containers
docker-compose ps

# Stop and remove
docker-compose down -v
```

---

## 🔍 Testing & Debugging

### Test CORS Configuration

```bash
# Test dari command line
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     http://localhost:8080/api/v1/health -v

# Check health
curl http://localhost:8080/health
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api

# Last 100 lines
docker-compose logs --tail=100 api
```

### Debug Environment

```bash
# Check environment variables
make env-check

# Or manual
docker-compose exec api env | grep CORS
```

---

## 🚨 Common Issues & Solutions

### Issue: CORS Error

**Solution:**

```bash
# 1. Check CORS mode
grep CORS_MODE .env

# 2. Verify frontend URL in allowed origins
make env-check | grep CORS

# 3. Restart service
docker-compose restart api
```

### Issue: Cannot Connect to Database

**Solution:**

```bash
# 1. Check if postgres is running
docker-compose ps postgres

# 2. Check logs
docker-compose logs postgres

# 3. Restart postgres
docker-compose restart postgres
```

### Issue: Port Already in Use

**Solution:**

```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :8080
kill -9 <PID>

# Or change port in .env
PORT=8090
```

---

## 🌐 Access Points

### Development (Monolith)

- API: http://localhost:8080
- Swagger: http://localhost:8080/swagger/index.html
- Health: http://localhost:8080/health
- Database: localhost:5432

### Production (Microservices)

- Nginx: http://localhost:80
- API Gateway: http://localhost:8080
- Auth Service: http://localhost:8081
- Storage Service: http://localhost:8082
- Swagger: http://localhost:8080/swagger/index.html

---

## 📞 Quick Help

```bash
# Get help
make help

# Check if services are running
docker-compose ps

# View all logs
docker-compose logs -f

# Stop everything
docker-compose down

# Reset everything
make clean-all
```

---

## 💡 Pro Tips

1. **Gunakan Makefile** (Linux/Mac) untuk commands yang lebih mudah
2. **Set CORS_MODE** sesuai environment untuk avoid CORS errors
3. **Use custom mode** untuk multiple IPs
4. **Enable microservices** hanya jika dibutuhkan
5. **Monitor logs** dengan `docker-compose logs -f`
6. **Use .env file** untuk configuration, jangan hardcode

---

## 📚 Documentation

- Full Guide: `CORS_MICROSERVICES_GUIDE.md`
- README: `README.md`
- API Docs: http://localhost:8080/swagger/index.html
