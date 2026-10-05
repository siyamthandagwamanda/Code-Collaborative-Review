<img src="https://socialify.git.ci/siyamthandagwamanda/Code-Collaborative-Review/image?language=1&owner=1&name=1&stargazers=1&theme=Light" alt="Code-Collaborative-Review" width="640" height="320" />

# Code Collaborative Review API

An API-driven platform where developers post code, request feedback, comment on specific lines, and track whether a submission is approved or needs changes, with real-time notifications.

It replaces noisy, pull-request-only reviews with a structured, asynchronous review process: submitters upload code to a project, reviewers who belong to that project comment (inline or general) and either approve or request changes, and everyone is notified live over WebSockets.

## Features

- **Authentication and users**: register, login with JWT, bcrypt password hashing, profile management

- **Role-based access control**: `submitter` and `reviewer` roles, plus project-level owner and member permissions

- **Projects**: create projects, assign and remove reviewers, list projects with their members

- **Code submissions**: upload code (text) to a project and track status: `pending`, `in_review`, `approved`, `changes_requested`

- **Comments**: general comments or inline comments on a specific line (`line_number`), full CRUD with permissions (submitters cannot comment)

- **Review workflow**: approve or request changes, with a complete review history per submission

- **Notifications**: REST activity feed and real-time push over WebSockets

- **Analytics**: per-project stats: approval percentage, average time to first review, reviewer activity, most commented submission

## Tech stack

```
Area | Technology 
Runtime | Node.js |
Language | TypeScript |
Framework | Express 5 |
Database | PostgreSQL (`pg` connection pool) |
Auth | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` |
Real time | `ws` (WebSockets) |
Dev tooling | `tsx`, `nodemon` |
```

## Architecture

The code is organised in layers. Each layer has one job and talks only to the layer below it.

```
Client (Postman / WebSocket client)
   |
app.ts          express.json(), mounts routers under /api/...
   |
Routes          match URL + method, attach middleware, pick a controller
   |
Middleware      authenticate (who are you?), authorizeRoles (are you allowed?)
   |
Controllers     read the request, check input shape, call ONE service, send status + JSON
   |
Services        business rules + SQL via pool.query, throw HttpError on failure
   |
PostgreSQL
```

- **Controllers** know HTTP (`req`, `res`, status codes) but never write SQL.

- **Services** hold business rules and queries but know nothing about `req` or `res`.

- Services report failures by throwing an `HttpError(status, message)`, which the controller turns into the response.

- Notifications are created in one place (`createNotification`), which saves the row and pushes it to the recipient's open WebSocket.

## Project structure

```
src/
  server.ts                
  app.ts                    
  websocket.ts              WebSocket server, JWT authentication, sendToUser
  db/
    db.ts                   shared PostgreSQL connection pool
    init-db.ts              creates all tables (npm run db:init)
    test-db.ts              checks the database connection
  models/                   
  utils/
    http-error.ts           Error carrying an HTTP status
    send-error.ts           converts any error into a response
  middleware/
    auth.middleware.ts      authenticate, authorizeRoles
  routes/                   
  controllers/              
   
  services/                 auth, user, project, submission, comment, review,
                            notification, stats
```

## Getting started

### Prerequisites

- Node.js 18 or newer
- PostgreSQL 14 or newer (running locally)
- Postman (or any HTTP client) and a WebSocket client for testing

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/siyamthandagwamanda/Code-Collaborative-Review.git
cd Code-Collaborative-Review

# 2. Install dependencies
npm install

# 3. Create the database
pgAdmin 4: right-click Databases, Create, Database, name it `code_collabing_review_db`

# 4. Configure environment variables
cp .env.example .env
# then open .env and fill in your values

# 5. Create the tables
npm run db:init

# 6. Start the development server
npm run dev
```

The API is now available at `http://localhost:3000`. Check it with:

```bash
curl http://localhost:3000/testing
# {"status":"ok"}
```

> **Warning:** `npm run db:init` drops and recreates every table, so it erases all data. Use it for first-time setup and for resetting a development database.

### Production build

```bash
npm run build
npm start
```

## Environment variables

