const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const actuators = await prisma.actuator.findMany({ include: { device: true } });
  console.log('Actuators:', JSON.stringify(actuators, null, 2));
  await prisma.$disconnect();
}
check();
