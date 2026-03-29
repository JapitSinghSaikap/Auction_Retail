const express = require('express');
const router  = express.Router();

// In-memory ring buffer — max 100 entries, resets on server restart
const recentActivity = [];
const MAX_ACTIVITY   = 100;

function addActivity(event) {
  recentActivity.unshift(event);
  if (recentActivity.length > MAX_ACTIVITY) recentActivity.length = MAX_ACTIVITY;
}

// GET /api/activity/recent  → last 20 events
router.get('/recent', (req, res) => {
  res.json({ activities: recentActivity.slice(0, 20) });
});

module.exports = { router, addActivity };
