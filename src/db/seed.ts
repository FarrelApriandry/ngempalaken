import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { assignments, courseEnrollments, courses, users } from "./schema";
import { hashPassword } from "@/src/lib/password";

async function upsertUser(values: {
  npmNip: string;
  fullName: string;
  email: string;
  role: "student" | "assistant" | "admin";
  password: string;
}) {
  const existing = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, values.email.toLowerCase()),
  });
  const passwordHash = hashPassword(values.password);
  if (existing) {
    await db
      .update(users)
      .set({
        npmNip: values.npmNip,
        fullName: values.fullName,
        role: values.role,
        passwordHash,
      })
      .where(eq(users.id, existing.id));
    return existing;
  }
  const rows = await db
    .insert(users)
    .values({
      npmNip: values.npmNip,
      fullName: values.fullName,
      email: values.email.toLowerCase(),
      role: values.role,
      passwordHash,
    })
    .returning();
  return rows[0];
}

async function main() {
  console.log("[seed] upserting demo users…");
  const admin = await upsertUser({
    npmNip: "198001010001",
    fullName: "Koordinator Lab",
    email: "admin@laprakhub.local",
    role: "admin",
    password: "admin123",
  });
  const assistant = await upsertUser({
    npmNip: "ASLAB001",
    fullName: "Asisten Lab 1",
    email: "assistant@laprakhub.local",
    role: "assistant",
    password: "aslab123",
  });
  const studentsData = [
    { npmNip: "2301010001", fullName: "Ayu Pratama", email: "student@laprakhub.local" },
    { npmNip: "2301010002", fullName: "Budi Santoso", email: "budi@laprakhub.local" },
    { npmNip: "2301010003", fullName: "Citra Lestari", email: "citra@laprakhub.local" },
    { npmNip: "2301010004", fullName: "Dimas Nugroho", email: "dimas@laprakhub.local" },
    { npmNip: "2301010005", fullName: "Eka Putri", email: "eka@laprakhub.local" },
  ];
  const studentRows = [];
  for (const s of studentsData) {
    studentRows.push(
      await upsertUser({ ...s, role: "student", password: "student123" })
    );
  }
  console.log(`[seed] users ok (admin=${admin.email}, assistant=${assistant.email}, students=${studentRows.length})`);

  console.log("[seed] upserting course + assignments M1..M14…");
  const existingCourse = await db.query.courses.findFirst({
    where: (c, { eq }) => eq(c.code, "PRAK-IF101"),
  });
  let courseId: string;
  if (existingCourse) {
    courseId = existingCourse.id;
  } else {
    const rows = await db
      .insert(courses)
      .values({
        code: "PRAK-IF101",
        name: "Praktikum Pemrograman Web",
        semester: "Ganjil 2026/2027",
      })
      .returning();
    courseId = rows[0].id;
  }

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  for (let m = 1; m <= 14; m++) {
    const existing = await db.query.assignments.findFirst({
      where: (a, { and, eq }) =>
        and(eq(a.courseId, courseId), eq(a.moduleNumber, m)),
    });
    const deadline = new Date(now + (m - 7) * 7 * dayMs);
    const isActive = m <= 8;
    if (existing) {
      await db
        .update(assignments)
        .set({
          title: `Pertemuan ${m} - Modul M${m}`,
          deadline,
          isActive,
        })
        .where(eq(assignments.id, existing.id));
    } else {
      await db.insert(assignments).values({
        courseId,
        title: `Pertemuan ${m} - Modul M${m}`,
        moduleNumber: m,
        deadline,
        isActive,
      });
    }
  }

  console.log("[seed] enrolling students…");
  for (const s of studentRows) {
    const enrolled = await db.query.courseEnrollments.findFirst({
      where: (e, { and, eq }) =>
        and(eq(e.courseId, courseId), eq(e.studentId, s.id)),
    });
    if (!enrolled) {
      await db.insert(courseEnrollments).values({
        courseId,
        studentId: s.id,
      });
    }
  }

  console.log("[seed] done.");
  console.log("  login student:   student@laprakhub.local / student123");
  console.log("  login assistant: assistant@laprakhub.local / aslab123");
  console.log("  login admin:     admin@laprakhub.local / admin123");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[seed] failed:", err);
    process.exit(1);
  });
