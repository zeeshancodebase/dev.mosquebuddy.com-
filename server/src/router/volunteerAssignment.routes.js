import express from "express";

import {
  getVolunteerAssignmentsController,
  createVolunteerAssignmentController,
  updateVolunteerAssignmentController,
  deactivateVolunteerAssignmentController,
} from "../controllers/volunteerAssignment.controller.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Admin Volunteer Assignment Routes
|--------------------------------------------------------------------------
| Super Admin can assign trusted volunteers to:
| - one venue
| - one area
| - one city
|
| User must already have trusted_volunteer role.
*/

router.use(authMiddleware);
router.use(roleMiddleware("super_admin"));

router.get("/", getVolunteerAssignmentsController);
router.post("/", createVolunteerAssignmentController);
router.patch("/:assignmentId", updateVolunteerAssignmentController);
router.delete("/:assignmentId", deactivateVolunteerAssignmentController);

export default router;