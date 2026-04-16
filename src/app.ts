import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { checkDatabaseConnection, db } from "./db/index.js";
import { academicYears } from "./db/schema.js";
import { count } from "drizzle-orm";
import academicInstitutionRoutes from "./routes/academicInstitutions.routes.js";
import campusRoutes from "./routes/campuses.routes.js";
import academicYearTermsRoutes from "./routes/academicYearTerms.routes.js";
import schoolCalendarRoutes from "./routes/schoolCalendar.routes.js";
import collegesRoutes from "./routes/colleges.routes.js";
import academicStructureRoutes from "./routes/academicStructure.routes.js";
import scholarshipProvidersRoutes from "./routes/scholarshipProviders.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import employeesRoutes from "./routes/employees.routes.js";
import departmentsRoutes from "./routes/departments.routes.js";
import positionsRoutes from "./routes/positions.routes.js";
import employeeOptionItemsRoutes from "./routes/employeeOptionItems.routes.js";
import buildingsRoomsRoutes from "./routes/buildingsRooms.routes.js";
import nationalitiesRoutes from "./routes/nationalities.routes.js";
import religionsRoutes from "./routes/religions.routes.js";
import userRightsRoutes from "./routes/userRights.routes.js";
import programCurriculumsRoutes from "./routes/programCurriculums.routes.js";
import coursesMasterListRoutes from "./routes/coursesMasterList.routes.js";
import subjectLookupsRoutes from "./routes/subjectLookups.routes.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "School System API is running" });
});

app.get("/api/health", (req: Request, res: Response) => {
  res.json({ message: "Backend is connected" });
});

app.get("/api/health/full", async (req: Request, res: Response) => {
  const dbStatus = await checkDatabaseConnection();
  let academicYearCount = 0;
  
  if (dbStatus.connected) {
    try {
      const result = await db.select({ count: count() }).from(academicYears);
      academicYearCount = Number(result[0]?.count || 0);
    } catch (err) {
      console.error("Failed to fetch academic years:", err);
    }
  }
  
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      api: { status: "running" },
      database: { 
        status: dbStatus.connected ? "connected" : "disconnected",
        details: dbStatus.connected ? `PostgreSQL is reachable (${academicYearCount} academic years found)` : dbStatus.error,
        count: academicYearCount
      }
    }
  });
});

// Academic Institution Routes
app.use("/api", academicInstitutionRoutes);

// Campus Routes
app.use("/api", campusRoutes);

// Academic Year Terms Routes
app.use("/api", academicYearTermsRoutes);

// School Calendar Routes
app.use("/api", schoolCalendarRoutes);

// Colleges / Departments / Institutes
app.use("/api", collegesRoutes);

// Major groups, CHED disciplines, academic programs, program–discipline links
app.use("/api", academicStructureRoutes);

// Scholarship providers
app.use("/api", scholarshipProvidersRoutes);

// Cloudinary image upload (multipart)
app.use("/api", uploadRoutes);

// Employees / faculty (HR master file)
app.use("/api", employeesRoutes);

// Departments (HR / org structure)
app.use("/api", departmentsRoutes);

// Positions (HR)
app.use("/api", positionsRoutes);

// Employee faculty dropdown option items
app.use("/api", employeeOptionItemsRoutes);

// Buildings and rooms
app.use("/api", buildingsRoomsRoutes);

// Nationalities
app.use("/api", nationalitiesRoutes);

// Religions
app.use("/api", religionsRoutes);

// User rights
app.use("/api", userRightsRoutes);

// Program curriculums
app.use("/api", programCurriculumsRoutes);

// Courses master list
app.use("/api", coursesMasterListRoutes);

// Subject areas / modes (courses master list lookups)
app.use("/api", subjectLookupsRoutes);

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default app;
