import { Request, Response } from "express";
import * as schoolCalendarService from "../services/schoolCalendar.service.js";

export const getAll = async (req: Request, res: Response) => {
  try {
    const year = req.query.year
      ? parseInt(String(req.query.year), 10)
      : undefined;
    const rows = await schoolCalendarService.getAllSchoolCalendarEvents(year);
    res.json(rows);
  } catch (err) {
    console.error("SchoolCalendar Controller Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const calendarDate =
      typeof req.body?.calendar_date === "string"
        ? req.body.calendar_date.trim()
        : "";
    if (!calendarDate) {
      return res.status(400).json({ error: "Date is required" });
    }
    const created = await schoolCalendarService.createSchoolCalendarEvent({
      calendar_date: calendarDate,
      description: req.body?.description,
      non_working_day: req.body?.non_working_day,
    });
    res.status(201).json(created);
  } catch (err) {
    console.error("SchoolCalendar Controller Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const calendarDate =
      typeof req.body?.calendar_date === "string"
        ? req.body.calendar_date.trim()
        : "";
    if (!calendarDate) {
      return res.status(400).json({ error: "Date is required" });
    }
    const updated = await schoolCalendarService.updateSchoolCalendarEvent(id, {
      calendar_date: calendarDate,
      description: req.body?.description,
      non_working_day: req.body?.non_working_day,
    });
    if (!updated)
      return res.status(404).json({ error: "Calendar event not found" });
    res.json(updated);
  } catch (err) {
    console.error("SchoolCalendar Controller Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const deleted = await schoolCalendarService.deleteSchoolCalendarEvent(id);
    if (!deleted)
      return res.status(404).json({ error: "Calendar event not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("SchoolCalendar Controller Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