Create a `.env` file in the **project root** (copy `.env.example`). Never commit it.
```
| Variable | Description | Example |

| `PORT` | Port the server listens on | `3000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `code_collabing_review_db` |
| `DB_USER` | PostgreSQL user | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `your_password_here` |
| `JWT_SECRET` | Secret used to sign tokens | long random string |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
```

Generate a strong secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Scripts

`npm run dev` | `nodemon --watch src --ext ts --exec tsx src/server.ts` 
Development server with auto-restart 

`npm run db:init` | `tsx src/db/init-db.ts`
Create all tables (drops existing ones)

`npm run typecheck` | `tsc --noEmit`
Type-check without building

`npm run build` | `tsc`
Compile TypeScript to `dist/`

`npm start` | `node dist/server.js`
Run the compiled app 

## Roles and permissions

There are two user roles, `submitter` and `reviewer`, chosen at registration. Within a project, a user is either the **owner** (creator) or a **member** (an assigned reviewer).

Rules worth knowing:

- Only users with the `reviewer` role can be added to a project.
- Requesting changes requires feedback.
- An approved submission cannot be reviewed again (`409`).
- You cannot delete a user who still owns projects or submissions (`409`).

## API reference

Base URL: `http://localhost:3000`

`POST /api/auth/register` and `POST /api/auth/login`

```
Authorization: Bearer <token>
```

Request and response bodies are JSON (`Content-Type: application/json`).

### Auth
```
POST
 `/api/auth/register`

POST
`/api/auth/login`
```

### Users
```
GET `/api/users/:id`

PUT `/api/users/:id` 

DELETE `/api/users/:id`

GET `/api/users/:id/notifications`
```

### Projects and members
```
POST `/api/projects`
GET `/api/projects` 
POST `/api/projects/:id/members`owner
DELETE `/api/projects/:id/members/:userId`
GET `/api/projects/:id/submissions`
GET `/api/projects/:id/stats`
```

### Submissions
```
POST `/api/submissions` submitter,
GET  `/api/submissions/:id`
PUT `/api/submissions/:id/status`
DELETE `/api/submissions/:id`
Valid statuses: `pending`, `in_review`, `approved`, `changes_requested`.
```

### Comments
```
POST `/api/submissions/:id/comments`
GET `/api/submissions/:id/comments`
PUT `/api/comments/:id`
DELETE `/api/comments/:id`

`line_number` is optional: omit it for a general comment, or provide a whole number of at least 1 for an inline comment.
```

### Review workflow

Each decision is stored as a new row in `reviews`, so the history is preserved, and the submission's `status` is updated to match.

### Example usage

Register:

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Siyamthanda",
  "email": "siyamthanda@test.com",
  "password": "pass123",
  "role": "reviewer"
}
```

Login response:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 2,
    "name": "Siyamthanda",
    "email": "siyamthanda@test.com",
    "display_picture": null,
    "role": "reviewer",
    "created_at": "2026-10-05T08:12:44.120Z"
  }
}
```

```http
POST /api/submissions
{
  "project_id": 1,
  "title": "Login service",
  "code": "function add(a, b) {\n  return a + b;\n}"
}
```

Add an inline comment:

```http
POST /api/submissions/1/comments

{ "body": "Rename this variable", "line_number": 2 }
```

Request changes:

```http
POST /api/submissions/1/request-changes

{ "feedback": "Add input validation" }
```
List projects (note the `members` array):

```json
[
  {
    "id": 1,
    "name": "Build An Api",
    "description": "How to build an api",
    "owner_id": 1,
    "created_at": "2026-10-05T08:20:01.000Z",
    "members": [
      { "id": 2, "name": "Siyamthanda", "email": "siyamthanda@test.com", "role": "reviewer" }
    ]
  }
]
```

Project stats (`GET /api/projects/1/stats`):

```json
{
  "project_id": 1,
  "total_submissions": 3,
  "approved": 1,
  "changes_requested": 1,
  "awaiting_review": 1,
  "approved_percentage": 50,
  "changes_requested_percentage": 50,
  "avg_review_time_seconds": 125,
  "avg_review_time_hours": 0.03,
  "reviewer_activity": [
    { "reviewer_id": 2, "name": "Sipho", "reviews_count": 2, "comments_count": 4 }
  ],
  "most_commented_submission": { "id": 2, "title": "Login service", "comment_count": 3 }
}
```

