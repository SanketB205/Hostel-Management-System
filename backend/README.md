# HostelSpace Backend

Node.js, Express, Sequelize, and MySQL API for HostelSpace. The frontend remains on its current local state until each API module is integrated.

## Start

1. Copy `.env.example` to `.env` and set MySQL credentials.
2. Create the MySQL database named in `DB_NAME`.
3. Run `npm install` inside `backend`.
4. Run `npm run dev`.

The first startup creates the `users` table and seeds the configured Admin account. Test the API at `GET /api/health`.

## Available endpoints

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

All endpoints below require `Authorization: Bearer <token>`.

- `GET, POST /api/hostel/blocks`
- `POST /api/hostel/blocks/:blockId/floors`
- `GET /api/hostel/rooms`
- `POST /api/hostel/floors/:floorId/rooms`
- `GET, POST /api/students`
- `POST /api/allocations`
- `PATCH /api/allocations/:allocationId/vacate`

Attendance, complaints, finance, staff, and notifications will be introduced incrementally so existing frontend behaviour is not interrupted.
