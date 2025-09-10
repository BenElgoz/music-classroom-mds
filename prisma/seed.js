import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const users = [
  { email: 'Benjamin@example.com', firstname: 'Benjamin', lastname: 'Bonnevial', promotion: 'BUT2' },
  { email: 'Raphael@example.com',   firstname: 'Raphaël',   lastname: 'Dubost', promotion: 'BUT2' },
];

async function main() {
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u
    });
  }
  console.log(`Seed OK: ${users.length} users`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
