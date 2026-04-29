const pool = require('./db');
const bcrypt = require('bcrypt');

async function main() {
  try {
    console.log("Dropping existing tables and types...");
    await pool.query(`
      DROP TABLE IF EXISTS 
        "Payment", "FeeRecord", "AddOnTransaction", "GuestService", "SignOff", 
        "MessRegistration", "BillingCycle", "MenuSchedule", "MenuCycle", "MenuItem", 
        "Mess", "Session", "Admin", "Student", "Account",
        Payment, FeeRecord, AddOnTransaction, GuestService, SignOff, MessRegistration, 
        BillingCycle, MenuSchedule, MenuCycle, MenuItem, Mess, Session, Admin, Student, Account,
        "GuestRequest", "AddOn", "User" CASCADE;

      DROP TYPE IF EXISTS 
        user_role, account_status_enum, day_of_week_enum, meal_session_enum, 
        request_status_enum, payment_status_enum CASCADE;
    `);

    console.log("Creating ENUM types...");
    await pool.query(`
      CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
      CREATE TYPE account_status_enum AS ENUM ('ACTIVE', 'INACTIVE');
      CREATE TYPE day_of_week_enum AS ENUM ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun');
      CREATE TYPE meal_session_enum AS ENUM ('Breakfast', 'Lunch', 'Snacks', 'Dinner');
      CREATE TYPE request_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
      CREATE TYPE payment_status_enum AS ENUM ('PENDING', 'PARTIAL', 'PAID');
    `);

    console.log("Creating tables...");
    await pool.query(`
      CREATE TABLE "Account" (
          user_id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role user_role NOT NULL,
          account_status account_status_enum NOT NULL
      );

      CREATE TABLE "Student" (
          student_id INTEGER PRIMARY KEY REFERENCES "Account"(user_id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          phone_number VARCHAR(50)
      );

      CREATE TABLE "Admin" (
          admin_id INTEGER PRIMARY KEY REFERENCES "Account"(user_id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          phone_number VARCHAR(50)
      );

      CREATE TABLE "Session" (
          session_id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES "Account"(user_id) ON DELETE CASCADE,
          session_token VARCHAR(255) UNIQUE NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP NOT NULL
      );

      CREATE TABLE "Mess" (
          mess_id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          location VARCHAR(255),
          capacity INTEGER NOT NULL CHECK (capacity >= 0),
          guest_capacity_per_session INTEGER NOT NULL CHECK (guest_capacity_per_session >= 0)
      );

      CREATE TABLE "MenuItem" (
          item_id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          price DECIMAL(10,2) NOT NULL CHECK (price >= 0)
      );

      CREATE TABLE "MenuCycle" (
          cycle_id SERIAL PRIMARY KEY,
          day_of_week day_of_week_enum NOT NULL,
          meal_session meal_session_enum NOT NULL,
          CONSTRAINT unique_day_meal UNIQUE (day_of_week, meal_session)
      );

      CREATE TABLE "MenuSchedule" (
          mess_id INTEGER NOT NULL REFERENCES "Mess"(mess_id) ON DELETE CASCADE,
          cycle_id INTEGER NOT NULL REFERENCES "MenuCycle"(cycle_id) ON DELETE CASCADE,
          item_id INTEGER NOT NULL REFERENCES "MenuItem"(item_id) ON DELETE CASCADE,
          PRIMARY KEY (mess_id, cycle_id, item_id)
      );

      CREATE TABLE "BillingCycle" (
          cycle_id SERIAL PRIMARY KEY,
          cycle_name VARCHAR(255) NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          CONSTRAINT check_billing_dates CHECK (start_date <= end_date)
      );

      CREATE TABLE "MessRegistration" (
          student_id INTEGER NOT NULL REFERENCES "Student"(student_id) ON DELETE CASCADE,
          mess_id INTEGER NOT NULL REFERENCES "Mess"(mess_id) ON DELETE CASCADE,
          cycle_id INTEGER NOT NULL REFERENCES "BillingCycle"(cycle_id) ON DELETE CASCADE,
          guest_availed INTEGER DEFAULT 0,
          signoff_availed INTEGER DEFAULT 0,
          PRIMARY KEY (student_id, cycle_id)
      );

      CREATE TABLE "SignOff" (
          signoff_id SERIAL PRIMARY KEY,
          student_id INTEGER NOT NULL REFERENCES "Student"(student_id) ON DELETE CASCADE,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          status request_status_enum NOT NULL,
          CONSTRAINT check_signoff_dates CHECK (start_date <= end_date)
      );

      CREATE TABLE "GuestService" (
          guest_request_id SERIAL PRIMARY KEY,
          student_id INTEGER NOT NULL REFERENCES "Student"(student_id) ON DELETE CASCADE,
          mess_id INTEGER NOT NULL REFERENCES "Mess"(mess_id) ON DELETE CASCADE,
          meal_session meal_session_enum NOT NULL,
          request_date DATE NOT NULL,
          status request_status_enum NOT NULL
      );

      CREATE TABLE "AddOnTransaction" (
          transaction_id SERIAL PRIMARY KEY,
          student_id INTEGER NOT NULL REFERENCES "Student"(student_id) ON DELETE CASCADE,
          item_id INTEGER NOT NULL REFERENCES "MenuItem"(item_id) ON DELETE CASCADE,
          quantity INTEGER NOT NULL CHECK (quantity >= 0),
          purchase_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE "FeeRecord" (
          fee_record_id SERIAL PRIMARY KEY,
          student_id INTEGER NOT NULL REFERENCES "Student"(student_id) ON DELETE CASCADE,
          cycle_id INTEGER NOT NULL REFERENCES "BillingCycle"(cycle_id) ON DELETE CASCADE,
          base_charge DECIMAL(10,2) NOT NULL CHECK (base_charge >= 0),
          signoff_deduction DECIMAL(10,2) NOT NULL CHECK (signoff_deduction >= 0),
          addon_total DECIMAL(10,2) NOT NULL CHECK (addon_total >= 0),
          total_due DECIMAL(10,2) NOT NULL CHECK (total_due >= 0),
          payment_status payment_status_enum NOT NULL,
          UNIQUE (student_id, cycle_id)
      );

      CREATE TABLE "Payment" (
          payment_id SERIAL PRIMARY KEY,
          fee_record_id INTEGER NOT NULL REFERENCES "FeeRecord"(fee_record_id) ON DELETE CASCADE,
          amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
          payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          recorded_by INTEGER NOT NULL REFERENCES "Account"(user_id)
      );
    `);

    console.log("Creating Indexes...");
    await pool.query(`
      CREATE INDEX idx_session_user_id ON "Session"(user_id);
      CREATE INDEX idx_menuschedule_mess_id ON "MenuSchedule"(mess_id);
      CREATE INDEX idx_menuschedule_cycle_id ON "MenuSchedule"(cycle_id);
      CREATE INDEX idx_menuschedule_item_id ON "MenuSchedule"(item_id);
      CREATE INDEX idx_messregistration_student_id ON "MessRegistration"(student_id);
      CREATE INDEX idx_messregistration_mess_id ON "MessRegistration"(mess_id);
      CREATE INDEX idx_messregistration_cycle_id ON "MessRegistration"(cycle_id);
      CREATE INDEX idx_signoff_student_id ON "SignOff"(student_id);
      CREATE INDEX idx_guestservice_student_id ON "GuestService"(student_id);
      CREATE INDEX idx_guestservice_mess_id ON "GuestService"(mess_id);
      CREATE INDEX idx_addontransaction_student_id ON "AddOnTransaction"(student_id);
      CREATE INDEX idx_addontransaction_item_id ON "AddOnTransaction"(item_id);
      CREATE INDEX idx_feerecord_student_id ON "FeeRecord"(student_id);
      CREATE INDEX idx_feerecord_cycle_id ON "FeeRecord"(cycle_id);
      CREATE INDEX idx_payment_fee_record_id ON "Payment"(fee_record_id);
      CREATE INDEX idx_payment_recorded_by ON "Payment"(recorded_by);
    `);

    console.log("Inserting Billing Cycle...");
    await pool.query(`
      INSERT INTO "BillingCycle" (cycle_name, start_date, end_date)
      VALUES ($1, CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '30 days')
    `, ['Current Month']);

    console.log("Inserting Admin User...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('adminpassword123', salt);
    
    const accountRes = await pool.query(
      `INSERT INTO "Account" (username, password_hash, role, account_status)
       VALUES ($1, $2, $3, $4) RETURNING user_id`,
      ['admin', hashedPassword, 'ADMIN', 'ACTIVE']
    );
    const adminId = accountRes.rows[0].user_id;

    await pool.query(
      `INSERT INTO "Admin" (admin_id, name, email, phone_number)
       VALUES ($1, $2, $3, $4)`,
      [adminId, 'Super Admin', 'admin@dinesync.com', '1234567890']
    );

    console.log("Inserting Student User...");
    const studentPasswordHash = await bcrypt.hash('password123', salt);
    
    const studentAccountRes = await pool.query(
      `INSERT INTO "Account" (username, password_hash, role, account_status)
       VALUES ($1, $2, $3, $4) RETURNING user_id`,
      ['teststudent', studentPasswordHash, 'USER', 'ACTIVE']
    );
    const studentId = studentAccountRes.rows[0].user_id;

    await pool.query(
      `INSERT INTO "Student" (student_id, name, email, phone_number)
       VALUES ($1, $2, $3, $4)`,
      [studentId, 'Test Student', 'student@dinesync.com', '1234567891']
    );

    console.log("Inserting Mess entries...");
    const messRes = await pool.query(`
      INSERT INTO "Mess" (name, location, capacity, guest_capacity_per_session) VALUES
      ('North Block Mess', 'North Wing', 500, 50),
      ('South Block Mess', 'South Wing', 450, 40),
      ('Central Dining', 'Main Campus', 800, 100)
      RETURNING mess_id
    `);
    const messes = messRes.rows;

    console.log("Inserting Menu Items...");
    const menuItemRes = await pool.query(`
      INSERT INTO "MenuItem" (name, price) VALUES
      ('Idli & Vada', 30.00),
      ('Masala Dosa', 40.00),
      ('Poha & Jalebi', 25.00),
      ('North Indian Thali', 60.00),
      ('South Indian Thali', 55.00),
      ('Chicken Biryani', 120.00),
      ('Veg Pulao', 80.00),
      ('Chapati & Paneer Curry', 70.00),
      ('Egg Fried Rice', 65.00),
      ('Fresh Fruit Salad', 35.00)
      RETURNING item_id
    `);
    const items = menuItemRes.rows;

    console.log("Inserting Menu Cycle...");
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const sessions = ['Breakfast', 'Lunch', 'Dinner']; // 3 sessions as required
    const cycles = [];

    for (const day of days) {
      for (const session of sessions) {
        const cycleRes = await pool.query(
          `INSERT INTO "MenuCycle" (day_of_week, meal_session)
           VALUES ($1, $2) RETURNING cycle_id`,
          [day, session]
        );
        cycles.push(cycleRes.rows[0]);
      }
    }

    console.log("Inserting Menu Schedule (Rotating)...");
    for (let i = 0; i < messes.length; i++) {
      const messId = messes[i].mess_id;
      for (let j = 0; j < cycles.length; j++) {
        const cycleId = cycles[j].cycle_id;
        const itemIndex = (i * 3 + j) % items.length;
        const itemId = items[itemIndex].item_id;

        await pool.query(
          `INSERT INTO "MenuSchedule" (mess_id, cycle_id, item_id)
           VALUES ($1, $2, $3)`,
          [messId, cycleId, itemId]
        );
      }
    }

    console.log("Database Seed Data successfully created.");
  } catch (err) {
    console.error("Error during seeding:", err);
  } finally {
    await pool.end();
  }
}

main();
