# Project & Task Management API

A RESTful API where users register and log in, manage **projects** (MySQL) and **tasks** (MongoDB), filter and paginate tasks, and view dashboard statistics.

## Technologies

| Concern | Choice |
|---|---|
| Runtime / framework | Node.js (18.12+), Express 4 |
| Relational DB (users, projects) | MySQL via `mysql2` (connection pool, parameterised queries) |
| Document DB (tasks) | MongoDB via Mongoose |
| Auth | JWT (`jsonwebtoken`) + password hashing with `bcrypt` |
| Validation | Joi |
| Security extras | `helmet`, `cors`, rate limiting on `/api/auth` |

## Why two databases?

The assessment splits storage: **users and projects are relational data** (a project belongs to a user, enforced by a foreign key), while **tasks are documents** stored in MongoDB. Because MongoDB cannot enforce a foreign key to MySQL, the service layer verifies that a project exists and belongs to the caller before a task is created or moved, and deletes a project's tasks when the project is deleted.

## Project structure

```
src/
  config/        env loading + validation, MySQL pool, MongoDB connection
  models/        user.model.js, project.model.js (SQL queries) | task.model.js (Mongoose schema)
  validators/    Joi schemas per resource
  middleware/    auth (JWT), validate, centralised error handler + 404
  services/      business rules (ownership checks, pagination, dashboard)
  controllers/   thin HTTP layer: read request -> call service -> send response
  routes/        URL -> middleware -> controller wiring
  utils/         ApiError, asyncHandler, response helper
  app.js         Express app setup      server.js   DB connections + listen
sql/schema.sql   MySQL tables
scripts/         initDb.js (create DB + tables)
postman/         importable Postman collection
```

Request flow: `route -> authenticate -> validate -> controller -> service -> model -> database`.

## Setup

### 1. Prerequisites
- Node.js 18.12 or newer
- MySQL 8 (or MariaDB 10.5+) running locally
- MongoDB 6+ running locally, **or** a free MongoDB Atlas cluster

### 2. Install
```bash
git clone <your-repo-url>
cd project-task-api
npm install
cp .env.example .env      # Windows PowerShell: copy .env.example .env
```

### 3. Environment variables (`.env`)

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | `development` or `production` | `development` |
| `PORT` | API port | `5000` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:3000` |
| `MYSQL_HOST` / `MYSQL_PORT` | MySQL server | `localhost` / `3306` |
| `MYSQL_USER` / `MYSQL_PASSWORD` | MySQL credentials | `root` / `...` |
| `MYSQL_DATABASE` | Database name | `project_task_db` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/project_task_db` |
| `JWT_SECRET` | Long random secret used to sign tokens | generate below |
| `JWT_EXPIRES_IN` | Token lifetime | `1d` |
| `BCRYPT_SALT_ROUNDS` | bcrypt cost factor | `10` |

Generate a secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

The app refuses to start if a required variable is missing. `.env` is git-ignored; only `.env.example` is committed.

### 4. MySQL configuration

Easiest: let the script do it (creates the database and both tables, safe to re-run):
```bash
npm run db:init
```

Manual alternative:
```bash
mysql -u root -p -e "CREATE DATABASE project_task_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p project_task_db < sql/schema.sql
```

Schema summary:

| Table | Columns | Notes |
|---|---|---|
| `users` | `id` PK, `name`, `email` **UNIQUE**, `password_hash`, timestamps | duplicate emails rejected by the DB itself |
| `projects` | `id` PK, `user_id` **FK -> users(id) ON DELETE CASCADE**, `name`, `description`, `status` ENUM(`active`,`completed`,`archived`), timestamps | index on `(user_id, status)` |

### 5. MongoDB configuration

No manual setup: the `tasks` collection and its indexes are created automatically on first use.
- Local: start `mongod` and keep the default `MONGO_URI`.
- Atlas: paste your connection string into `MONGO_URI` (and allow your IP in Atlas Network Access).

Task document: `title`, `description`, `status` (`todo|in_progress|completed`), `priority` (`low|medium|high`), `dueDate`, `projectId` (MySQL project id), `userId` (MySQL user id), `createdAt`, `updatedAt`.

### 6. Run
```bash
npm run dev     # auto-restart on change (Node --watch)
npm start       # plain start
```
Health check: `GET http://localhost:5000/health`

## Response format

Success:
```json
{ "success": true, "message": "Projects fetched successfully", "data": { } }
```
Paginated lists add a top-level `pagination` object. Errors:
```json
{ "success": false, "message": "Validation failed", "errors": [{ "field": "email", "message": "email must be a valid email" }] }
```

| Status | Used for |
|---|---|
| 200 / 201 | OK / created |
| 400 | validation failure, invalid id format, malformed JSON |
| 401 | missing/invalid/expired token, wrong credentials |
| 404 | resource missing **or not owned by caller**, unknown route |
| 409 | duplicate email |
| 503 | database unreachable |
| 500 | unexpected server error (details hidden in production) |

All endpoints except `register` and `login` require `Authorization: Bearer <token>`.

## API reference

### Auth

**POST `/api/auth/register`**
```json
{ "name": "Alice", "email": "alice@example.com", "password": "Passw0rd123" }
```
`201`
```json
{ "success": true, "message": "User registered successfully",
  "data": { "user": { "id": 1, "name": "Alice", "email": "alice@example.com", "createdAt": "...", "updatedAt": "..." },
            "token": "<jwt>" } }
```
Rules: name 2-100 chars; valid email (stored lower-case); password 8-72 chars with at least one letter and one number. Duplicate email -> `409`.

