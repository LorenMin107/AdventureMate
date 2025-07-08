const express = require('express');
const router = express.Router();
const tripsController = require('../../../controllers/api/trips');
const { authenticateJWT, requireAuth } = require('../../../middleware/jwtAuth');

// All routes require authentication
router.use(authenticateJWT);
router.use(requireAuth);

// Trip CRUD
router.post('/', tripsController.createTrip);
router.get('/', tripsController.getTrips);
router.get('/:id', tripsController.getTripById);
router.put('/:id', tripsController.updateTrip);
router.delete('/:id', tripsController.deleteTrip);

// TripDay CRUD (nested)
router.post('/:id/days', tripsController.addTripDay);
router.put('/:id/days/:dayId', tripsController.updateTripDay);
router.delete('/:id/days/:dayId', tripsController.deleteTripDay);

// Trip sharing/collaboration
router.post('/:id/invite', tripsController.inviteCollaborator);
router.delete('/:id/collaborators/:userId', tripsController.removeCollaborator);
router.post('/:id/accept', tripsController.acceptInvite);
router.get('/:id/collaborators', tripsController.listCollaborators);

// Allow a collaborator to remove themselves from a trip
router.delete('/:id/collaborators/me', tripsController.removeSelfAsCollaborator);

// Trip-to-booking endpoints
router.post('/:id/book', tripsController.bookTrip);
router.post('/:id/days/:dayId/book', tripsController.bookTripDay);

// New route for GET /trips/:id/invites
router.get('/:id/invites', tripsController.listInvites);

// New route for DELETE /trips/:id/invites/:email
router.delete('/:id/invites/:email', tripsController.cancelInvite);

// New route for GET /trips/invite-by-token/:token
router.get('/invite-by-token/:token', tripsController.getInviteByToken);

module.exports = router;
