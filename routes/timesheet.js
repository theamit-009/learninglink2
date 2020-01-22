const express = require('express');
const router = express.Router();

router.get('/calendar',(request,response) => {
    response.render('timesheetcalendar');
})


module.exports = router; 