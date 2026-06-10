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
} from "../controllers/clientController.js";

const router = express.Router();

// Client CRUD operations
router.post("/", createClient);

router.get("/:id", fetchClientById);
router.get("/", getPaginatedClients);

export default router;
