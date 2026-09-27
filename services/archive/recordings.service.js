const db = require('../../database/db');

const {NotFoundError} = require('../../errors');
const {Source, Recording} = require('../../models/models');
const { getSourceById, getSources } = require('./sources.service');

/**
 * @param {number} recordingId 
 * @returns {Recording|null}
 */
async function getRecordingById(recordingId){
    let SQL = 'SELECT * FROM recording WHERE recording_id = ?'
    
    let rows = await db.query(SQL, [recordingId]);
    if (rows.length == 0){
        throw new NotFoundError(`Recording with ID=${recordingId} does not exist!`);
    }

    let row = rows[0];
    let source = await getSourceById(row['source_id']);

    return Recording.fromDatabaseObject(source, row);
}

async function getEndRecordings(sources, latest=true){
    let conditions = [];
    let params = [];

    conditions.push(`source_id IN (${sources.map(() => '?').join(',')})`);
    sources.map(s => params.push(s.id));

    let sql = `
        SELECT * FROM (
            SELECT
                *,
                ROW_NUMBER() OVER (
                    PARTITION BY source_id
                    ORDER BY start_ts ${latest ? 'DESC' : 'ASC'}
                ) AS rn
            FROM recording
            WHERE ${conditions.join(' AND ')}
        )
        WHERE rn = 1
    `;

    let rows = await db.query(sql, params);
    return rows.map(row => Recording.fromDatabaseObject(
        sources.find(s => s.id == row['source_id']),
        row
    ));
}

async function getNewestRecordings(sources){
    return await getEndRecordings(sources, true);
}

async function getOldestRecordings(sources){
    return await getEndRecordings(sources, false);
}

async function getRecordings(sources, dateKey, startKey, endKey){
    const DATE_STR_FORMULA = "STRFTIME('%Y%m%d', CAST((start_ts - utc_offset) / 1000 AS INTEGER), 'unixepoch')";
    const TIME_STR_FORMULA = "STRFTIME('%H%M%S', CAST((start_ts - utc_offset) / 1000 AS INTEGER), 'unixepoch')";

    let conditions = [];
    let params = [];

    // Sources
    conditions.push(`source_id IN (${sources.map(() => '?').join(',')})`);
    sources.map(s => params.push(s.id));

    // Date
    conditions.push(`date_key = ?`);
    params.push(dateKey);

    // Start time
    conditions.push(`time_key >= ?`);
    params.push(startKey);

    // End time
    conditions.push(`time_key < ?`);
    params.push(endKey);

    let sql = `
        SELECT
            *,
            ${DATE_STR_FORMULA} AS date_key,
            ${TIME_STR_FORMULA} AS time_key
        FROM recording
        WHERE ${conditions.join(' AND ')}
        ORDER BY (start_ts-utc_offset) ASC, start_ts ASC
    `;

    let rows = await db.query(sql, params);
    return rows.map(row => Recording.fromDatabaseObject(
        sources.find(s => s.id == row['source_id']),
        row
    ));
}

async function getRecordingNeighbors(recording){
    let NEXT_SQL = 'SELECT * FROM recording WHERE source_id = ? AND start_ts > ? ORDER BY start_ts ASC LIMIT 1';
    let PREV_SQL = 'SELECT * FROM recording WHERE source_id = ? AND start_ts < ? ORDER BY start_ts DESC LIMIT 1';

    let values = [recording.source.id, recording.startTS];
    let nextRows = await db.query(NEXT_SQL, values);
    let prevRows = await db.query(PREV_SQL, values);

    let next = nextRows.length > 0 ? Recording.fromDatabaseObject(recording.source, nextRows[0]) : null;
    let prev = prevRows.length > 0 ? Recording.fromDatabaseObject(recording.source, prevRows[0]) : null;

    return {next, prev};
}

async function getRelatedRecordings(recording){
    const SQL = 'SELECT recording_id FROM ( SELECT r.recording_id, ROW_NUMBER() OVER ( PARTITION BY source_id ORDER BY ABS((r.start_ts - r.utc_offset) - ?) ) AS rn FROM recording r WHERE r.source_id != ? ) WHERE rn = 1';

    let values = [recording.startTS - recording.utcOffset, recording.source.id];
    let rows = await db.query(SQL, values);

    let recordings = [];
    for (let row of rows){
        recordings.push(await getRecordingById(row['recording_id']));
    }

    return recordings;
}

module.exports = { getRecordingById, getNewestRecordings, getOldestRecordings, getRecordings, getRecordingNeighbors, getRelatedRecordings };