How the stats are calculated:

- **Approval percentages** use decided submissions only (`approved` plus `changes_requested`). Submissions still waiting are reported as `awaiting_review`.

- **Average review time** is the time from a submission's creation to its first review.

- **Reviewer activity** counts each member reviewer's reviews and comments in the project.

- **Most commented submission** is the submission with the highest comment count (`null` if there are none).


## WebSocket notifications

Notifications are saved to the database and pushed live to the recipient if they are connected.

Connect with your JWT in the query string:

```
ws://localhost:3000/ws?token=<JWT>
```

A missing or invalid token closes the connection with code `4401`.

Who is notified:
```

Event | Recipients
New submission | Project owner and member reviewers (not the submitter) |
New comment | The submission's submitter |
Approve or request changes | The submission's submitter |
```

Offline users miss nothing: every notification is also available at `GET /api/users/:id/notifications`.

To test: in Postman choose **New, WebSocket**, enter the URL above with a real token,
 click 
 **Connect**,
then trigger an event as another user from a normal request tab. 
From a terminal: `npx wscat -c "ws://localhost:3000/ws?token=<JWT>"`.

## Database schema

Seven tables:

```
users            id, name, email (unique), password_hash, display_picture, role, created_at
projects         id, name, description, owner_id -> users, created_at
project_members  id, project_id -> projects, user_id -> users
submissions      id, project_id -> projects, submitter_id -> users, title, code, status, created_at
comments         id, submission_id -> submissions, author_id -> users, line_number, body, created_at
reviews          id, submission_id -> submissions, reviewer_id -> users, status, comment, created_at
notifications    id, user_id -> users, message, is_read, created_at
```

- `project_members` is a join table (many users to many projects).

Tables are created by `src/db/init-db.ts`.


## Testing with Postman

1. Create an environment with `baseUrl = http://localhost:3000` and variables for each token 
1. Register an owner, a reviewer, and a submitter. Log in as each.
2. Owner creates a project and adds the reviewer.
3. Submitter creates a submission.
4. Reviewer adds an inline comment, then requests changes, then approves.
5. Check 
`GET /api/submissions/:id/reviews`, `GET /api/users/:id/notifications`, and `GET /api/projects/:id/stats`.
6. Check the guards: no token returns `401`, a submitter commenting returns `403`, approving twice returns `409`.

## Design decisions

- **Layered architecture** keeps HTTP handling, business rules, and SQL separate, so each can change independently.
- **`HttpError`** lets services signal 403, 404, 409 and so on without knowing anything about the response object.
- **Parameterised queries** (`$1`, `$2`) are used everywhere to prevent SQL injection.
- **Passwords** are hashed with bcrypt and the hash is never returned: it is excluded from every `RETURNING` and select list.
- **JWT payload** carries only `id` and `role`, so most requests need no extra query to identify the caller.
- **Reviews are append-only** so the history of decisions is never lost.
- **Notification failures never break the main action.** They are logged, since the comment or review has already been saved.
- **One notification function** (`createNotification`) saves the row and pushes it live, so the REST feed and WebSocket stream always agree.

## Known limitations and roadmap

Honest list of what would be improved next:

- Validation and error-handling middleware (Sprint 8): centralised input validation, a 404 handler, and a global error handler
- Automated tests
- `getAllProjects` runs one members query per project; a single query with `json_agg` would be more efficient
- Approving or requesting changes inserts a review and updates the status as two queries; a database transaction would make them atomic
- Anyone can register as a reviewer; production use would need invitations or an admin
- WebSocket token is sent in the query string; a short-lived ticket would be safer
- Socket tracking lives in server memory, so multiple instances would need Redis or similar
- Refresh tokens, rate limiting, and pagination
- Mark-notification-as-read endpoint (the `is_read` column already exists)

## Author

**Siyamthanda Gwamanda**
mLab CodeTribe Academy, Cohort 26/26

Built as Task 4: Node TS, Code Collaborative Review.
