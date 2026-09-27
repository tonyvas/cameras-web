const {exec} = require('child_process');
const fs = require('fs');
const path = require('path');

function round(num, decimals){
    return Math.round(num * 10**decimals) / 10**decimals;
}

function execChildProcess(cmd){
    return new Promise((resolve, reject) => {
        exec(cmd, (err, stdout, stderr) => {
            if (err){
                reject(new Error(`Failed to run subprocess: ${err.message}`))
            }
            else{
                resolve({stdout, stderr});
            }
        })
    })
}

function mkdir(path, recursive=false){
    return new Promise((resolve, reject) => {
        fs.mkdir(path, {recursive}, err => {
            if (err){
                reject(err)
            }
            else{
                resolve();
            }
        })
    })
}

async function generateThumbnail(videoPath, thumbPath){
    let cmd = `ffmpeg -i '${videoPath}' -ss 1 -vframes 1 -s 720x480 -q:v 2 -y '${thumbPath}'`;

    await mkdir(path.dirname(thumbPath), true);
    await execChildProcess(cmd);
}

async function getMetadata(videoPath){
    let cmd = `ffprobe -v error -print_format json -show_format -show_streams "${videoPath}"`;
    let {stdout, stderr} = await execChildProcess(cmd);

    return JSON.parse(stdout);
}

function padNumber(num, digits){
    return num.toString().padStart(digits, '0');
}

function formatSeconds(seconds, brief=true){
    let s = Math.floor(seconds);

    let h = Math.floor(s / 3600);
    s %= 3600;
    
    let m = Math.floor(s / 60);
    s %= 60;

    let parts = [];
    if (h > 0 || !brief){
        parts.push(h);
    }

    parts.push(m);
    parts.push(s);

    return parts.map(p => padNumber(p, 2)).join(':');
}

function formatDate(date){
    let year = padNumber(date.getUTCFullYear(), 4);
    let month = padNumber(date.getUTCMonth()+1, 2);
    let day = padNumber(date.getUTCDate(), 2);

    return `${year}-${month}-${day}`;
}

function formatTime(date){
    let hours = padNumber(date.getUTCHours(), 2);
    let minutes = padNumber(date.getUTCMinutes(), 2);
    let seconds = padNumber(date.getUTCSeconds(), 2);

    return `${hours}:${minutes}:${seconds}`;
}

function formatDateTime(date){
    return `${formatDate(date)} ${formatTime(date)}`;
}

function formatDateRange(startDate, endDate){
    let sameYear = startDate.getUTCFullYear() == endDate.getUTCFullYear();
    let sameMonth = startDate.getUTCMonth() == endDate.getUTCMonth();
    let sameDay = startDate.getUTCDate() == endDate.getUTCDate();

    if (sameYear && sameMonth && sameDay){
        return `${formatDateTime(startDate)} - ${formatTime(endDate)}`;
    }
    else{
        return `${formatDateTime(startDate)} - ${formatDateTime(endDate)}`;
    }
}

function formatBitrate(bitrate){
    if (bitrate > 1e6){
        return `${round(bitrate/1e6, 2)} Mb/s`;
    }
    else if (bitrate > 1e3){
        return `${round(bitrate/1e3, 2)} kb/s`;
    }
    else{
        return `${bitrate} b/s`;
    }
}

function formatSize(size){
    if (size > 1e9){
        return `${round(size/1e9, 2)} GB`;
    }
    else if (size > 1e6){
        return `${round(size/1e6, 2)} MB`;
    }
    else if (size > 1e3){
        return `${round(size/1e3, 2)} kB`;
    }
    else{
        return `${size} B`;
    }
}

function formatDateKey(date){
    let year = date.getUTCFullYear().toString().padStart(4, '0');
    let month = (date.getUTCMonth()+1).toString().padStart(2, '0');
    let day = date.getUTCDate().toString().padStart(2, '0');

    return [year, month, day].join('');
}

function parseDateKey(key){
    let year = Number(key.substring(0, 4));
    let month = Number(key.substring(4, 6));
    let day = Number(key.substring(6, 8));

    return new Date(year, month-1, day);
}

function formatTimeKey(ms){
    let seconds = Math.floor(ms/1000);
    
    let hours = Math.floor(seconds / 3600);
    seconds %= 3600;

    let minutes = Math.floor(seconds / 60);
    seconds %= 60;

    return [hours, minutes, seconds].map(v => v.toString().padStart(2, '0')).join('');
}

function parseTimeKey(key){
    let hours = Number(key.substring(0, 2));
    let minutes = Number(key.substring(2, 4));

    let seconds = key.length > 4 ? Number(key.substring(4, 6)) : 0;

    return (hours * 3600 + minutes * 60 + seconds) * 1000;
}

module.exports = {
    execChildProcess, mkdir,
    generateThumbnail, getMetadata,
    padNumber, round,
    formatSeconds, formatDate, formatTime, formatDateTime, formatDateRange,
    formatBitrate, formatSize,
    formatDateKey, formatTimeKey, parseDateKey, parseTimeKey
};