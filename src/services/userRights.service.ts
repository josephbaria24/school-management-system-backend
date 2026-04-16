import pool from "../db.js";

type GroupPayload = {
  name: string;
  description: string | null;
  wallpaper: string | null;
};

const displayNameExpr = `
  TRIM(
    CONCAT(
      COALESCE(e.last_name, ''),
      CASE WHEN COALESCE(e.last_name, '') <> '' THEN ', ' ELSE '' END,
      COALESCE(e.first_name, ''),
      CASE WHEN COALESCE(e.middle_name, '') <> '' THEN ' ' || e.middle_name ELSE '' END,
      CASE WHEN COALESCE(e.suffix, '') <> '' THEN ' ' || e.suffix ELSE '' END
    )
  )
`;

const usernameFromEmployee = (employee: Record<string, unknown>) => {
  const preferred =
    String(employee.first_name ?? "").trim() ||
    String(employee.last_name ?? "").trim() ||
    String(employee.employee_id ?? "").trim();
  return preferred.toLowerCase().replace(/\s+/g, "");
};

const defaultGroupSeeds = [
  "Accounting",
  "Administrators",
  "Admissions",
  "Adviser",
  "Assessment",
  "Cashier",
  "Cashier Supervisor",
  "Chairman",
  "College",
  "College Dean",
  "Custom",
  "Encoders",
  "encoding and advising",
  "Faculty",
  "Printing Area",
  "Registrar",
];

const privilegeModulesFromPdf = new Set([
  "Admission",
  "Registrar",
  "Colleges",
  "Accounting",
  "Faculty Center",
  "Cashier",
  "Registration",
  "Student Center",
  "Window",
  "Setup Manager",
  "Utilities",
  "Help",
  "Log-Off",
]);

