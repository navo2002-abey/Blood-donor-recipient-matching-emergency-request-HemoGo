const express = require('express');
const {
  createCampaign,
  getCampaigns,
  updateCampaign,
  deleteCampaign,
} = require('../controllers/campaignController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, authorize('BLOOD_BANK_OFFICER', 'ADMIN'));

// GET  /api/campaigns  -> list all campaigns
// POST /api/campaigns  -> create new campaign (Organize Donation Drive)
router.route('/').get(getCampaigns).post(createCampaign);

// PUT    /api/campaigns/:id  -> update (e.g. publish/cancel)
// DELETE /api/campaigns/:id  -> delete campaign
router.route('/:id').put(updateCampaign).delete(deleteCampaign);

module.exports = router;