**POST `/api/auth/login`** body `{ "email", "password" }` -> `200` same shape as register. Wrong email or password -> `401 "Invalid email or password"` (same message for both).

**GET `/api/auth/me`** -> `200` `{ "data": { "id": 1, "name": "Alice", "email": "alice@example.com", ... } }`

**PUT `/api/auth/profile`** - send at least one of `name`, `email`, or `newPassword` (+ `currentPassword`, required together).
```json
{ "name": "Alice Updated" }
```
Always applies to the authenticated user; there is no user id in the URL.

### Projects (owner-only)

| Method | Path | Body / query |
|---|---|---|
| POST | `/api/projects` | `{ "name", "description?", "status?" }` (status defaults to `active`) |
| GET | `/api/projects` | optional `?status=active\|completed\|archived` |
| GET | `/api/projects/:id` | |
| PUT | `/api/projects/:id` | any of `name`, `description`, `status` (at least one) |
| DELETE | `/api/projects/:id` | also deletes the project's tasks |

Sample `POST /api/projects` -> `201`:
```json
{ "success": true, "message": "Project created successfully",
  "data": { "id": 4, "userId": 1, "name": "Website Redesign", "description": "Q4 redesign",
            "status": "active", "createdAt": "...", "updatedAt": "..." } }
```
Project ids are integers; a non-integer id returns `400`. Someone else's project returns `404`.

### Tasks (owner-only)

| Method | Path | Body |
|---|---|---|
| POST | `/api/tasks` | `{ "title", "projectId", "description?", "status?" (todo), "priority?" (medium), "dueDate?" (ISO date) }` |
| GET | `/api/tasks` | see filtering below |
| GET | `/api/tasks/:id` | |
| PUT | `/api/tasks/:id` | any of the create fields (at least one); a new `projectId` must also be yours |
| DELETE | `/api/tasks/:id` | |

Task ids are 24-character MongoDB ObjectIds; a malformed id returns `400`, a well-formed but unknown id `404`. Creating a task in a project that doesn't exist or isn't yours returns `404 "Project not found"`.

### Filtering and pagination - `GET /api/tasks`

| Query | Default | Rules |
|---|---|---|
| `page` | 1 | integer >= 1 |
| `limit` | 10 | integer 1-100 |
| `status` | - | `todo`, `in_progress`, `completed` |
| `priority` | - | `low`, `medium`, `high` |
| `projectId` | - | integer |

`GET /api/tasks?page=1&limit=10&status=todo&priority=high` -> `200`
```json
{
  "success": true,
  "message": "Tasks fetched successfully",
  "data": [
    { "id": "66f1c0a2b7d3e4a1c2d3e4f5", "title": "Design homepage", "description": "Hero + CTA",
      "status": "todo", "priority": "high", "dueDate": "2026-12-31T00:00:00.000Z",
      "projectId": 4, "userId": 1, "createdAt": "...", "updatedAt": "..." }
  ],
  "pagination": { "page": 1, "limit": 10, "totalRecords": 23, "totalPages": 3, "hasNextPage": true, "hasPrevPage": false }
}
```
Results are newest first. A page past the end returns `200` with an empty `data` array.

### Dashboard - `GET /api/dashboard`
```json
{ "success": true, "message": "Dashboard fetched successfully",
  "data": {
    "projects": { "total": 5, "active": 3, "completed": 1 },
    "tasks": { "total": 23, "pending": 15, "completed": 8, "highPriority": 6 }
  } }
```
Project figures come from MySQL (one aggregate query), task figures from MongoDB (one aggregation); both run in parallel. **Pending** = `todo` + `in_progress`. **High-priority** = every task with priority `high`.

## Security and design notes

- Passwords hashed with bcrypt; the hash is never selected into API responses.
- JWT signed with HS256 and verified with an explicit algorithm list; the user is re-loaded from MySQL on each request so tokens for deleted users stop working.
- Every SQL statement is parameterised; update column names come from a whitelist.
- Ownership is enforced inside the queries (`WHERE id = ? AND user_id = ?`, `{ _id, userId }`), not just checked afterwards.
- Other users' resources return `404` instead of `403` so ids can't be probed.
- Login returns one generic message and does a dummy bcrypt compare for unknown emails.
- Body size limited to 10 KB; Joi strips unknown fields.
- Tasks and projects live in different databases, so there is no cross-database transaction. If the MongoDB cleanup after a project delete fails, it is logged; those tasks are unreachable through the API.

## Testing

The Postman collection contains 9 requests covering the main authentication, project, and task flows.

Import `postman/My API Tests.postman_collection.json` and run the requests in this order:

1. Run **register** with a new email, then run **login** and **auth me**. The login response saves the JWT to the collection variable used by protected requests.
2. Run **create project**. The later requests currently use project id `3`; replace it with the id returned by your database if needed.
3. Run **create a task**. The update request uses the task id `6ace0c3d4ca2462df8723039`; replace it with the id returned by the create request.
4. Run **list projects**, **get one project**, **list of tasks with pagination and filters**, and **update a task**.

The collection covers registration, login, an authenticated user lookup, project creation/listing/lookup, task creation, task listing with pagination and `status` filtering, and task update. The collection does not currently include profile update, delete, dashboard, validation-error, or unauthorized-access requests.
