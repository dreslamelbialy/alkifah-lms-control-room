import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const lessonsTable = pgTable("lms_lessons", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  course: text("course").notNull(),
  level: text("level"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const materialsTable = pgTable("lms_materials", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => lessonsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const assessmentsTable = pgTable("lms_assessments", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => lessonsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  difficulty: text("difficulty").notNull().default("Easy"),
  questionCount: integer("question_count").notNull().default(5),
  provider: text("provider").notNull(),
  questions: jsonb("questions").notNull().$type<unknown[]>(),
  opensAt: timestamp("opens_at", { withTimezone: true }).notNull(),
  closesAt: timestamp("closes_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const homeworkTable = pgTable("lms_homework", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => lessonsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  exerciseCount: integer("exercise_count").notNull(),
  provider: text("provider").notNull(),
  exercises: jsonb("exercises").notNull().$type<unknown[]>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const activityTable = pgTable("lms_activity", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  label: text("label").notNull(),
  detail: text("detail"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settingsTable = pgTable("lms_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLessonSchema = createInsertSchema(lessonsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMaterialSchema = createInsertSchema(materialsTable).omit({ id: true, createdAt: true });
export const insertAssessmentSchema = createInsertSchema(assessmentsTable).omit({ id: true, createdAt: true });
export const insertHomeworkSchema = createInsertSchema(homeworkTable).omit({ id: true, createdAt: true });
export const insertActivitySchema = createInsertSchema(activityTable).omit({ id: true, createdAt: true });
export const insertSettingSchema = createInsertSchema(settingsTable).omit({ id: true, updatedAt: true });

export type Lesson = typeof lessonsTable.$inferSelect;
export type Material = typeof materialsTable.$inferSelect;
export type Assessment = typeof assessmentsTable.$inferSelect;
export type Homework = typeof homeworkTable.$inferSelect;
export type Activity = typeof activityTable.$inferSelect;
export type Setting = typeof settingsTable.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type InsertHomework = z.infer<typeof insertHomeworkSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;