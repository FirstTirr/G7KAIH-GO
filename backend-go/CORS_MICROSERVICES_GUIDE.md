# Panduan Konfigurasi CORS & Microservices

## 📋 Daftar Isi

1. [Konfigurasi CORS](#konfigurasi-cors)
2. [Mode CORS](#mode-cors)
3. [Konfigurasi IP](#konfigurasi-ip)
4. [Microservices Architecture](#microservices-architecture)
5. [Deployment](#deployment)

---

## 🌐 Konfigurasi CORS

### Mode CORS yang Tersedia

Backend mendukung 5 mode CORS yang dapat dengan mudah diganti melalui environment variable `CORS_MODE`:

#### 1. **Development Mode** (default)

Untuk development lokal dengan localhost

```env
CORS_MODE=development
CORS_DEV_FRONTEND_URL=http://localhost:3000
CORS_DEV_ADMIN_URL=http://localhost:3001
```

Allowed Origins:

- `http://localhost:3000` (Frontend)
- `http://localhost:3001` (Admin)

#### 2. **Staging Mode**

Untuk testing di server staging

```env
CORS_MODE=staging
CORS_STAGING_FRONTEND_URL=http://staging.g7kaih.com
CORS_STAGING_ADMIN_URL=http://admin-staging.g7kaih.com
```

Allowed Origins:

- `http://staging.g7kaih.com`
- `http://admin-staging.g7kaih.com`

#### 3. **Production Mode**

Untuk production dengan HTTPS

```env
CORS_MODE=production
CORS_PROD_FRONTEND_URL=https://g7kaih.com
CORS_PROD_ADMIN_URL=https://admin.g7kaih.com
```

Allowed Origins:

- `https://g7kaih.com`
- `https://admin.g7kaih.com`

#### 4. **Custom Mode**

Untuk custom URLs atau multiple IPs

```env
CORS_MODE=custom
CORS_CUSTOM_ORIGINS=http://192.168.1.100:3000,http://192.168.1.101:3000,http://10.0.0.50:3000
```

Allowed Origins: Semua yang ada di `CORS_CUSTOM_ORIGINS`

#### 5. **All Mode**

Untuk development dengan semua environment (tidak disarankan untuk production)

```env
CORS_MODE=all
```

Allowed Origins: Gabungan dari development, staging, production, dan custom origins

---

## 🔧 Mengubah IP CORS dengan Mudah

### Cara 1: Menggunakan Environment Variables

Edit file `.env`:

```env
# Untuk Development
CORS_MODE=development
CORS_DEV_FRONTEND_URL=http://192.168.1.100:3000
CORS_DEV_ADMIN_URL=http://192.168.1.100:3001

# Atau gunakan Custom Mode
CORS_MODE=custom
CORS_CUSTOM_ORIGINS=http://192.168.1.100:3000,http://192.168.1.101:3000,http://10.0.0.50:3000
```

### Cara 2: Menggunakan IP Whitelist

Tambahkan IP yang diizinkan:

```env
# Frontend IPs yang diizinkan (pisahkan dengan koma)
ALLOWED_FRONTEND_IPS=192.168.1.100,192.168.1.101,10.0.0.50

# Backend IPs untuk inter-service communication
ALLOWED_BACKEND_IPS=192.168.1.200,192.168.1.201
```

### Cara 3: Runtime Environment Variables

Untuk Docker:

```bash
docker run -e CORS_MODE=custom \
  -e CORS_CUSTOM_ORIGINS=http://192.168.1.100:3000 \
  g7kaih-backend
```

Untuk Docker Compose:

```yaml
environment:
  - CORS_MODE=custom
  - CORS_CUSTOM_ORIGINS=http://192.168.1.100:3000,http://192.168.1.101:3000
```

---

## 🏗️ Microservices Architecture

### Arsitektur

```
┌─────────────┐
│   Nginx LB  │ :80/:443
└──────┬──────┘
       │
       ├─────────────┐
       ↓             ↓
┌─────────────┐  ┌─────────────┐
│ API Gateway │  │   Frontend  │
│   :8080     │  │   :3000     │
└──────┬──────┘  └─────────────┘
       │
       ├──────────┬──────────┬──────────┐
       ↓          ↓          ↓          ↓
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│  Auth   │ │ Storage │ │ Notify  │ │Database │
│ Service │ │ Service │ │ Service │ │Postgres │
│  :8081  │ │  :8082  │ │  :8083  │ │  :5432  │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
```

### Mengaktifkan Mode Microservices

Edit `.env`:

```env
MICROSERVICES_ENABLED=true
SERVICE_DISCOVERY=dns

# Service URLs (gunakan nama service dari docker-compose)
AUTH_SERVICE_URL=http://auth-service:8081
STORAGE_SERVICE_URL=http://storage-service:8082
NOTIFICATION_SERVICE_URL=http://notification-service:8083
```

### Menjalankan Microservices

#### Development (Monolith)

```bash
docker-compose up -d
```

Services:

- API: http://localhost:8080
- PostgreSQL: localhost:5432
- Redis: localhost:6379

#### Production (Microservices)

```bash
docker-compose -f docker-compose.microservices.yml up -d
```

Services:

- Nginx: http://localhost:80
- API Gateway: http://localhost:8080
- Auth Service: http://localhost:8081
- Storage Service: http://localhost:8082
- Notification Service: http://localhost:8083

---

## 🚀 Deployment

### Quick Start - Development

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Edit .env dengan IP lokal Anda
nano .env

# 3. Set CORS mode
CORS_MODE=custom
CORS_CUSTOM_ORIGINS=http://192.168.1.100:3000

# 4. Start services
docker-compose up -d

# 5. Check logs
docker-compose logs -f api
```

### Production Deployment

```bash
# 1. Prepare environment
cp .env.example .env
nano .env

# 2. Configure for production
ENVIRONMENT=production
CORS_MODE=production
CORS_PROD_FRONTEND_URL=https://yourdomain.com
CORS_PROD_ADMIN_URL=https://admin.yourdomain.com

# 3. Set strong JWT secret
JWT_SECRET=$(openssl rand -base64 32)

# 4. Deploy with microservices
docker-compose -f docker-compose.microservices.yml up -d

# 5. Setup SSL (optional, update nginx config)
# 6. Monitor services
docker-compose -f docker-compose.microservices.yml ps
```

---

## 📊 Contoh Konfigurasi Lengkap

### Scenario 1: Development Team Lokal

```env
# .env
CORS_MODE=development
CORS_DEV_FRONTEND_URL=http://localhost:3000
CORS_DEV_ADMIN_URL=http://localhost:3001
MICROSERVICES_ENABLED=false
```

### Scenario 2: Development dengan IP Jaringan Lokal

```env
# .env
CORS_MODE=custom
CORS_CUSTOM_ORIGINS=http://192.168.1.100:3000,http://192.168.1.101:3000,http://192.168.1.102:3001
ALLOWED_FRONTEND_IPS=192.168.1.100,192.168.1.101,192.168.1.102
MICROSERVICES_ENABLED=false
```

### Scenario 3: Staging Server

```env
# .env
CORS_MODE=staging
CORS_STAGING_FRONTEND_URL=http://staging.g7kaih.com
CORS_STAGING_ADMIN_URL=http://admin-staging.g7kaih.com
MICROSERVICES_ENABLED=false
ENVIRONMENT=staging
```

### Scenario 4: Production dengan Microservices

```env
# .env
CORS_MODE=production
CORS_PROD_FRONTEND_URL=https://g7kaih.com
CORS_PROD_ADMIN_URL=https://admin.g7kaih.com
CORS_ALLOW_CREDENTIALS=true

MICROSERVICES_ENABLED=true
SERVICE_DISCOVERY=dns
AUTH_SERVICE_URL=http://auth-service:8081
STORAGE_SERVICE_URL=http://storage-service:8082
NOTIFICATION_SERVICE_URL=http://notification-service:8083

ENVIRONMENT=production
GIN_MODE=release
```

---

## 🔍 Testing CORS Configuration

### Test dari Command Line

```bash
# Test CORS headers
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  http://localhost:8080/api/v1/health -v
```

Expected Response Headers:

```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Credentials: true
```

### Test dari Browser Console

```javascript
fetch("http://localhost:8080/api/v1/health", {
  method: "GET",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
})
  .then((response) => response.json())
  .then((data) => console.log("Success:", data))
  .catch((error) => console.error("Error:", error));
```

---

## 🛠️ Troubleshooting

### Issue: CORS Error "No 'Access-Control-Allow-Origin'"

**Solusi:**

1. Periksa `CORS_MODE` di `.env`
2. Pastikan frontend URL ada di konfigurasi
3. Restart service: `docker-compose restart api`

### Issue: Request Blocked by IP Whitelist

**Solusi:**

1. Tambahkan IP ke `ALLOWED_FRONTEND_IPS`
2. Atau kosongkan variabel untuk allow all IPs

### Issue: Microservices Cannot Communicate

**Solusi:**

1. Periksa service names di docker-compose
2. Pastikan semua services di network yang sama
3. Check logs: `docker-compose logs -f`

---

## 📝 Best Practices

1. **Development**: Gunakan `CORS_MODE=development` atau `custom`
2. **Production**: Selalu gunakan `CORS_MODE=production` dengan HTTPS
3. **Security**: Jangan gunakan `CORS_MODE=all` di production
4. **IP Whitelist**: Gunakan untuk extra security layer
5. **Monitoring**: Setup logging untuk track CORS issues

---

## 📞 Support

Jika ada pertanyaan atau issue:

1. Check logs: `docker-compose logs -f api`
2. Verify environment: `docker-compose config`
3. Test CORS: Gunakan curl command di atas
