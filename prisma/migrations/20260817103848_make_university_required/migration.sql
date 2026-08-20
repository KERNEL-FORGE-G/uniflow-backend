/*
  Warnings:

  - A unique constraint covering the columns `[name,universityId]` on the table `classrooms` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email,universityId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Made the column `universityId` on table `classrooms` required. This step will fail if there are existing NULL values in that column.
  - Made the column `universityId` on table `faculties` required. This step will fail if there are existing NULL values in that column.
  - Made the column `universityId` on table `semesters` required. This step will fail if there are existing NULL values in that column.
  - Made the column `universityId` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "classrooms" DROP CONSTRAINT "classrooms_universityId_fkey";

-- DropForeignKey
ALTER TABLE "faculties" DROP CONSTRAINT "faculties_universityId_fkey";

-- DropForeignKey
ALTER TABLE "semesters" DROP CONSTRAINT "semesters_universityId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_universityId_fkey";

-- AlterTable
ALTER TABLE "classrooms" ALTER COLUMN "universityId" SET NOT NULL;

-- AlterTable
ALTER TABLE "faculties" ALTER COLUMN "universityId" SET NOT NULL;

-- AlterTable
ALTER TABLE "semesters" ALTER COLUMN "universityId" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "universityId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "classrooms_name_universityId_key" ON "classrooms"("name", "universityId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_universityId_key" ON "users"("email", "universityId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculties" ADD CONSTRAINT "faculties_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semesters" ADD CONSTRAINT "semesters_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
