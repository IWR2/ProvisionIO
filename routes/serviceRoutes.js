/**
 * Service Routes - Handles all /services endpoint operations.
 *
 * @module routes/servicesRoutes
 */

import express from "express";
import {
  createService,
  getAService,
  getAllServices,
} from "../controllers/serviceController.js";

const router = express.Router();

// Service CRUD operations
router.post("/", createService);

router.get("/:id", getAService);
router.get("/", getAllServices);

// Method Not Allowed handlers (for root path only)
router.put("/", (req, res) => {
  res.set("Accept", "PUT");
  res.status(405).json({ Error: "Method not allowed" });
});

router.patch("/", (req, res) => {
  res.set("Accept", "PATCH");
  res.status(405).json({ Error: "Method not allowed" });
});

router.delete("/", (req, res) => {
  res.set("Accept", "DELETE");
  res.status(405).json({ Error: "Method not allowed" });
});

export default router;
