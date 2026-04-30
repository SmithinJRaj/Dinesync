# DineSync

DineSync is a comprehensive, full-stack Mess and Dining Management System designed to handle complex billing, rotating menus, guest services, and student meal sign-offs. Built with a robust Express/PostgreSQL backend and a modern Next.js frontend, DineSync provides a seamless experience for both students and administrators.

## Features

- **Role-Based Access Control (RBAC):** Distinct domains and administrative guards for `ADMIN` and `USER` roles to ensure data security.
- **Dynamic Billing Engine:** Automatically calculates total dues based on base charges, add-on purchases, guest requests, and deductions from meal sign-offs, grouped by customizable billing epochs/cycles.
- **Mess & Menu Management:** Supports multiple messes with unique capacities and rotating weekly menu schedules for Breakfast, Lunch, and Dinner.
- **Student Services:**
  - **Sign-offs:** Students can request to skip meals, generating automated bill deductions.
  - **Guest Services:** Students can request meals for guests, integrated directly into their monthly billing.
  - **Add-on Transactions:** Purchase extra items (e.g., special meals or snacks) that are tracked and billed appropriately.
- **Administrative Dashboard:** Powerful controls to approve/reject requests, manage billing cycles, track payments, and delete billing epochs while maintaining database integrity.

## Tech Stack

### Frontend
- **Framework:** Next.js
- **UI Library:** React
- **Styling:** Tailwind CSS (v4)
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL (raw SQL queries with `pg` module)
- **Authentication:** JWT (`jsonwebtoken`) & `bcrypt` for secure password hashing
- **Environment Management:** `dotenv`

## Project Structure

- `/frontend` - Contains the Next.js client application.
- `/backend` - Contains the Express server, database connection, middleware, and API route handlers.

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL

### Database Setup
1. Create a PostgreSQL database.
2. Update the `.env` file in the `/backend` directory with your database credentials:
   ```env
   DB_USER=your_user
   DB_HOST=localhost
   DB_DATABASE=your_database
   DB_PASSWORD=your_password
   DB_PORT=5432
   PORT=5000
   JWT_SECRET=your_jwt_secret
   ```
3. Run the database seed script to set up tables, custom types, and initial mock data:
   ```bash
   cd backend
   node seed.js
   ```

### Running the Backend
```bash
cd backend
npm install
npm run dev
```

### Running the Frontend
```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at [http://localhost:3000](http://localhost:3000) and the backend API will run on `http://localhost:5000`.

## Architecture Highlights
- **Raw SQL Transactions:** Optimized raw SQL queries for performant execution and complex transactional integrity.
- **Server-Side Middleware:** Strict API route protection to maintain isolation between Admin and User scopes.
- **Data Integrity:** Enforcement of business logic via robust database check constraints (e.g., date ranges, capacities).

## License
MIT
