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
} from "../controllers/clientController.js";

const router = express.Router();

// Client CRUD operations
router.post("/", createClient);

router.get("/:id", fetchClientById);
router.get("/", getPaginatedClients);

router.patch("/:id", updateClient);
router.put("/:id", replaceClient);
router.put("/:client_id/services/:service_id", assignService);
router.delete("/:client_id/services/:service_id", unlinkService);

export default router;
