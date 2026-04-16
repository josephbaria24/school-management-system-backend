import pool from "../db.js";

export const ensureBuildingsRoomsTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS buildings (
      id SERIAL PRIMARY KEY,
      campus_id INTEGER NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
      building_name VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS building_floors (
      id SERIAL PRIMARY KEY,
      building_id INTEGER NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
      floor_name VARCHAR(255) NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    ALTER TABLE buildings
    ADD COLUMN IF NOT EXISTS popular_name VARCHAR(255)
  `);
  await pool.query(`
    ALTER TABLE buildings
    ADD COLUMN IF NOT EXISTS acronym VARCHAR(80)
  `);
  await pool.query(`
    ALTER TABLE buildings
    ADD COLUMN IF NOT EXISTS lan_ready BOOLEAN DEFAULT FALSE
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rooms (
      id SERIAL PRIMARY KEY,
      floor_id INTEGER NOT NULL REFERENCES building_floors(id) ON DELETE CASCADE,
      room_no VARCHAR(80) NOT NULL,
      room_name VARCHAR(255) NOT NULL,
      room_type VARCHAR(120),
      capacity INTEGER DEFAULT 0,
      air_conditioned BOOLEAN DEFAULT FALSE,
      fit_to_use BOOLEAN DEFAULT TRUE,
      lan_member BOOLEAN DEFAULT FALSE,
      night_class_allowed BOOLEAN DEFAULT FALSE,
      shared BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

export const getBuildingsTree = async () => {
  await ensureBuildingsRoomsTables();
  const r = await pool.query(`
    SELECT
      ai.id AS institution_id,
      ai.official_name AS institution_name,
      c.id AS campus_id,
      c.acronym,
      c.campus_name,
      b.id AS building_id,
      b.building_name,
      f.id AS floor_id,
      f.floor_name,
      f.sort_order,
      COALESCE(rc.room_count, 0) AS room_count
    FROM campuses c
    LEFT JOIN academic_institutions ai ON ai.id = c.institution_id
    LEFT JOIN buildings b ON b.campus_id = c.id
    LEFT JOIN building_floors f ON f.building_id = b.id
    LEFT JOIN (
      SELECT floor_id, COUNT(*)::int AS room_count
      FROM rooms
      GROUP BY floor_id
    ) rc ON rc.floor_id = f.id
    ORDER BY ai.official_name ASC, c.acronym ASC, b.building_name ASC, f.sort_order ASC, f.floor_name ASC
  `);
  return r.rows;
};

export const getRoomsByFloorId = async (floorId: number) => {
  await ensureBuildingsRoomsTables();
  const r = await pool.query(
    `SELECT * FROM rooms WHERE floor_id = $1 ORDER BY room_no ASC, room_name ASC`,
    [floorId]
  );
  return r.rows;
};

export const createBuilding = async (data: {
  campus_id: number;
  building_name: string;
  popular_name: string | null;
  acronym: string | null;
  lan_ready: boolean;
  number_of_floors: number;
}) => {
  await ensureBuildingsRoomsTables();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const created = await client.query(
      `INSERT INTO buildings (campus_id, building_name, popular_name, acronym, lan_ready)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        data.campus_id,
        data.building_name.trim(),
        data.popular_name,
        data.acronym,
        data.lan_ready,
      ]
    );
    const building = created.rows[0];
    const floors = Number.isFinite(data.number_of_floors)
      ? Math.max(1, Math.min(100, data.number_of_floors))
      : 1;
    for (let i = 1; i <= floors; i += 1) {
      await client.query(
        `INSERT INTO building_floors (building_id, floor_name, sort_order)
         VALUES ($1, $2, $3)`,
        [building.id, `${i}${i === 1 ? "st" : i === 2 ? "nd" : i === 3 ? "rd" : "th"} Floor`, i]
      );
    }
    await client.query("COMMIT");
    return building;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const createFloor = async (
  buildingId: number,
  floorName: string,
  sortOrder: number
) => {
  await ensureBuildingsRoomsTables();
  const r = await pool.query(
    `INSERT INTO building_floors (building_id, floor_name, sort_order)
     VALUES ($1, $2, $3) RETURNING *`,
    [buildingId, floorName.trim(), sortOrder]
  );
  return r.rows[0];
};

export const updateBuilding = async (
  id: number,
  data: {
    building_name: string;
    popular_name: string | null;
    acronym: string | null;
    lan_ready: boolean;
    number_of_floors: number;
  }
) => {
  await ensureBuildingsRoomsTables();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const r = await client.query(
      `UPDATE buildings
       SET building_name = $1,
           popular_name = $2,
           acronym = $3,
           lan_ready = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [
        data.building_name.trim(),
        data.popular_name,
        data.acronym,
        data.lan_ready,
        id,
      ]
    );
    const building = r.rows[0];
    if (!building) {
      await client.query("ROLLBACK");
      return null;
    }

    const currentFloorsQ = await client.query(
      `SELECT id, floor_name, sort_order
       FROM building_floors
       WHERE building_id = $1
       ORDER BY sort_order ASC, id ASC`,
      [id]
    );
    const currentFloors = currentFloorsQ.rows as Array<{
      id: number;
      floor_name: string;
      sort_order: number;
    }>;
    const targetFloors = Number.isFinite(data.number_of_floors)
      ? Math.max(1, Math.min(100, data.number_of_floors))
      : currentFloors.length || 1;

    if (targetFloors > currentFloors.length) {
      for (let i = currentFloors.length + 1; i <= targetFloors; i += 1) {
        await client.query(
          `INSERT INTO building_floors (building_id, floor_name, sort_order)
           VALUES ($1, $2, $3)`,
          [id, `${i}${i === 1 ? "st" : i === 2 ? "nd" : i === 3 ? "rd" : "th"} Floor`, i]
        );
      }
    } else if (targetFloors < currentFloors.length) {
      const floorsToRemove = currentFloors.slice(targetFloors);
      for (const f of floorsToRemove) {
        const rc = await client.query(
          `SELECT COUNT(*)::int AS count FROM rooms WHERE floor_id = $1`,
          [f.id]
        );
        if ((rc.rows[0]?.count ?? 0) > 0) {
          const err = new Error(
            `Cannot remove floor "${f.floor_name}" because it has room records`
          ) as Error & { code?: string };
          err.code = "FLOOR_HAS_ROOMS";
          throw err;
        }
      }
      for (const f of floorsToRemove) {
        await client.query(`DELETE FROM building_floors WHERE id = $1`, [f.id]);
      }
    }

    await client.query("COMMIT");
    return building;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const deleteBuilding = async (id: number) => {
  await ensureBuildingsRoomsTables();
  const r = await pool.query(
    `DELETE FROM buildings WHERE id = $1 RETURNING *`,
    [id]
  );
  return r.rows[0];
};

export const updateFloor = async (id: number, floorName: string) => {
  await ensureBuildingsRoomsTables();
  const r = await pool.query(
    `UPDATE building_floors
     SET floor_name = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [floorName.trim(), id]
  );
  return r.rows[0];
};

export const deleteFloor = async (id: number) => {
  await ensureBuildingsRoomsTables();
  const r = await pool.query(
    `DELETE FROM building_floors WHERE id = $1 RETURNING *`,
    [id]
  );
  return r.rows[0];
};

export const createRoom = async (data: Record<string, unknown>) => {
  await ensureBuildingsRoomsTables();
  const r = await pool.query(
    `INSERT INTO rooms (
      floor_id, room_no, room_name, room_type, capacity,
      air_conditioned, fit_to_use, lan_member, night_class_allowed, shared
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *`,
    [
      data.floor_id,
      data.room_no,
      data.room_name,
      data.room_type ?? null,
      data.capacity ?? 0,
      !!data.air_conditioned,
      data.fit_to_use === undefined ? true : !!data.fit_to_use,
      !!data.lan_member,
      !!data.night_class_allowed,
      !!data.shared,
    ]
  );
  return r.rows[0];
};

export const updateRoom = async (id: number, data: Record<string, unknown>) => {
  await ensureBuildingsRoomsTables();
  const r = await pool.query(
    `UPDATE rooms SET
      room_no = $1,
      room_name = $2,
      room_type = $3,
      capacity = $4,
      air_conditioned = $5,
      fit_to_use = $6,
      lan_member = $7,
      night_class_allowed = $8,
      shared = $9,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $10 RETURNING *`,
    [
      data.room_no,
      data.room_name,
      data.room_type ?? null,
      data.capacity ?? 0,
      !!data.air_conditioned,
      data.fit_to_use === undefined ? true : !!data.fit_to_use,
      !!data.lan_member,
      !!data.night_class_allowed,
      !!data.shared,
      id,
    ]
  );
  return r.rows[0];
};

export const deleteRoom = async (id: number) => {
  await ensureBuildingsRoomsTables();
  const r = await pool.query(`DELETE FROM rooms WHERE id = $1 RETURNING *`, [id]);
  return r.rows[0];
};

