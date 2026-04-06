const pool = require('./db');
const bcrypt = require('bcrypt');

async function main() {
  console.log("Creating tables...");
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "User" (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'USER'
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Mess" (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      capacity INTEGER NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "MessRegistration" (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
      "messId" INTEGER REFERENCES "Mess"(id) ON DELETE CASCADE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "MenuItem" (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      price DOUBLE PRECISION NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "MenuSchedule" (
      id SERIAL PRIMARY KEY,
      "messId" INTEGER REFERENCES "Mess"(id) ON DELETE CASCADE,
      day VARCHAR(50) NOT NULL,
      "mealType" VARCHAR(50) NOT NULL,
      "itemId" INTEGER REFERENCES "MenuItem"(id) ON DELETE CASCADE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "SignOff" (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
      "startDate" TIMESTAMP NOT NULL,
      "endDate" TIMESTAMP NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "AddOn" (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
      "itemId" INTEGER REFERENCES "MenuItem"(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "FeeRecord" (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
      "totalAmount" DOUBLE PRECISION NOT NULL,
      status VARCHAR(50) DEFAULT 'PENDING'
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Payment" (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
      amount DOUBLE PRECISION NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "GuestRequest" (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
      "guestRollNo" VARCHAR(255) NOT NULL,
      date TIMESTAMP NOT NULL,
      "mealType" VARCHAR(50) NOT NULL,
      status VARCHAR(50) DEFAULT 'PENDING'
    );
  `);

  console.log("Cleaning up database...");
  await pool.query(`DELETE FROM "Payment"`);
  await pool.query(`DELETE FROM "FeeRecord"`);
  await pool.query(`DELETE FROM "GuestRequest"`);
  await pool.query(`DELETE FROM "AddOn"`);
  await pool.query(`DELETE FROM "SignOff"`);
  await pool.query(`DELETE FROM "MenuSchedule"`);
  await pool.query(`DELETE FROM "MessRegistration"`);
  await pool.query(`DELETE FROM "MenuItem"`);
  await pool.query(`DELETE FROM "Mess"`);
  await pool.query(`DELETE FROM "User"`);

  console.log("Adding Messes...");
  const messARes = await pool.query(`INSERT INTO "Mess" (name, capacity) VALUES ('Mess A', 200) RETURNING id;`);
  const messBRes = await pool.query(`INSERT INTO "Mess" (name, capacity) VALUES ('Mess B', 150) RETURNING id;`);
  const messCRes = await pool.query(`INSERT INTO "Mess" (name, capacity) VALUES ('Mess C', 100) RETURNING id;`);
  
  const messA = messARes.rows[0].id;
  const messB = messBRes.rows[0].id;
  const messC = messCRes.rows[0].id;

  console.log("Adding Admin User...");
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password', salt);
  await pool.query(`INSERT INTO "User" (username, password, role) VALUES ($1, $2, 'ADMIN')`, ['admin', hashedPassword]);

  console.log("Adding Indian Menu Items...");
  const items = [
    { name: 'Idli Sambar', price: 40 },
    { name: 'Masala Dosa', price: 60 },
    { name: 'Poha', price: 30 },
    { name: 'Dal Rice & Sabji', price: 70 },
    { name: 'Paneer Butter Masala & Roti', price: 90 },
    { name: 'Chicken Curry & Rice', price: 110 },
    { name: 'Samosa', price: 15 },
    { name: 'Tea', price: 10 },
    { name: 'Chapati & Mix Veg', price: 60 },
    { name: 'Egg Curry & Rice', price: 80 }
  ];
  
  const createdItems = {};
  for (const item of items) {
    const res = await pool.query(`INSERT INTO "MenuItem" (name, price) VALUES ($1, $2) RETURNING id, name;`, [item.name, item.price]);
    createdItems[res.rows[0].name] = res.rows[0].id;
  }

  console.log("Creating Menu Schedules for Mess A...");
  const schedules = [
    { day: 'Monday', mealType: 'Breakfast', itemId: createdItems['Idli Sambar'] },
    { day: 'Monday', mealType: 'Lunch', itemId: createdItems['Dal Rice & Sabji'] },
    { day: 'Monday', mealType: 'Dinner', itemId: createdItems['Chapati & Mix Veg'] },
    
    { day: 'Tuesday', mealType: 'Breakfast', itemId: createdItems['Poha'] },
    { day: 'Tuesday', mealType: 'Lunch', itemId: createdItems['Paneer Butter Masala & Roti'] },
    { day: 'Tuesday', mealType: 'Dinner', itemId: createdItems['Egg Curry & Rice'] },
    
    { day: 'Wednesday', mealType: 'Breakfast', itemId: createdItems['Masala Dosa'] },
    { day: 'Wednesday', mealType: 'Lunch', itemId: createdItems['Chicken Curry & Rice'] },
    { day: 'Wednesday', mealType: 'Dinner', itemId: createdItems['Chapati & Mix Veg'] },
  ];

  for (const schedule of schedules) {
    const { day, mealType, itemId } = schedule;
    await pool.query(`INSERT INTO "MenuSchedule" ("messId", day, "mealType", "itemId") VALUES ($1, $2, $3, $4)`, [messA, day, mealType, itemId]);
    await pool.query(`INSERT INTO "MenuSchedule" ("messId", day, "mealType", "itemId") VALUES ($1, $2, $3, $4)`, [messB, day, mealType, itemId]);
    await pool.query(`INSERT INTO "MenuSchedule" ("messId", day, "mealType", "itemId") VALUES ($1, $2, $3, $4)`, [messC, day, mealType, itemId]);
  }

  console.log("DB Seed Completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