const privilegeCatalogPdfRaw = `
Admission
Applications
Applicant's Profile...
Admission Test Results (Tab)
Submitted Requirements (Tab)
Interview Assessments (Tab)
Admit New Student
Deny an Applicant
Cancel Admit/Deny of Applicant
List of Applications...
College Entrance Test Result Ranking
Admission Test Scores
Individual Result
Batch Result
Testing Schedules
List of Examinees for Testing
List of Examinees for Medical
Medical Schedules
Admission Statistics...
Admission Test Results
Admission Reports
Configuration of Admission Limits...
Registrar
Student's Profile
Modify Student's Personal/Academic Profile
Upload Student Picture...
Clear Image of Student Picture
Record Attachments (Tab)
Medical Records (Tab)
Counseling Records (Tab)
Others (Tab)
Students Master List
Upload Students Picture
Courses Master List
Filter: Grades School Only
Filter: High School Only
Filter: College Only
Filter: Masteral Only
Filter: Selected Curriculum
Course Equivalent...
Subject Formations Maintenance (GS/HS)
Grading System
Scholastic Deliquency
Add/Drop/Change of Courses / Withdrawal
Add Drop Change Configuration...
Withdrawal of Registration...
Inventory of Grade Sheets
Inventory of Unposted Grades
Correction of Grades
Students with Incomplete Grade
Recalculate Summary of Grades
Student Summary of Grades...
Grade Encoding
Update Personal Information...
Copy of Grades
Unposting of Manual Input Grade
Academic Program Evaluation
Tag Student as Candidate/Graduate...
Equivalent / Course Taken Not in Curriculum...
Deficiency Courses...
Waive Prerequisite Subjects...
Credit Selected Course...
Grades From Other School...
Transcript of Records
Transcript Setup
Grades from Other School...
Report of Grades
Grade Point Average Ranking...
Worksheet for Consolidated Grades
Tag Graduating Students
Graduate/Candidates for Graduation
Certification
Certifications for Grade School
Certifications for High School
Certifications for College
Certifications for Masteral
Diploma Easy...
CHED Reports
List of CHED Reports for College
List of CHED Reports for Masteral
List of Reports...
List of Grade School Reports
List of High School Reports
List of College Reports
List of Masteral Reports
Colleges
Program Curriculums
Program Curriculum - Bulk Tagging
Class Sections...
List All
Allow access to all Class Sections
Allows User to Adjust Class Size/Limit
Allows Other Programs to Enroll this Course
Allows Student to Enroll this Course
Allow User to dissolve course.
Create Block Section
Create Free Section
Rename Class Section
Delete Class Section
Assign Class Section Adviser
Assign Default Classroom to Section
Add Subject to Class Section
Replace Subject
Print List of Class Schedules (All)
Print List of Class Schedules (Program)
Print List of Registered Students
Print Official List of Enrolled Students
Print List of Courses Offered
Class Sectioning (GS/HS)
Class Schedules/Room/Faculty
Allows User to Overide Conflict of Day/Time
Allow User to Post/Unpost schedule by bulk/list
Allow User to Post/Unpost individual subject schedule
Team Teaching
Class Sections (Split/Merge)
Class Schedules (Split/Merge)
Forecasting
List of Reports...
Accounting
Chart of Accounts
Currencies/Exchange Rate
Table of Fees/Student Rates
Subjects with Special Fee
Save As...
Subjects with Air-Conditioned
Scholarship Grant Templates
Fees Template - Enrollment Bulk Tagging
Assessment/Billing...
List of Other Payors
Promissory Notes...
Debit / Credit Memo...
Debit Memo - Bulk Entry
Student with Bad Accounts
Students allowed to Register
Student Ledger...
Student Account Report
Student Clearance...
Examination Permit...
Registration Assessment Configuration
Recalculate Balances
Scho. Provider Lock Tagging
List of Scholars/Grantees...
List of Reports...
Faculty Center
Class Schedule
Allows Other User to View the Class Schedules...
Grade Encoding...
Allows Other User to Post the Grade Sheet...
Allowed to Unpost the Grade Sheet...
Cashier
Check Monitoring
Payment Setup...
Cashier Settings...
Cashiering Module
List of Official Receipts
Official Receipt Viewer
Issuance of OR Series
Cash Count Sheet
List of Reports...
Registration
Student Advising
Equivalent / Course Taken Not in Curriculum
Waive Prerequisite Subjects
Credit Selected Course
Enrollment Proper (GS/HS)
Enrollment Proper
Registration Configuration
Allows User to Configure Check Pre-Requisites
Allows User to Configure Allow Incomplete Grade
Allows User to Configure Check Conflict of Schedules
Allows User to Configure Check Allow Overloading
Allows User to Configure Check Over-ride Expiration of Registration
Allows User to View All Block Sections
Allows User to Configure Cross Enrollment
Allows User to Configure Auto-Maximum Units Allowed
Allows User to Configure Check Scholastic Delinquencies
Allows User to Configure Check Credit Reservation
Allows User to Configure Shows Student Grades
Print Certificate of Registration
Registration Validation
Purge Expired Registrations
Purge Invalidated Registrations
Setup - One Subject to Enroll
Correction of Student Registration
Upon Student Registration
Allow User to Change Student Year Level
Allow User to Change Maximum Load
Allow User to Change Fees Template
Student Center
Student Accountabilities
Students Club/Organization
Merit/Demerit for High School
Window
Window
Setup Manager
Academic Institution
Academic Year and Terms
Unlock Semester
School Calendar
Colleges/Departments/Institutes
Academic Programs
Major Study
Scholarship Providers
Employees And Faculty Info.
Faculty Information
Departments
Buildings and Rooms
Nationalities
Religions
Other Schools...
User Rights...
System Lockdown
Utilities
Query Analyzer...
Report/Form Designer
Transactions Log...
Change Password...
System Lock...
Show all users...
Help
Help Contents...
Version History...
License Information...
Upload Latest Updates...
Check for Updates...
Contact Us...
About PRISMS...
Log-Off
Log-Off
`;

