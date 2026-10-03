import { boolean, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["student", "assistant", "admin"]);
export const githubRepoStatusEnum = pgEnum("github_repo_status", ["public", "private", "not_found"]);
export type UserRole = (typeof roleEnum.enumValues)[number];
export type GithubRepoStatus = (typeof githubRepoStatusEnum.enumValues)[number];

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  npmNip: varchar("npm_nip", { length: 20 }).notNull().unique(),
  fullName: varchar("full_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  passwordHash: text("password_hash"),
  role: roleEnum("role").notNull().default("student"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  semester: varchar("semester", { length: 20 }).notNull().default("Ganjil"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export type Course = typeof courses.$inferSelect;

export const courseEnrollments = pgTable("course_enrollments", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  enrolledAt: timestamp("enrolled_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("course_enrollments_unique").on(t.courseId, t.studentId)]);

export const assignments = pgTable("assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").references(() => courses.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 100 }).notNull(),
  moduleNumber: integer("module_number").notNull(),
  deadline: timestamp("deadline", { withTimezone: true }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("assignments_course_module_unique").on(t.courseId, t.moduleNumber)]);
export type Assignment = typeof assignments.$inferSelect;
export type NewAssignment = typeof assignments.$inferInsert;

export const submissions = pgTable("submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignmentId: uuid("assignment_id").notNull().references(() => assignments.id, { onDelete: "cascade" }),
  mediumUrl: text("medium_url").notNull(),
  githubUrl: text("github_url").notNull(),
  githubRepoStatus: githubRepoStatusEnum("github_repo_status").notNull().default("not_found"),
  isLate: boolean("is_late").notNull().default(false),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("submissions_student_assignment_unique").on(t.studentId, t.assignmentId)]);
export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;

export const grades = pgTable("grades", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissionId: uuid("submission_id").notNull().unique().references(() => submissions.id, { onDelete: "cascade" }),
  score: integer("score"),
  feedback: text("feedback"),
  gradedBy: uuid("graded_by").references(() => users.id, { onDelete: "set null" }),
  gradedAt: timestamp("graded_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export type Grade = typeof grades.$inferSelect;

export const usersRelations = relations(users, ({ many }) => ({
  submissions: many(submissions), enrollments: many(courseEnrollments),
}));
export const coursesRelations = relations(courses, ({ many }) => ({
  assignments: many(assignments), enrollments: many(courseEnrollments),
}));
export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  course: one(courses, { fields: [assignments.courseId], references: [courses.id] }),
  submissions: many(submissions),
}));
export const submissionsRelations = relations(submissions, ({ one }) => ({
  student: one(users, { fields: [submissions.studentId], references: [users.id] }),
  assignment: one(assignments, { fields: [submissions.assignmentId], references: [assignments.id] }),
}));
export const gradesRelations = relations(grades, ({ one }) => ({
  submission: one(submissions, { fields: [grades.submissionId], references: [submissions.id] }),
}));
