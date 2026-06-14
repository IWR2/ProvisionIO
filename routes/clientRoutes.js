/**
 * Client Routes - Handles all /services endpoint operations.
 *
 * @module routes/clientRoutes
 */

import express from "express";
import {
  createClient,
  fetchClientById,
  getPaginatedClients,
  updateClient,
  replaceClient,
  assignService,
  unlinkService,
  deleteClient,
} from "../controllers/clientController.js";

const router = express.Router();

// Client CRUD operations
router.post("/", createClient);

router.get("/:client_id", fetchClientById);
router.get("/", getPaginatedClients);

router.patch("/:client_id", updateClient);
router.put("/:client_id", replaceClient);
router.put("/:client_id/services/:service_id", assignService);
router.delete("/:client_id/services/:service_id", unlinkService);
router.delete("/:client_id", deleteClient);

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
