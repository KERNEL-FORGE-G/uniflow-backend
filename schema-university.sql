-- ==============================================================================
-- UNIFLOW - BACKEND 1 : INSTITUTIONNEL / UNIVERSITÉ (POSTGRESQL)
-- Version: 2.0 (Complet pour les universités affiliées)
-- Description: Ce script gère les comptes rattachés aux universités partenaires.
--              Toutes les données (emplois du temps, cours, notes, présences,
--              inscriptions) sont centralisées et synchronisées par l'établissement.
-- ==============================================================================

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO CURRENT_USER;
GRANT ALL ON SCHEMA public TO public;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. ENUMS (UNIVERSITÉ)
-- ------------------------------------------------------------------------------
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'DIRECTION', 'SECRETARIAT', 'ENSEIGNANT', 'DELEGUE', 'ETUDIANT');
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'GRADUATED', 'WITHDRAWN', 'DEFERRED');
CREATE TYPE "UEType" AS ENUM ('OBLIGATOIRE', 'OPTIONNELLE');
CREATE TYPE "EnrollmentStatus" AS ENUM ('PENDING', 'VALIDATED', 'REJECTED');
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'ALERT', 'ANNOUNCEMENT', 'GRADE', 'ATTENDANCE', 'ASSIGNMENT');
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'PUSH', 'SMS');
CREATE TYPE "ClassroomType" AS ENUM ('AMPHITHEATRE', 'SALLE_TD', 'LABORATOIRE', 'SALLE_INFORMATIQUE');
CREATE TYPE "ClassroomStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE');
CREATE TYPE "CourseType" AS ENUM ('CM', 'TD', 'TP', 'SEMINAIRE');
CREATE TYPE "DayOfWeek" AS ENUM ('LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI');
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');
CREATE TYPE "JustificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "EvaluationType" AS ENUM ('CC', 'EXAMEN', 'TP', 'RATTRAPAGE', 'PROJET');
CREATE TYPE "TranscriptDecision" AS ENUM ('ADMIS', 'AJOURNE', 'RATTRAPAGE', 'COMPENSATION');
CREATE TYPE "AssignmentStatus" AS ENUM ('SUBMITTED', 'GRADED', 'LATE', 'REJECTED');
CREATE TYPE "BorrowingStatus" AS ENUM ('PENDING', 'APPROVED', 'BORROWED', 'RETURNED', 'OVERDUE', 'REJECTED');
CREATE TYPE "SentinelleCategory" AS ENUM ('NOTE_CLAIM', 'FRAUD', 'INFRASTRUCTURE', 'ADMINISTRATIVE_ISSUE', 'DISCIPLINE', 'OTHER');
CREATE TYPE "SentinellePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "SentinelleStatus" AS ENUM ('SUBMITTED', 'IN_REVIEW', 'RESOLVED', 'REJECTED');
CREATE TYPE "ConferenceMode" AS ENUM ('LAN', 'INTERNET');
CREATE TYPE "ConferenceStatus" AS ENUM ('ACTIVE', 'ENDED');
CREATE TYPE "ConversationType" AS ENUM ('DIRECT', 'GROUP');

-- ------------------------------------------------------------------------------
-- 2. TABLES (UNIVERSITÉ)
-- ------------------------------------------------------------------------------

