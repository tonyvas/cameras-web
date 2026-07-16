const router = require('express').Router()

const {BadRequestError, NotFoundError} = require('../../errors');
const {getHLSStreamers} = require('../../services/live/streamers.service');

router.get('/', (req, res) => {
    try {
        res.render('live/cycler', {streamers: getHLSStreamers()});
    } catch (err) {
        throw err;
    }
})

module.exports = router;