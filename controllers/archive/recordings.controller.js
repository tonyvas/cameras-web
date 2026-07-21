const router = require('express').Router()

const {BadRequestError, NotFoundError} = require('../../errors');
const service = require('../../services/archive/recordings.service');
const {formatDate, formatTime, formatBitrate, formatSize} = require('../../utils');

router.get('/', async (req, res, next) => {
    try {
        const DEFAULT_LIMIT = 10;

        const sourcesQuery = req.query.src;
        const limitQuery = req.query.lmt;
        const olderThanCursorQuery = req.query.otc;
        const newerThanCursorQuery = req.query.ntc;
        const startTimestampQuery = req.query.sts;

        if (olderThanCursorQuery && newerThanCursorQuery){
            // Allow only a single cursor
            throw new BadRequestError(`Multiple cursors provided, but only one supported!`);
        }

        let sources = await (async () => {
            if (sourcesQuery){
                // Parse source IDs, and get Sources from database
                let promises = sourcesQuery.split('-').map(id => service.getSourceById(Number(id.trim())));
                return await Promise.all(promises);
            }
            else{
                return null;
            }
        })();

        let limit = limitQuery ? Number(limitQuery) : DEFAULT_LIMIT;

        let [isChrono, cursor] = await (async () => {
            if (newerThanCursorQuery){
                // Going in chronological order
                return [true, await service.getRecordingById(newerThanCursorQuery)];
            }
            else if (olderThanCursorQuery){
                // Going in reverse chronological order
                return [false, await service.getRecordingById(olderThanCursorQuery)];
            }
            else{
                // Going in chronological order, but without anchor
                return [false, null];
            }
        })();

        let startTimestamp = startTimestampQuery ? Number(startTimestampQuery) : null;
        
        let {recordings, oldest, hasOlder, newest, hasNewer} = await service.getPaginatedRecordings(sources, cursor, limit, isChrono, startTimestamp);
        let allSources = await service.getSources();

        res.render('archive/recording-list.ejs', {
            formatDate, formatTime,
            sources: allSources,
            recordings, oldest, hasOlder, newest, hasNewer,
        });
    } catch (err) {
        throw err;
    }
})

router.get('/:recording_id', async (req, res, next) => {
    try {
        const id = req.params.recording_id;

        let recording = await service.getRecordingById(id);
        let {next, prev} = await service.getRecordingNeighbors(recording);
        let related = await service.getRelatedRecordings(recording);

        res.render('archive/recording-details', { recording, next, prev, related, formatDate, formatTime, formatSize, formatBitrate});
    } catch (err) {
        throw err;
    }
})

module.exports = router;