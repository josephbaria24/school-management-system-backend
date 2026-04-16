import { Request, Response } from "express";
import * as svc from "../services/buildingsRooms.service.js";

export const getTree = async (_req: Request, res: Response) => {
  try {
    const rows = await svc.getBuildingsTree();
    res.json(rows);
  } catch (err) {
    console.error("buildings rooms tree:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getRooms = async (req: Request, res: Response) => {
  try {
    const floorId = parseInt(String(req.query.floor_id ?? ""), 10);
    if (!Number.isFinite(floorId)) {
      return res.status(400).json({ error: "floor_id is required" });
    }
    const rows = await svc.getRoomsByFloorId(floorId);
    res.json(rows);
  } catch (err) {
    console.error("buildings rooms getRooms:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createBuilding = async (req: Request, res: Response) => {
  try {
    const campusId = parseInt(String(req.body.campus_id ?? ""), 10);
    const buildingName = String(req.body.building_name ?? "").trim();
    const popularNameRaw = String(req.body.popular_name ?? "").trim();
    const acronymRaw = String(req.body.acronym ?? "").trim();
    const numberOfFloors = parseInt(String(req.body.number_of_floors ?? "1"), 10);
    const lanReady = !!req.body.lan_ready;
    if (!Number.isFinite(campusId) || !buildingName) {
      return res.status(400).json({ error: "campus_id and building_name are required" });
    }
    const row = await svc.createBuilding({
      campus_id: campusId,
      building_name: buildingName,
      popular_name: popularNameRaw || null,
      acronym: acronymRaw || null,
      lan_ready: lanReady,
      number_of_floors: Number.isFinite(numberOfFloors) ? numberOfFloors : 1,
    });
    res.status(201).json(row);
  } catch (err) {
    console.error("buildings rooms createBuilding:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createFloor = async (req: Request, res: Response) => {
  try {
    const buildingId = parseInt(String(req.body.building_id ?? ""), 10);
    const floorName = String(req.body.floor_name ?? "").trim();
    const sortOrder = Number(req.body.sort_order ?? 0);
    if (!Number.isFinite(buildingId) || !floorName) {
      return res.status(400).json({ error: "building_id and floor_name are required" });
    }
    const row = await svc.createFloor(buildingId, floorName, Number.isFinite(sortOrder) ? sortOrder : 0);
    res.status(201).json(row);
  } catch (err) {
    console.error("buildings rooms createFloor:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateBuilding = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const buildingName = String(req.body.building_name ?? "").trim();
    const popularNameRaw = String(req.body.popular_name ?? "").trim();
    const acronymRaw = String(req.body.acronym ?? "").trim();
    const lanReady = !!req.body.lan_ready;
    const numberOfFloors = parseInt(String(req.body.number_of_floors ?? "1"), 10);
    if (!Number.isFinite(id) || !buildingName) {
      return res.status(400).json({ error: "id and building_name are required" });
    }
    const row = await svc.updateBuilding(id, {
      building_name: buildingName,
      popular_name: popularNameRaw || null,
      acronym: acronymRaw || null,
      lan_ready: lanReady,
      number_of_floors: Number.isFinite(numberOfFloors) ? numberOfFloors : 1,
    });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) {
    const e = err as { code?: string; message?: string };
    if (e?.code === "FLOOR_HAS_ROOMS") {
      return res.status(409).json({ error: e.message || "Cannot reduce floors: rooms exist" });
    }
    console.error("buildings rooms updateBuilding:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteBuilding = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const row = await svc.deleteBuilding(id);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("buildings rooms deleteBuilding:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateFloor = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const floorName = String(req.body.floor_name ?? "").trim();
    if (!Number.isFinite(id) || !floorName) {
      return res.status(400).json({ error: "id and floor_name are required" });
    }
    const row = await svc.updateFloor(id, floorName);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) {
    console.error("buildings rooms updateFloor:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteFloor = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const row = await svc.deleteFloor(id);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("buildings rooms deleteFloor:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createRoom = async (req: Request, res: Response) => {
  try {
    const floorId = parseInt(String(req.body.floor_id ?? ""), 10);
    const roomNo = String(req.body.room_no ?? "").trim();
    const roomName = String(req.body.room_name ?? "").trim();
    if (!Number.isFinite(floorId) || !roomNo || !roomName) {
      return res.status(400).json({ error: "floor_id, room_no, room_name are required" });
    }
    const row = await svc.createRoom({
      ...req.body,
      floor_id: floorId,
      room_no: roomNo,
      room_name: roomName,
      capacity: Number(req.body.capacity ?? 0),
    });
    res.status(201).json(row);
  } catch (err) {
    console.error("buildings rooms createRoom:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateRoom = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }
    const roomNo = String(req.body.room_no ?? "").trim();
    const roomName = String(req.body.room_name ?? "").trim();
    if (!roomNo || !roomName) {
      return res.status(400).json({ error: "room_no and room_name are required" });
    }
    const row = await svc.updateRoom(id, {
      ...req.body,
      room_no: roomNo,
      room_name: roomName,
      capacity: Number(req.body.capacity ?? 0),
    });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) {
    console.error("buildings rooms updateRoom:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }
    const row = await svc.deleteRoom(id);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("buildings rooms deleteRoom:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