function hashText(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36).toUpperCase();
}

function normalizePrivilegeLine(line: string) {
  return line
    .replace(/\t+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+P(?:\s+P)+$/g, "")
    .trim();
}

const privilegeCatalog = (() => {
  const rows: Array<{ module: string; description: string }> = [];
  const seen = new Set<string>();
  let currentModule: string | null = null;
  for (const raw of privilegeCatalogPdfRaw.split("\n")) {
    const line = normalizePrivilegeLine(raw);
    if (!line) continue;
    if (privilegeModulesFromPdf.has(line)) {
      currentModule = line;
      continue;
    }
    if (!currentModule) continue;
    const key = `${currentModule}|||${line}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ module: currentModule, description: line });
  }
  return rows;
})();

const fullAccessModulesByGroup: Record<string, string[]> = {
  administrators: [
    "Admission",
    "Registrar",
    "Colleges",
    "Accounting",
    "Faculty Center",
    "Cashier",
    "Registration",
    "Student Center",
    "Setup Manager",
    "Utilities",
    "Help",
    "Log-Off",
  ],
  admissions: ["Admission"],
  adviser: ["Registration", "Student Center"],
  assessment: ["Accounting"],
  cashier: ["Cashier", "Accounting"],
  "cashier supervisor": ["Cashier", "Accounting"],
  chairman: ["Colleges", "Faculty Center"],
  college: ["Colleges"],
  "college dean": ["Colleges", "Faculty Center"],
  encoders: ["Registrar", "Faculty Center"],
  "encoding and advising": ["Registrar", "Registration"],
  faculty: ["Faculty Center"],
  "printing area": ["Registrar", "Colleges", "Accounting"],
  registrar: ["Registrar"],
  accounting: ["Accounting"],
};

const buildPrivilegeSeedForGroup = (groupName: string) => {
  const groupKey = groupName.trim().toLowerCase();
  const fullModules = new Set(fullAccessModulesByGroup[groupKey] ?? []);
  return privilegeCatalog.map((row, idx) => {
    const fullAccess = fullModules.has(row.module);
    const baselineRead = row.module === "Log-Off" || row.module === "Help" || row.module === "Window";
    return {
      module: row.module,
      description: row.description,
      sort_order: idx + 1,
      ref_id: `PRV-${hashText(`${row.module}|${row.description}`).padStart(8, "0").slice(0, 8)}`,
      read: fullAccess || baselineRead,
      write: fullAccess,
      delete: fullAccess,
      print: fullAccess,
      export: fullAccess,
    };
  });
};

const makePrivilegeKey = (moduleName: string, description: string) =>
  `${moduleName.trim().toLowerCase()}|||${description.trim().toLowerCase()}`;

const syncPrivilegesForGroup = async (groupId: number, groupName: string) => {
  const desired = buildPrivilegeSeedForGroup(groupName);
  const desiredByKey = new Map(
    desired.map((row) => [makePrivilegeKey(row.module, row.description), row] as const)
  );

  const existingResult = await pool.query(
    `
    SELECT id, module, description
    FROM user_rights_privileges
    WHERE group_id = $1
    `,
    [groupId]
  );

  for (const existing of existingResult.rows) {
    const existingKey = makePrivilegeKey(String(existing.module), String(existing.description));
    if (!desiredByKey.has(existingKey)) {
      await pool.query(`DELETE FROM user_rights_privileges WHERE id = $1`, [existing.id]);
      continue;
    }
    const target = desiredByKey.get(existingKey)!;
    await pool.query(
      `
      UPDATE user_rights_privileges
      SET module = $1, description = $2, ref_id = $3, sort_order = $4
      WHERE id = $5
      `,
      [target.module, target.description, target.ref_id, target.sort_order, existing.id]
    );
    desiredByKey.delete(existingKey);
  }

  for (const row of desiredByKey.values()) {
    await pool.query(
      `
      INSERT INTO user_rights_privileges (
        group_id, module, description, ref_id, sort_order, can_read, can_write, can_delete, can_print, can_export
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (group_id, ref_id) DO NOTHING
      `,
      [
        groupId,
        row.module,
        row.description,
        row.ref_id,
        row.sort_order,
        row.read,
        row.write,
        row.delete,
        row.print,
        row.export,
      ]
    );
  }
};

export const ensureUserRightsTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_rights_groups (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL UNIQUE,
      description TEXT,
      wallpaper TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_rights_users (
      id SERIAL PRIMARY KEY,
      employee_id VARCHAR(50) NOT NULL UNIQUE REFERENCES employees(employee_id) ON DELETE CASCADE,
      username VARCHAR(120) NOT NULL,
      group_id INTEGER NOT NULL REFERENCES user_rights_groups(id) ON DELETE RESTRICT,
      level VARCHAR(10),
      date_created TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      logged_version VARCHAR(50),
      logged_date TIMESTAMPTZ,
      logged_computer_name VARCHAR(120),
      logged_ip_address VARCHAR(64),
      logged_mac_address VARCHAR(64),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_rights_privileges (
      id SERIAL PRIMARY KEY,
      group_id INTEGER NOT NULL REFERENCES user_rights_groups(id) ON DELETE CASCADE,
      module VARCHAR(120) NOT NULL,
      description TEXT NOT NULL,
      ref_id VARCHAR(20) NOT NULL,
      sort_order INTEGER,
      can_read BOOLEAN NOT NULL DEFAULT FALSE,
      can_write BOOLEAN NOT NULL DEFAULT FALSE,
      can_delete BOOLEAN NOT NULL DEFAULT FALSE,
      can_print BOOLEAN NOT NULL DEFAULT FALSE,
      can_export BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (group_id, ref_id)
    )
  `);
  await pool.query(`
    ALTER TABLE user_rights_privileges
    ADD COLUMN IF NOT EXISTS sort_order INTEGER
  `);

  for (const groupName of defaultGroupSeeds) {
    await pool.query(
      `
      INSERT INTO user_rights_groups (name, description, wallpaper)
      VALUES ($1, '', '')
      ON CONFLICT (name) DO NOTHING
      `,
      [groupName]
    );
  }

  // Cleanup legacy auto-seeded groups from earlier revisions and reassign users to Custom.
  const legacyAutoSeedGroups = [
    "Admission",
    "Colleges",
    "Faculty Center",
    "Registration",
    "Student Center",
    "Setup Manager",
    "Utilities",
    "Help",
  ];
  const customGroup = await pool.query(`SELECT id FROM user_rights_groups WHERE name = 'Custom'`);
  const customGroupId = customGroup.rows[0]?.id;
  if (customGroupId) {
    for (const legacyName of legacyAutoSeedGroups) {
      const legacy = await pool.query(`SELECT id FROM user_rights_groups WHERE name = $1`, [legacyName]);
      const legacyId = legacy.rows[0]?.id;
      if (!legacyId) continue;
      await pool.query(
        `
        UPDATE user_rights_users
        SET group_id = $1, updated_at = CURRENT_TIMESTAMP
        WHERE group_id = $2
        `,
        [customGroupId, legacyId]
      );
      await pool.query(`DELETE FROM user_rights_privileges WHERE group_id = $1`, [legacyId]);
      await pool.query(`DELETE FROM user_rights_groups WHERE id = $1`, [legacyId]);
    }
  }

  const groupRows = await pool.query(`SELECT id, name FROM user_rights_groups`);
  for (const group of groupRows.rows) {
    await syncPrivilegesForGroup(Number(group.id), String(group.name));
  }
};

export const getGroups = async () => {
  await ensureUserRightsTables();
  const r = await pool.query(`
    SELECT id, name, COALESCE(description, '') AS description, COALESCE(wallpaper, '') AS wallpaper
    FROM user_rights_groups
    ORDER BY name ASC
  `);
  return r.rows;
};

export const createGroup = async (payload: GroupPayload) => {
  await ensureUserRightsTables();
  const r = await pool.query(
    `
    INSERT INTO user_rights_groups (name, description, wallpaper)
    VALUES ($1, $2, $3)
    RETURNING id, name, COALESCE(description, '') AS description, COALESCE(wallpaper, '') AS wallpaper
    `,
    [payload.name.trim(), payload.description, payload.wallpaper]
  );
  const created = r.rows[0];
  if (created?.id) {
    await syncPrivilegesForGroup(Number(created.id), String(created.name));
  }
  return created;
};

export const updateGroup = async (id: number, payload: GroupPayload) => {
  await ensureUserRightsTables();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query(`SELECT id, name FROM user_rights_groups WHERE id = $1`, [id]);
    if (!existing.rows[0]) {
      await client.query("ROLLBACK");
      return null;
    }
    const oldName = String(existing.rows[0].name);
    const nextName = payload.name.trim();

    const updated = await client.query(
      `
      UPDATE user_rights_groups
      SET name = $1, description = $2, wallpaper = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, name, COALESCE(description, '') AS description, COALESCE(wallpaper, '') AS wallpaper
      `,
      [nextName, payload.description, payload.wallpaper, id]
    );

    if (oldName !== nextName) {
      await client.query(
        `
        UPDATE user_rights_users
        SET updated_at = CURRENT_TIMESTAMP
        WHERE group_id = $1
        `,
        [id]
      );
    }

    await client.query("COMMIT");
    return updated.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const deleteGroup = async (id: number) => {
  await ensureUserRightsTables();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query(`SELECT id, name FROM user_rights_groups WHERE id = $1`, [id]);
    const group = existing.rows[0];
    if (!group) {
      await client.query("ROLLBACK");
      return { deleted: false, code: "NOT_FOUND" as const };
    }
    if (String(group.name).toLowerCase() === "custom") {
      await client.query("ROLLBACK");
      return { deleted: false, code: "DEFAULT_GROUP" as const };
    }

    const fallback = await client.query(`SELECT id FROM user_rights_groups WHERE name = 'Custom'`);
    const fallbackId = fallback.rows[0]?.id;
    if (!fallbackId) {
      await client.query("ROLLBACK");
      return { deleted: false, code: "DEFAULT_GROUP_MISSING" as const };
    }

    await client.query(
      `
      UPDATE user_rights_users
      SET group_id = $1, updated_at = CURRENT_TIMESTAMP
      WHERE group_id = $2
      `,
      [fallbackId, id]
    );
    await client.query(`DELETE FROM user_rights_privileges WHERE group_id = $1`, [id]);
    await client.query(`DELETE FROM user_rights_groups WHERE id = $1`, [id]);
    await client.query("COMMIT");
    return { deleted: true as const };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const getUsers = async () => {
  await ensureUserRightsTables();
  const r = await pool.query(`
    SELECT
      uru.employee_id AS id,
      ${displayNameExpr} AS employee_name,
      uru.username,
      g.name AS user_group,
      COALESCE(p.position_title, e.position_label, '') AS position_title,
      COALESCE(d.dept_name, e.department_label, '') AS department,
      COALESCE(uru.level, '') AS level,
      COALESCE(TO_CHAR(uru.date_created, 'MM/DD/YYYY HH12:MI:SS AM'), '') AS date_created,
      COALESCE(uru.logged_version, '') AS logged_version,
      COALESCE(TO_CHAR(uru.logged_date, 'MM/DD/YYYY HH12:MI:SS AM'), '') AS logged_date,
      COALESCE(uru.logged_computer_name, '') AS computer_name,
      COALESCE(uru.logged_ip_address, '') AS ip_address,
      COALESCE(uru.logged_mac_address, '') AS mac_address
    FROM user_rights_users uru
    JOIN user_rights_groups g ON g.id = uru.group_id
    JOIN employees e ON e.employee_id = uru.employee_id
    LEFT JOIN positions p ON e.position_id = p.id
    LEFT JOIN departments d ON e.department_id = d.id
    ORDER BY employee_name ASC
  `);
  return r.rows;
};

export const createUser = async (employeeId: string) => {
  await ensureUserRightsTables();
  const employee = await pool.query(
    `
    SELECT employee_id, first_name, last_name
    FROM employees
    WHERE employee_id = $1
    `,
    [employeeId.trim()]
  );
  if (!employee.rows[0]) {
    return { row: null, code: "EMPLOYEE_NOT_FOUND" as const };
  }
  const defaultGroup = await pool.query(`SELECT id FROM user_rights_groups WHERE name = 'Custom'`);
  const groupId = defaultGroup.rows[0]?.id;
  if (!groupId) {
    return { row: null, code: "DEFAULT_GROUP_MISSING" as const };
  }
  const username = usernameFromEmployee(employee.rows[0]);

  try {
    await pool.query(
      `
      INSERT INTO user_rights_users (employee_id, username, group_id, level)
      VALUES ($1, $2, $3, '')
      `,
      [employeeId.trim(), username, groupId]
    );
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "23505") {
      return { row: null, code: "ALREADY_EXISTS" as const };
    }
    throw err;
  }

  const rows = await getUsers();
  const created = rows.find((r) => String(r.id) === employeeId.trim()) ?? null;
  return { row: created, code: null };
};

export const updateUserGroup = async (employeeId: string, groupId: number) => {
  await ensureUserRightsTables();
  const r = await pool.query(
    `
    UPDATE user_rights_users
    SET group_id = $1, updated_at = CURRENT_TIMESTAMP
    WHERE employee_id = $2
    RETURNING employee_id
    `,
    [groupId, employeeId.trim()]
  );
  return r.rows[0];
};

export const updateUsername = async (employeeId: string, username: string) => {
  await ensureUserRightsTables();
  const r = await pool.query(
    `
    UPDATE user_rights_users
    SET username = $1, updated_at = CURRENT_TIMESTAMP
    WHERE employee_id = $2
    RETURNING employee_id, username
    `,
    [username.trim(), employeeId.trim()]
  );
  return r.rows[0];
};

export const getGroupPrivileges = async (groupId: number) => {
  await ensureUserRightsTables();
  const r = await pool.query(
    `
    SELECT
      id,
      module,
      description,
      ref_id,
      can_read AS read,
      can_write AS write,
      can_delete AS delete,
      can_print AS print,
      can_export AS export
    FROM user_rights_privileges
    WHERE group_id = $1
    ORDER BY sort_order ASC NULLS LAST, module ASC, ref_id ASC
    `,
    [groupId]
  );
  return r.rows;
};

export const updateGroupPrivilege = async (
  groupId: number,
  privilegeId: number,
  data: {
    read: boolean;
    write: boolean;
    delete: boolean;
    print: boolean;
    export: boolean;
    ref_id?: string;
  }
) => {
  await ensureUserRightsTables();
  const byId = await pool.query(
    `
    UPDATE user_rights_privileges
    SET
      can_read = $1,
      can_write = $2,
      can_delete = $3,
      can_print = $4,
      can_export = $5,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $6 AND group_id = $7
    RETURNING id
    `,
    [data.read, data.write, data.delete, data.print, data.export, privilegeId, groupId]
  );
  if (byId.rows[0]) return byId.rows[0];

  if (data.ref_id) {
    const byRef = await pool.query(
      `
      UPDATE user_rights_privileges
      SET
        can_read = $1,
        can_write = $2,
        can_delete = $3,
        can_print = $4,
        can_export = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE group_id = $6 AND ref_id = $7
      RETURNING id
      `,
      [data.read, data.write, data.delete, data.print, data.export, groupId, data.ref_id]
    );
    return byRef.rows[0];
  }
  return null;
};

