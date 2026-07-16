const router = require('express').Router()

const { BadRequestError, NotFoundError } = require('./errors');

router.get('/', (req, res) => res.redirect('/live'));
router.get('/live', (req, res) => res.redirect('/live/montage'));
router.get('/archive', (req, res) => res.redirect('/archive/recordings'));

router.use('/live/montage', require('./controllers/live/montage.controller'));
router.use('/live/cycler', require('./controllers/live/cycler.controller'));

router.use('/archive/media', require('./controllers/archive/media.controller'));
router.use('/archive/sources', require('./controllers/archive/sources.controller'));
router.use('/archive/recordings', require('./controllers/archive/recordings.controller'));

router.use((req, res) => {
    throw new NotFoundError(`Nothing at ${req.url}`);
});

router.use(async (err, req, res, next) => {
    let logger = req.app.locals.webLogger;
    
    if (err instanceof BadRequestError){
        await logger.logInfo(`Bad request: ${err.message}`);
        res.status(400).render('error', { error: err.message });
    }
    else if (err instanceof NotFoundError){
        await logger.logInfo(`Not found: ${err.message}`);
        res.status(404).render('error', { error: err.message });
    }
    else{
        await logger.logError(`Internal: ${err.message}`);
        res.status(500).render('error', { error: 'Internal server error!' });
    }
})

module.exports = router;