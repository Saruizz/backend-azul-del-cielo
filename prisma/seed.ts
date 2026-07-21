import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const superadminEmail = 'admin@azuldelcielo.com';
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: superadminEmail }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        email: superadminEmail,
        password: hashedPassword,
        name: 'Super Admin',
        role: 'SUPERADMIN'
      }
    });
    console.log('✅ Default SUPERADMIN created: admin@azuldelcielo.com / admin123');
  } else {
    console.log('ℹ️ SUPERADMIN already exists.');
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
