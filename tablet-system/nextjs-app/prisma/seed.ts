import { PrismaClient } from '../lib/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' });

const prisma = new PrismaClient({ adapter });

async function main() {
  const hash = await bcrypt.hash('password123', 12);

  await prisma.user.upsert({
    where:  { email: 'operator@lux.com' },
    update: {},
    create: {
      email:    'operator@lux.com',
      name:     'Lux Operator',
      password: hash,
      role:     'OPERATOR',
    },
  });

  console.log('Seed complete — operator@lux.com / password123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
