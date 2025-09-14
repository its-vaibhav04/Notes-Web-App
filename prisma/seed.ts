import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const password = "password";

  // ACME TENANT
  await prisma.tenant.create({
    data: {
      name: "Acme",
      slug: "acme",
      users: {
        create: [
          { email: "admin@acme.test", password: password, role: "ADMIN" },
          { email: "user@acme.test", password: password, role: "MEMBER" },
        ],
      },
    },
  });

  // GLOBEX TENANT
  await prisma.tenant.create({
    data: {
      name: "Globex",
      slug: "globex",
      users: {
        create: [
          { email: "admin@globex.test", password: password, role: "ADMIN" },
          { email: "user@globex.test", password: password, role: "MEMBER" },
        ],
      },
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
