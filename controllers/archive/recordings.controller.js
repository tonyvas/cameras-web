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
        const QUERY_KEY_WINDOW_DURATION = 'duration';
        const QUERY_KEY_WINDOW_PAGE = 'page'

        const DEFAULT_WINDOW_DURATION = 3 * HOUR;
        const DEFAULT_WINDOW_PAGE = 1;

        const allSources = await sourcesService.getSources();

        let selectedSources = allSources;
        let dateKey = null;
        let duration = DEFAULT_WINDOW_DURATION;
        let page = DEFAULT_WINDOW_PAGE;

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

        if (req.query[QUERY_KEY_MACRO] || !req.query[QUERY_KEY_WINDOW_DATE]){
            // If macro is given, use it
            // If no macro and no date given, assume macro for latest
            let macro = req.query[QUERY_KEY_MACRO] ? req.query[QUERY_KEY_MACRO].toLowerCase() : DATE_MACRO_NEWEST;

            // The newest/oldest recording, depending on macro
            let recording = null;

            if (macro == DATE_MACRO_NEWEST){
                recording = await recordingsService.getNewestRecording(selectedSources);
            }
            else if (macro == DATE_MACRO_OLDEST){
                recording = await recordingsService.getOldestRecording(selectedSources);
            }
            else{
                throw new BadRequestError(`Invalid macro: ${macro}!`);
            }

            // If got recording, set date and page based on it
            if (recording){
                let timeOffset = (recording.startTS - recording.utcOffset) % DAY;

                dateKey = utils.formatDateKey(new Date(recording.startTS - recording.utcOffset));
                page = Math.floor(timeOffset / duration) + 1
            }
        }
        else{
            // If only date given, parse it
            dateKey = req.query[QUERY_KEY_WINDOW_DATE].toLowerCase();

            // Get page if available
            if (req.query[QUERY_KEY_WINDOW_PAGE]){
                page = Number.parseInt(req.query[QUERY_KEY_WINDOW_PAGE]);
            }
        }

        let recordings = [];

        // If date available, get recordings
        // Otherwise, render empty list (if no recordings available)
        if (dateKey){
            // Convert duration and page into start/end times
            let timeStart = Math.max(0, duration * (page-1));
            let timeEnd = Math.min(DAY-1, timeStart + duration);

            // Format as keys
            let timeStartKey = utils.formatTimeKey(timeStart);
            let timeEndKey = utils.formatTimeKey(timeEnd);
            
            recordings = await recordingsService.getRecordings(selectedSources, dateKey, timeStartKey, timeEndKey);
        }
        
        res.render('archive/recording-list.ejs', {
            data: {
                sources: allSources,
                recordings: recordings,
                dateKey: dateKey,
                windowDuration: duration,
                windowPage: page,
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