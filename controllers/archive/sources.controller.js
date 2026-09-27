const router = require('express').Router()

const {BadRequestError, NotFoundError} = require('../../errors');
const service = require('../../services/archive/sources.service');

const utils = require('../../utils');

router.get('/', async (req, res, next) => {
    try {
        let sources = await service.getSources();

        let counts = [];
        for (let source of sources){
            counts.push(await service.getSourceRecordingCountsByDate(source));
        }
        
        res.render('archive/source-list', { data: {sources, counts}, utils });
    } catch (err) {
        throw err;
    }
})

module.exports = router;