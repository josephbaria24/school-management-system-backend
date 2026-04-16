import { pgTable, serial, varchar, timestamp, boolean } from "drizzle-orm/pg-core";

export const academicYears = pgTable("academic_years", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(), // e.g. "2024-2025"
  status: varchar("status", { length: 20 }).default("inactive"), // "active", "inactive"
  is_current: boolean("is_current").default(false),
  startDate: timestamp("start_date", { mode: "date" }),
  endDate: timestamp("end_date", { mode: "date" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Since we also saw students, teachers etc. in the frontend, 
// let's define at least placeholders for them.
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  grade: varchar("grade", { length: 20 }),
  email: varchar("email", { length: 100 }).unique(),
  status: varchar("status", { length: 20 }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});
