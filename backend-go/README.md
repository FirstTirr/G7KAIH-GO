# G7KAIH Backend - Go + PostgreSQL

Backend API untuk sistem manajemen kegiatan siswa G7KAIH, dibangun dengan Go, Gin Framework, dan PostgreSQL.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication dengan role-based access control
- **Multi-role System**: Support untuk Admin, Guru, Guru Wali, Siswa, dan Orang Tua
- **Activity Management**: CRUD operations untuk kegiatan siswa dengan dynamic form schema
- **Comment System**: Komentar pada aktivitas siswa
- **Reporting**: Daily inactive student reports untuk guru dan guru wali
- **File Upload**: Integrasi dengan Cloudinary untuk upload file
- **API Documentation**: Swagger/OpenAPI documentation
- **Rate Limiting**: Protection terhadap abuse
- **CORS Support**: Configurable CORS untuk frontend integration

## 📁 Struktur Proyek

```
backend-go/
├── cmd/
│   └── server/
│       └── main.go              # Entry point aplikasi
├── internal/
│   ├── auth/                    # JWT & password hashing
│   ├── config/                  # Configuration management
│   ├── database/                # Database connection & migrations
│   ├── handlers/                # HTTP request handlers
│   ├── middleware/              # Middleware (auth, cors, rate limit)
│   ├── models/                  # Database models (GORM)
│   └── router/                  # Route definitions
├── .env.example                 # Environment variables template
├── go.mod                       # Go modules
├── Dockerfile                   # Docker configuration
├── docker-compose.yml           # Docker Compose setup
└── README.md                    # This file
```

## 🛠️ Tech Stack

- **Language**: Go 1.23
- **Web Framework**: Gin
- **ORM**: GORM
- **Database**: PostgreSQL 16+
- **Authentication**: JWT (golang-jwt/jwt/v5)
- **Password Hashing**: bcrypt
- **File Upload**: Cloudinary
- **Documentation**: Swagger (swaggo)
- **Rate Limiting**: golang.org/x/time/rate

## 📋 Prerequisites

- Go 1.23 atau lebih baru
- PostgreSQL 16 atau lebih baru
- (Optional) Docker & Docker Compose

## 🚀 Quick Start

### 1. Clone Repository

```bash
cd backend-go
```

### 2. Setup Environment Variables

```bash
cp .env.example .env
```

Edit file `.env` dan sesuaikan dengan konfigurasi Anda:

```env
PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=g7kaih
JWT_SECRET=your-secret-key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Install Dependencies

```bash
go mod download
```

### 4. Setup Database

Buat database PostgreSQL:

```sql
CREATE DATABASE g7kaih;
```

Migrations akan dijalankan otomatis saat aplikasi start.

### 5. Run Application

```bash
go run cmd/server/main.go
```

Server akan berjalan di `http://localhost:8080`

## 🐳 Docker Setup

### Build dan Run dengan Docker Compose

```bash
docker-compose up -d
```

Ini akan menjalankan:

- Backend API di port 8080
- PostgreSQL di port 5432

### Stop Services

```bash
docker-compose down
```

## 📚 API Documentation

Setelah aplikasi berjalan, akses Swagger documentation di:

```
http://localhost:8080/swagger/index.html
```

### Generate Swagger Docs

```bash
# Install swag
go install github.com/swaggo/swag/cmd/swag@latest

# Generate docs
swag init -g cmd/server/main.go -o docs
```

## 🔐 Authentication

### Register

```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "siswa",
  "nis": "12345",
  "class": "10A"
}
```

### Login

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "profile": {
    "id": "uuid",
    "name": "John Doe",
    "role": "siswa",
    "class": "10A"
  },
  "tokens": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "expires_at": 1234567890
  }
}
```

### Using Token

Gunakan access token di header:

```bash
Authorization: Bearer <access_token>
```

## 🔑 User Roles

1. **admin**: Full access ke semua endpoints
2. **guru**: Access ke students dalam kelas yang diajar
3. **guruwali**: Access ke students dalam kelas yang dibimbing
4. **siswa**: Access ke aktivitas sendiri
5. **orangtua**: Access ke aktivitas anak yang terhubung

## 📊 Main Endpoints

### Activities

- `GET /api/v1/activities` - List activities
- `POST /api/v1/activities` - Create activity
- `GET /api/v1/activities/:id` - Get activity details
- `PUT /api/v1/activities/:id` - Update activity
- `DELETE /api/v1/activities/:id` - Delete activity

### Categories & Kegiatan

- `GET /api/v1/categories` - List categories
- `GET /api/v1/kegiatan` - List kegiatan types
- `POST /api/v1/kegiatan` - Create kegiatan (Admin)

### Teacher

- `GET /api/v1/teacher/students` - Get students
- `GET /api/v1/teacher/students/:id/activities` - Get student activities
- `GET /api/v1/teacher/reports/daily-inactive` - Daily inactive report

### Admin

- `POST /api/v1/admin/users` - Create user
- `POST /api/v1/admin/users/bulk-import` - Bulk import from CSV
- `POST /api/v1/admin/assign-guruwali` - Assign guru wali
- `POST /api/v1/admin/teacher-roles` - Assign teacher role

## 🧪 Testing

```bash
# Run tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Run tests with detailed output
go test -v ./...
```

## 📦 Building for Production

```bash
# Build binary
go build -o bin/server cmd/server/main.go

# Run binary
./bin/server
```

## 🔧 Development

### Hot Reload dengan Air

Install Air:

```bash
go install github.com/cosmtrek/air@latest
```

Run dengan hot reload:

```bash
air
```

## 🌐 Environment Variables

| Variable              | Description             | Default     |
| --------------------- | ----------------------- | ----------- |
| PORT                  | Server port             | 8080        |
| ENVIRONMENT           | Environment mode        | development |
| DB_HOST               | PostgreSQL host         | localhost   |
| DB_PORT               | PostgreSQL port         | 5432        |
| DB_USER               | PostgreSQL user         | postgres    |
| DB_PASSWORD           | PostgreSQL password     | -           |
| DB_NAME               | Database name           | g7kaih      |
| JWT_SECRET            | JWT secret key          | -           |
| JWT_EXPIRATION_HOURS  | Access token expiration | 24          |
| CLOUDINARY_CLOUD_NAME | Cloudinary cloud name   | -           |
| CLOUDINARY_API_KEY    | Cloudinary API key      | -           |
| CLOUDINARY_API_SECRET | Cloudinary API secret   | -           |

## 🐛 Troubleshooting

### Database Connection Error

Pastikan PostgreSQL berjalan dan kredensial di `.env` benar.

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Port Already in Use

Ubah PORT di `.env` atau kill process yang menggunakan port:

```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :8080
kill -9 <PID>
```

## 📝 Migration dari Next.js API Routes

Backend Go ini menggantikan semua API routes Next.js yang ada di:

- `/src/app/api/`

Semua endpoint telah dikonversi dengan struktur yang lebih baik dan performa yang lebih tinggi.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- DityaPerdana

## 🙏 Acknowledgments

- Gin Web Framework
- GORM
- PostgreSQL
- Cloudinary
