const { PrismaClient } = require('@prisma/client');

// Use a singleton instance of PrismaClient in development to avoid hitting connection limits
const prisma = new PrismaClient();

module.exports = prisma;
