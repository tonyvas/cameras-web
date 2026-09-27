const router = require('express').Router()

const {BadRequestError, NotFoundError} = require('../../errors');
const recordingsService = require('../../services/archive/recordings.service');
const sourcesService = require('../../services/archive/sources.service');

const utils = require('../../utils');

router.get('/', async (req, res, next) => {
    try {
        const SECOND = 1000;
        const MINUTE = 60 * SECOND;
        const HOUR = 60 * MINUTE;
        const DAY = 24 * HOUR;

        const DATE_MACRO_NEWEST = 'newest';
        const DATE_MACRO_OLDEST = 'oldest';

        const QUERY_KEY_SOURCES = 'src';
        const QUERY_KEY_MACRO = 'macro';
        const QUERY_KEY_WINDOW_DATE = 'date';
        const QUERY_KEY_WINDOW_START = 'start';
        const QUERY_KEY_WINDOW_DURATION = 'duration';

        const DEFAULT_WINDOW_START = 0;
        const DEFAULT_WINDOW_DURATION = 3 * HOUR;

        const allSources = await sourcesService.getSources();

        let selectedSources = allSources;
        let macro = null;
        let dateKey = DATE_MACRO_NEWEST;
        let timeStart = DEFAULT_WINDOW_START;
        let duration = DEFAULT_WINDOW_DURATION;

        // Sources
        if (req.query[QUERY_KEY_SOURCES]){
            selectedSources = [];

            for (let id of req.query[QUERY_KEY_SOURCES].split('-')){
                for (let source of allSources){
                    if (source.id == id){
                        selectedSources.push(source);
                        break;
                    }
                }
            }
        }

        // Window duration
        if (req.query[QUERY_KEY_WINDOW_DURATION]){
            duration = utils.parseTimeKey(req.query[QUERY_KEY_WINDOW_DURATION]);
        }

        // If macro set, use that
        if (req.query[QUERY_KEY_MACRO]){
            macro = req.query[QUERY_KEY_MACRO].toLowerCase();
        }
        // If date and time both not set, assume "latest" macro
        else if (!req.query[QUERY_KEY_WINDOW_DATE] && !req.query[QUERY_KEY_WINDOW_START]){
            macro = DATE_MACRO_NEWEST;
        }
        // Else parse date and time
        else{
            // Date
            if (req.query[QUERY_KEY_WINDOW_DATE]){
                dateKey = req.query[QUERY_KEY_WINDOW_DATE].toLowerCase();
            }

            // Start time
            if (req.query[QUERY_KEY_WINDOW_START]){
                timeStart = utils.parseTimeKey(req.query[QUERY_KEY_WINDOW_START]);
            }
        }

        // If date macro
        if (macro == DATE_MACRO_NEWEST || macro == DATE_MACRO_OLDEST){
            let func = macro == DATE_MACRO_NEWEST ? recordingsService.getNewestRecordings : recordingsService.getOldestRecordings;
            let recordings = await func(selectedSources);

            let recording = recordings[0];
            dateKey = utils.formatDateKey(new Date(recording.startTS - recording.utcOffset));
            
            let time = (recording.startTS - recording.utcOffset) % DAY;
            timeStart = Math.floor(time / duration) * duration;
        }
        // If macro set but unknown, throw error
        else if (macro != null){
            throw new BadRequestError(`Invalid macro: ${macro}!`);
        }

        // Format time into keys
        let timeStartKey = utils.formatTimeKey(timeStart);
        let timeEndKey = utils.formatTimeKey(timeStart + duration);
        
        let recordings = await recordingsService.getRecordings(selectedSources, dateKey, timeStartKey, timeEndKey);

        res.render('archive/recording-list.ejs', {
            data: {
                sources: allSources,
                recordings: recordings,
                dateKey: dateKey,
                windowStart: timeStart,
                windowDuration: duration,
            },
            utils: utils
        });
    } catch (err) {
        throw err;
    }
})

router.get('/:recording_id', async (req, res, next) => {
    try {
        const id = req.params.recording_id;

        let recording = await recordingsService.getRecordingById(id);
        let {next, prev} = await recordingsService.getRecordingNeighbors(recording);
        let related = await recordingsService.getRelatedRecordings(recording);

        res.render('archive/recording-details', {
            data: {
                recording, next, prev, related
            }, utils
        });
    } catch (err) {
        throw err;
    }
})

module.exports = router;