CREATE TABLE "users" (
    "id" TEXT NOT NULL DEFAULT ('usr_' || gen_random_uuid()),
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "refreshTokenHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'ETUDIANT',
    "phone" TEXT,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "accountType" TEXT NOT NULL DEFAULT 'UNIVERSITY',
    "universityCode" TEXT DEFAULT 'UY1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "faculties" (
    "id" TEXT NOT NULL DEFAULT ('fac_' || gen_random_uuid()),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "faculties_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "departments" (
    "id" TEXT NOT NULL DEFAULT ('dept_' || gen_random_uuid()),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "facultyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "programs" (
    "id" TEXT NOT NULL DEFAULT ('prog_' || gen_random_uuid()),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "levels" (
    "id" TEXT NOT NULL DEFAULT ('lvl_' || gen_random_uuid()),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "programId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "levels_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "specialties" (
    "id" TEXT NOT NULL DEFAULT ('spec_' || gen_random_uuid()),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "levelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "specialties_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "students" (
    "id" TEXT NOT NULL DEFAULT ('stu_' || gen_random_uuid()),
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "birthdate" DATE,
    "address" TEXT,
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "levelId" TEXT NOT NULL,
    "specialtyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "teachers" (
    "id" TEXT NOT NULL DEFAULT ('tch_' || gen_random_uuid()),
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "grade" TEXT DEFAULT 'Docteur',
    "specialization" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "semesters" (
    "id" TEXT NOT NULL DEFAULT ('sem_' || gen_random_uuid()),
    "name" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL DEFAULT '2025-2026',
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "semesters_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "teaching_units" (
    "id" TEXT NOT NULL DEFAULT ('ue_' || gen_random_uuid()),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 3,
    "hoursCM" INTEGER NOT NULL DEFAULT 0,
    "hoursTD" INTEGER NOT NULL DEFAULT 0,
    "hoursTP" INTEGER NOT NULL DEFAULT 0,
    "type" "UEType" NOT NULL DEFAULT 'OBLIGATOIRE',
    "levelId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "teaching_units_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ue_specialties" (
    "teachingUnitId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,
    CONSTRAINT "ue_specialties_pkey" PRIMARY KEY ("teachingUnitId", "specialtyId")
);

CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL DEFAULT ('enr_' || gen_random_uuid()),
    "studentId" TEXT NOT NULL,
    "teachingUnitId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'VALIDATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "teacher_ue_assignments" (
    "id" TEXT NOT NULL DEFAULT ('tua_' || gen_random_uuid()),
    "teacherId" TEXT NOT NULL,
    "teachingUnitId" TEXT NOT NULL,
    "role" TEXT DEFAULT 'TITULAIRE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "teacher_ue_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "classrooms" (
    "id" TEXT NOT NULL DEFAULT ('cls_' || gen_random_uuid()),
    "name" TEXT NOT NULL,
    "building" TEXT,
    "capacity" INTEGER NOT NULL,
    "type" "ClassroomType" NOT NULL DEFAULT 'SALLE_TD',
    "status" "ClassroomStatus" NOT NULL DEFAULT 'AVAILABLE',
    "hasProjector" BOOLEAN NOT NULL DEFAULT true,
    "hasAC" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "classrooms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "courses" (
    "id" TEXT NOT NULL DEFAULT ('crs_' || gen_random_uuid()),
    "teachingUnitId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "type" "CourseType" NOT NULL DEFAULT 'CM',
    "groupLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "schedules" (
    "id" TEXT NOT NULL DEFAULT ('sch_' || gen_random_uuid()),
    "courseId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "attendance_sessions" (
    "id" TEXT NOT NULL DEFAULT ('ats_' || gen_random_uuid()),
    "courseId" TEXT NOT NULL,
    "teacherId" TEXT,
    "date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "qrToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "attendance_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL DEFAULT ('atr_' || gen_random_uuid()),
    "sessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'ABSENT',
    "markedAt" TIMESTAMP(3),
    "scanMethod" TEXT DEFAULT 'QR_CODE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "evaluations" (
    "id" TEXT NOT NULL DEFAULT ('eval_' || gen_random_uuid()),
    "teachingUnitId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "EvaluationType" NOT NULL DEFAULT 'CC',
    "weight" NUMERIC(3, 2) NOT NULL DEFAULT 0.30,
    "maxScore" NUMERIC(4, 2) NOT NULL DEFAULT 20.00,
    "evaluationDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "grades" (
    "id" TEXT NOT NULL DEFAULT ('grd_' || gen_random_uuid()),
    "evaluationId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "score" NUMERIC(4, 2),
    "isAbsent" BOOLEAN NOT NULL DEFAULT false,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sentinelle_reports" (
    "id" TEXT NOT NULL DEFAULT ('sen_' || gen_random_uuid()),
    "reporterId" TEXT NOT NULL,
    "category" "SentinelleCategory" NOT NULL DEFAULT 'NOTE_CLAIM',
    "priority" "SentinellePriority" NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "SentinelleStatus" NOT NULL DEFAULT 'SUBMITTED',
    "assignedToId" TEXT,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sentinelle_reports_pkey" PRIMARY KEY ("id")
);

-- ------------------------------------------------------------------------------
-- 3. INDEXES & FOREIGN KEYS
-- ------------------------------------------------------------------------------
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "students_userId_key" ON "students"("userId");
CREATE UNIQUE INDEX "students_matricule_key" ON "students"("matricule");
CREATE UNIQUE INDEX "teachers_userId_key" ON "teachers"("userId");
CREATE UNIQUE INDEX "faculties_code_key" ON "faculties"("code");
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");
CREATE UNIQUE INDEX "programs_code_key" ON "programs"("code");
CREATE UNIQUE INDEX "levels_code_key" ON "levels"("code");
CREATE UNIQUE INDEX "teaching_units_code_key" ON "teaching_units"("code");

ALTER TABLE "departments" ADD CONSTRAINT "departments_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "programs" ADD CONSTRAINT "programs_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "levels" ADD CONSTRAINT "levels_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "students" ADD CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "students" ADD CONSTRAINT "students_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "teaching_units" ADD CONSTRAINT "teaching_units_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "teaching_units" ADD CONSTRAINT "teaching_units_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "courses" ADD CONSTRAINT "courses_teachingUnitId_fkey" FOREIGN KEY ("teachingUnitId") REFERENCES "teaching_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "attendance_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_teachingUnitId_fkey" FOREIGN KEY ("teachingUnitId") REFERENCES "teaching_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "grades" ADD CONSTRAINT "grades_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ------------------------------------------------------------------------------
-- 4. SEED DATA (UNIVERSITÉ)
-- ------------------------------------------------------------------------------
INSERT INTO "faculties" ("id", "code", "name", "nameEn") VALUES ('fac_1', 'FS', 'Faculté des Sciences', 'Faculty of Science');
INSERT INTO "departments" ("id", "code", "name", "facultyId") VALUES ('dept_1', 'INFO', 'Département d''Informatique', 'fac_1');
INSERT INTO "programs" ("id", "code", "name", "departmentId") VALUES ('prog_1', 'LIC_INFO', 'Licence en Informatique', 'dept_1');
INSERT INTO "levels" ("id", "code", "name", "programId") VALUES ('lvl_l2', 'L2_INFO', 'Licence 2 Informatique', 'prog_1');
INSERT INTO "semesters" ("id", "name", "academicYear", "startDate", "endDate", "isActive") VALUES ('sem_2', 'Semestre 2', '2025-2026', '2026-02-15', '2026-06-30', true);

INSERT INTO "users" ("id", "email", "passwordHash", "role", "accountType", "universityCode") VALUES
('usr_superadmin', 'admin@uniflow.edu', '$2a$10$wK1m...encrypted', 'SUPER_ADMIN', 'UNIVERSITY', 'UY1'),
('usr_teacher_martin', 'dr.martin@uniflow.edu', '$2a$10$wK1m...encrypted', 'ENSEIGNANT', 'UNIVERSITY', 'UY1'),
('usr_student_emma', 'emma.martin@uniflow.edu', '$2a$10$wK1m...encrypted', 'ETUDIANT', 'UNIVERSITY', 'UY1');

INSERT INTO "teachers" ("id", "userId", "firstName", "lastName", "grade") VALUES ('tch_martin', 'usr_teacher_martin', 'Martin', 'Lefèvre', 'Pr.');
INSERT INTO "students" ("id", "userId", "firstName", "lastName", "matricule", "levelId") VALUES ('st_emma', 'usr_student_emma', 'Emma', 'Martin', 'ETU-2022-0847', 'lvl_l2');
