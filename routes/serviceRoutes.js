/**
 * Service Routes - Handles all /services endpoint operations.
 *
 * @module routes/servicesRoutes
 */

import express from "express";
import {
  createService,
  fetchServiceById,
  getPaginatedServices,
  updateService,
  replaceService,
  removeService,
} from "../controllers/serviceController.js";

const router = express.Router();

// Service CRUD operations
router.post("/", createService);

router.get("/:service_id", fetchServiceById);
router.get("/", getPaginatedServices);

router.patch("/:service_id", updateService);
router.put("/:service_id", replaceService);

router.delete("/:service_id", removeService);

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
