const express = require('express');
const User = require('../models/User');
const { formatResponse } = require('../tools/CustomUtils');
const router = express.Router();

router.post('/client/configs', async (req, res) => {
  res.json(formatResponse({}));
})

module.exports = router;