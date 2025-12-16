const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@chandramaautomation.com';
  const password = 'SuperAdmin@123'; // Change this!
  
  // Check if admin exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email }
  });

  if (existingAdmin) {
    // Update to SUPER_ADMIN if not already
    await prisma.user.update({
      where: { email },
      data: { role: 'SUPER_ADMIN' }
    });
    console.log('✅ Existing user updated to SUPER_ADMIN:', email);
  } else {
    // Create new super admin
    const passwordHash = await bcrypt.hash(password, 12);
    
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: 'Super Admin',
        phone: '+919999999999',
        role: 'SUPER_ADMIN'
      }
    });
    console.log('✅ Super Admin created:', email);
    console.log('🔑 Password:', password);
  }

  // Also update existing farmer@example.com to FARM_OWNER
  const farmer = await prisma.user.findUnique({
    where: { email: 'farmer@example.com' }
  });

  if (farmer) {
    await prisma.user.update({
      where: { email: 'farmer@example.com' },
      data: { role: 'FARM_OWNER' }
    });
    console.log('✅ farmer@example.com updated to FARM_OWNER');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });