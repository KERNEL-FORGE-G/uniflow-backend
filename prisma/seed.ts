import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const faculty = await prisma.faculty.create({
    data: { name: "Faculté des Sciences" },
  });

  const department = await prisma.department.create({
    data: {
      name: "Département d'Informatique",
      facultyId: faculty.id,
    },
  });

  const program = await prisma.program.create({
    data: {
      name: "Licence Informatique",
      departmentId: department.id,
    },
  });

  const level = await prisma.level.create({
    data: {
      name: "Licence 1",
      programId: program.id,
    },
  });

  const semester = await prisma.semester.create({
    data: {
      name: "Semestre 1 - 2026/2027",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2027-01-31"),
      isActive: true,
    },
  });

const level2 = await prisma.level.create({
    data: {
      name: "Licence 2",
      programId: program.id,
    },
  });
  console.log("Level 2 ID:", level2.id);

  console.log("✅ Données de test créées :");
  console.log("Faculty ID:", faculty.id);
  console.log("Department ID:", department.id);
  console.log("Program ID:", program.id);
  console.log("Level ID:", level.id);
  console.log("Semester ID:", semester.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });