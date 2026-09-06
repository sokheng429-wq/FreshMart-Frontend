# B'Groceries — Backend ERD & Spring Boot Guide
## Neon PostgreSQL + Spring Boot REST API

---

## 1. ENTITY RELATIONSHIP DIAGRAM

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│     products     │       │       jobs       │       │   applications   │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (BIGSERIAL PK)│       │ id (BIGSERIAL PK)│       │ id (BIGSERIAL PK)│
│ name (VARCHAR)   │       │ title (VARCHAR)   │       │ full_name(VARCHAR)│
│ category(VARCHAR)│       │ department(VARCHAR│       │ email (VARCHAR)  │
│ price (DECIMAL)  │       │ location (VARCHAR)│       │ phone (VARCHAR)  │
│ old_price(DECIMAL│       │ type (VARCHAR)    │       │ position(VARCHAR)│
│ unit (VARCHAR)   │       │ salary (VARCHAR)  │       │ linkedin(VARCHAR)│
│ stock (INTEGER)  │       │ description(TEXT) │       │ cover_letter(TEXT)│
│ image_url(VARCHAR│       │ requirements(TEXT)│       │ resume_url(VARCHA)│
│ description(TEXT)│       │ is_active(BOOLEAN)│       │ status (VARCHAR) │
│ is_active(BOOLEAN│       │ posted_date(TIMES)│       │ job_id (FK)      │
│ created_at       │       │ created_at        │       │ created_at       │
│ updated_at       │       │ updated_at        │       │ updated_at       │
└──────────────────┘       └──────────────────┘       └────────┬─────────┘
        │                                                       │
        │                                              FK: job_id → jobs.id
        │                                                       │
┌───────┴──────────┐       ┌──────────────────┐       ┌────────┴─────────┐
│   team_members   │       │      users       │       │     orders       │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (BIGSERIAL PK)│       │ id (BIGSERIAL PK)│       │ id (BIGSERIAL PK)│
│ name (VARCHAR)   │       │ name (VARCHAR)   │       │ user_id (FK)     │
│ role (VARCHAR)   │       │ email (VARCHAR)   │       │ total (DECIMAL)  │
│ email (VARCHAR)  │       │ password(VARCHAR) │       │ status (VARCHAR) │
│ photo_url(VARCHAR│       │ role (VARCHAR) ───│─┐     │ created_at       │
│ bio (TEXT)       │       │ is_active(BOOLEAN)│ │     │ updated_at       │
│ is_active(BOOLEAN│       │ created_at        │ │     └──────────────────┘
│ created_at       │       │ updated_at        │ │              │
│ updated_at       │       └──────────────────┘ │              │
└──────────────────┘                             │     ┌────────┴─────────┐
                                                 │     │   order_items    │
                                                 │     ├──────────────────┤
                                                 │     │ id (BIGSERIAL PK)│
                                                 │     │ order_id (FK)    │
                                                 │     │ product_id (FK)  │
                                                 │     │ quantity(INTEGER)│
                                                 │     │ price (DECIMAL)  │
                                                 │     └──────────────────┘
                                                 │
                                    ┌────────────┴─────────────┐
                                    │     user_permissions     │
                                    ├──────────────────────────┤
                                    │ id (BIGSERIAL PK)        │
                                    │ user_id (FK → users.id)  │
                                    │ permission (VARCHAR)     │
                                    └──────────────────────────┘
```

---

## 2. SQL SCHEMA (Copy-paste for Neon PostgreSQL)

```sql
-- ===== ENUMS =====
CREATE TYPE user_role AS ENUM ('Admin', 'Merchant', 'HR', 'Customer');
CREATE TYPE job_type AS ENUM ('Full-time', 'Part-time', 'Contract', 'Internship', 'Remote');
CREATE TYPE job_department AS ENUM ('Engineering', 'Design', 'Marketing', 'Sales', 'Customer Support', 'Operations', 'Other');
CREATE TYPE product_category AS ENUM ('Fruits & Vegetables', 'Meat & Seafood', 'Dairy & Eggs', 'Bakery & Bread', 'Drinks', 'Snacks', 'Other');
CREATE TYPE product_unit AS ENUM ('box', 'bag', 'kg', 'bottle', 'pack', 'loaf', 'tub', 'piece');
CREATE TYPE team_role AS ENUM ('Founder', 'Manager', 'Developer', 'Designer', 'Marketing', 'Support', 'Other');
CREATE TYPE application_status AS ENUM ('Pending', 'Reviewed', 'Interviewed', 'Rejected', 'Accepted');
CREATE TYPE order_status AS ENUM ('Pending', 'Confirmed', 'Processing', 'Delivered', 'Cancelled');

-- ===== USERS TABLE (System users / Auth) =====
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'Customer',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== USER PERMISSIONS (Role-based access) =====
CREATE TABLE user_permissions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(50) NOT NULL,
    UNIQUE(user_id, permission)
);

-- ===== PRODUCTS TABLE =====
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category product_category NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    old_price DECIMAL(10,2) CHECK (old_price IS NULL OR old_price > 0),
    unit product_unit,
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    image_url VARCHAR(500),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== JOBS TABLE =====
CREATE TABLE jobs (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    department job_department NOT NULL,
    location VARCHAR(200) NOT NULL,
    type job_type NOT NULL,
    salary VARCHAR(100),
    description TEXT NOT NULL,
    requirements TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    posted_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== APPLICATIONS TABLE =====
CREATE TABLE applications (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(180) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    position VARCHAR(200) NOT NULL,
    linkedin VARCHAR(500),
    cover_letter TEXT,
    resume_url VARCHAR(500) NOT NULL,
    status application_status NOT NULL DEFAULT 'Pending',
    job_id BIGINT REFERENCES jobs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== TEAM MEMBERS TABLE =====
CREATE TABLE team_members (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    role team_role NOT NULL,
    email VARCHAR(180) NOT NULL,
    photo_url VARCHAR(500),
    bio TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== ORDERS TABLE =====
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    total DECIMAL(10,2) NOT NULL,
    status order_status NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== ORDER ITEMS TABLE =====
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL
);

-- ===== INDEXES =====
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_jobs_department ON jobs(department);
CREATE INDEX idx_jobs_is_active ON jobs(is_active);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

---

## 3. SEED DATA — DEFAULT ROLE PERMISSIONS

Insert into `user_permissions` after creating a user:

| Role | Permissions |
|------|------------|
| **Admin** | Products, Jobs, Members, Users, Promotions, Applications |
| **Merchant** | Products |
| **HR** | Jobs, Members, Applications |
| **Customer** | (none — browse/public only) |

```sql
-- Example: Grant Admin full permissions
INSERT INTO user_permissions (user_id, permission) VALUES
  (1, 'Products'), (1, 'Jobs'), (1, 'Members'),
  (1, 'Users'), (1, 'Promotions'), (1, 'Applications');
```

---

## 4. REST API ENDPOINTS (Spring Boot)

### Base URL: `http://localhost:8080/api`

### Auth

| Method | Endpoint | Body | Auth |
|--------|----------|------|------|
| POST | `/auth/register` | `{ name, email, password }` | No |
| POST | `/auth/login` | `{ email, password }` | No |
| POST | `/auth/forgot-password` | `{ email }` | No |

### Products

| Method | Endpoint | Body | Auth |
|--------|----------|------|------|
| GET | `/products` | — | No |
| GET | `/products/{id}` | — | No |
| POST | `/products` | `FormData(name,category,price,oldPrice,unit,stock,image,description)` | Admin/Merchant |
| PUT | `/products/{id}` | `FormData(...)` | Admin/Merchant |
| DELETE | `/products/{id}` | — | Admin/Merchant |

### Jobs

| Method | Endpoint | Body | Auth |
|--------|----------|------|------|
| GET | `/jobs` | — | No |
| GET | `/jobs/{id}` | — | No |
| POST | `/jobs` | `{ title, department, location, type, salary, description, requirements }` | Admin/HR |
| PUT | `/jobs/{id}` | `{ ... }` | Admin/HR |
| DELETE | `/jobs/{id}` | — | Admin/HR |

### Team Members

| Method | Endpoint | Body | Auth |
|--------|----------|------|------|
| GET | `/members` | — | No |
| GET | `/members/{id}` | — | No |
| POST | `/members` | `FormData(name,role,email,photo,bio)` | Admin/HR |
| PUT | `/members/{id}` | `FormData(...)` | Admin/HR |
| DELETE | `/members/{id}` | — | Admin/HR |

### Applications

| Method | Endpoint | Body | Auth |
|--------|----------|------|------|
| GET | `/applications` | — | Admin/HR |
| GET | `/applications/{id}` | — | Admin/HR |
| POST | `/applications` | `FormData(fullName,email,phone,position,linkedin,coverLetter,resume)` | No |
| PATCH | `/applications/{id}/status` | `{ status }` | Admin/HR |
| DELETE | `/applications/{id}` | — | Admin |

### Users (System)

| Method | Endpoint | Body | Auth |
|--------|----------|------|------|
| GET | `/users` | — | Admin |
| GET | `/users/{id}` | — | Admin |
| POST | `/users` | `{ name, email, password, role }` | Admin |
| PUT | `/users/{id}` | `{ name, email, role }` | Admin |
| DELETE | `/users/{id}` | — | Admin |

### Orders

| Method | Endpoint | Body | Auth |
|--------|----------|------|------|
| GET | `/orders` | — | Admin |
| GET | `/orders/{id}` | — | User (own) / Admin |
| POST | `/orders` | `{ items: [{productId, quantity}] }` | User |
| PATCH | `/orders/{id}/status` | `{ status }` | Admin |

### Dashboard

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/dashboard/stats` | Admin/Merchant/HR |

`/dashboard/stats` response shape:
```json
{
  "totalProducts": 24,
  "totalJobs": 6,
  "totalMembers": 12,
  "totalApplications": 9,
  "productsByCategory": [
    { "category": "Fruits & Vegetables", "count": 8 },
    { "category": "Meat & Seafood", "count": 4 }
  ],
  "monthlyActivity": [
    { "month": "Jan", "count": 12 },
    { "month": "Feb", "count": 18 }
  ]
}
```

---

## 5. SPRING BOOT PROJECT STRUCTURE

```
backend/
├── pom.xml
├── src/main/java/com/bgroceries/
│   ├── BgroceriesApplication.java
│   ├── config/
│   │   ├── SecurityConfig.java
│   │   ├── CorsConfig.java
│   │   └── FileUploadConfig.java
│   ├── controller/
│   │   ├── AuthController.java
│   │   ├── ProductController.java
│   │   ├── JobController.java
│   │   ├── MemberController.java
│   │   ├── ApplicationController.java
│   │   ├── UserController.java
│   │   ├── OrderController.java
│   │   └── DashboardController.java
│   ├── service/
│   │   ├── AuthService.java
│   │   ├── ProductService.java
│   │   ├── JobService.java
│   │   ├── MemberService.java
│   │   ├── ApplicationService.java
│   │   ├── UserService.java
│   │   ├── OrderService.java
│   │   ├── DashboardService.java
│   │   └── FileStorageService.java
│   ├── repository/
│   │   ├── UserRepository.java
│   │   ├── ProductRepository.java
│   │   ├── JobRepository.java
│   │   ├── MemberRepository.java
│   │   ├── ApplicationRepository.java
│   │   ├── OrderRepository.java
│   │   └── OrderItemRepository.java
│   ├── model/
│   │   ├── User.java
│   │   ├── Product.java
│   │   ├── Job.java
│   │   ├── TeamMember.java
│   │   ├── Application.java
│   │   ├── Order.java
│   │   └── OrderItem.java
│   ├── dto/
│   │   ├── LoginRequest.java
│   │   ├── AuthResponse.java
│   │   ├── ProductDTO.java
│   │   ├── JobDTO.java
│   │   ├── MemberDTO.java
│   │   ├── ApplicationDTO.java
│   │   ├── UserDTO.java
│   │   ├── OrderDTO.java
│   │   ├── DashboardStats.java
│   │   └── ErrorResponse.java
│   ├── security/
│   │   ├── JwtTokenProvider.java
│   │   ├── JwtAuthenticationFilter.java
│   │   └── CustomUserDetailsService.java
│   └── exception/
│       ├── GlobalExceptionHandler.java
│       ├── ResourceNotFoundException.java
│       └── BadRequestException.java
├── src/main/resources/
│   ├── application.properties
│   └── application-dev.properties
└── uploads/          ← File uploads directory
```

---

## 6. application.properties (Neon PostgreSQL)

```properties
# Server
server.port=8080

# Neon PostgreSQL
spring.datasource.url=jdbc:postgresql://${NEON_HOST}:5432/${NEON_DATABASE}?sslmode=require
spring.datasource.username=${NEON_USER}
spring.datasource.password=${NEON_PASSWORD}

# JPA / Hibernate
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.properties.hibernate.format_sql=true

# File upload
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=20MB
file.upload-dir=./uploads

# JWT
app.jwt.secret=${JWT_SECRET}
app.jwt.expiration-ms=86400000

# CORS
app.cors.allowed-origins=http://localhost:5173
```

---

## 7. FRONTEND → BACKEND INTEGRATION NOTES

### File Upload (Products & Members & Applications)
- The frontend sends `multipart/form-data` for product/member creation with images, and for job applications with resume PDFs
- Backend should store files in `/uploads/` and return the URL
- Image URLs are stored as relative paths; frontend already has `api.js` with `API_BASE` configured

### auth token
- Frontend stores JWT in `localStorage` as `token`
- Every request includes `Authorization: Bearer <token>` header
- Backend should validate the token and extract user role for permission checks

### Role-based permissions
- Permission check should be done in Spring Security based on `user_permissions` table
- Admin = all permissions. Merchant = Products only. HR = Jobs+Members+Applications.

### created_at / updated_at
- All tables use `TIMESTAMPTZ`. Set `@PreUpdate` / `@PrePersist` in JPA entities, or let DB defaults handle it.

---

## 8. NEON POSTGRES SETUP

```bash
# 1. Create database in Neon Console
# 2. Run the SQL schema (Section 2 above) in Neon SQL Editor
# 3. Set environment variables in .env or Railway/Render:

NEON_HOST=ep-xxxx.us-east-2.aws.neon.tech
NEON_DATABASE=bgroceries
NEON_USER=bgroceries_owner
NEON_PASSWORD=your_password_here
JWT_SECRET=your-256-bit-secret-key
```

---

Generated for B'Groceries Frontend | Ready for Spring Boot + Neon PostgreSQL
