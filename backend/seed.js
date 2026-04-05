const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function main() {
  console.log("Cleaning up database...");
  await prisma.payment.deleteMany();
  await prisma.feeRecord.deleteMany();
  await prisma.guestRequest.deleteMany();
  await prisma.addOn.deleteMany();
  await prisma.menuSchedule.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.signOff.deleteMany();
  await prisma.messRegistration.deleteMany();
  await prisma.user.deleteMany();
  await prisma.mess.deleteMany();

  console.log("Adding Messes...");
  const messA = await prisma.mess.create({ data: { name: 'Mess A', capacity: 200 } });
  const messB = await prisma.mess.create({ data: { name: 'Mess B', capacity: 150 } });
  const messC = await prisma.mess.create({ data: { name: 'Mess C', capacity: 100 } });

  console.log("Adding Admin User...");
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password', salt);
  await prisma.user.create({
    data: { username: 'admin', password: hashedPassword, role: 'ADMIN' },
  });

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
    createdItems[item.name] = await prisma.menuItem.create({ data: item });
  }

  console.log("Creating Menu Schedules for Mess A...");
  const schedules = [
    { day: 'Monday', mealType: 'Breakfast', itemId: createdItems['Idli Sambar'].id },
    { day: 'Monday', mealType: 'Lunch', itemId: createdItems['Dal Rice & Sabji'].id },
    { day: 'Monday', mealType: 'Dinner', itemId: createdItems['Chapati & Mix Veg'].id },
    
    { day: 'Tuesday', mealType: 'Breakfast', itemId: createdItems['Poha'].id },
    { day: 'Tuesday', mealType: 'Lunch', itemId: createdItems['Paneer Butter Masala & Roti'].id },
    { day: 'Tuesday', mealType: 'Dinner', itemId: createdItems['Egg Curry & Rice'].id },
    
    { day: 'Wednesday', mealType: 'Breakfast', itemId: createdItems['Masala Dosa'].id },
    { day: 'Wednesday', mealType: 'Lunch', itemId: createdItems['Chicken Curry & Rice'].id },
    { day: 'Wednesday', mealType: 'Dinner', itemId: createdItems['Chapati & Mix Veg'].id },
  ];

  for (const schedule of schedules) {
    await prisma.menuSchedule.create({
      data: { ...schedule, messId: messA.id }
    });
    // Create identical schedules for B and C for MVP
    await prisma.menuSchedule.create({
      data: { ...schedule, messId: messB.id }
    });
    await prisma.menuSchedule.create({
      data: { ...schedule, messId: messC.id }
    });
  }

  console.log("DB Seed Completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
