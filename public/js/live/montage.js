const STREAMERS_CONTAINER = document.getElementById('streamers');
const STOP_STREAMS_VISIBILITY_TIMEOUT_MS = 5 * 1000;
const STOP_STREAMS_ACTIVITY_TIMEOUT_MS = 4 * 3600 * 1000;

const streamers = [];

let lastActiveTimeMS = Date.now()

function stopStreamers(){
    for (let streamer of streamers){
        streamer.pause();
    }
}

function startStreamers(){
    for (let streamer of streamers){
        streamer.play();
    }
}

function setupStoppingOnInactivity(){
    let activityEvents = [
        'mousemove', 'mousedown', 'mouseup',
        'keydown', 'keyup', 'touchstart',
        'scroll', 'click'
    ]

    activityEvents.map(e => {
        document.addEventListener(e, () => {
            lastActiveTimeMS = Date.now()
        })
    })

    setInterval(() => {
        if (Date.now() - lastActiveTimeMS > STOP_STREAMS_ACTIVITY_TIMEOUT_MS){
            console.log('User inactive, stopping streamers')
            stopStreamers();

            window.alert('Streams paused due to inactivity. Resume?')
            lastActiveTimeMS = Date.now()
            startStreamers();
        }
    }, 1000);
}

function setupStoppingOnVisibilityChange(){
    let stopStreamsTimeout = null;

    document.addEventListener('visibilitychange', () => {
        if (document.hidden){
            if (!stopStreamsTimeout){
                stopStreamsTimeout = setTimeout(() => {
                    stopStreamers();
                }, STOP_STREAMS_VISIBILITY_TIMEOUT_MS);
            }
        }
        else{
            clearTimeout(stopStreamsTimeout);
            stopStreamsTimeout = null;
    
            startStreamers();
        }
    })
}

function setupColumnSlider(){
    let colRangeInput = document.getElementById('col-range');
    let colRangeInputLabel = document.getElementById('col-range-label');
    colRangeInput.value = window.getComputedStyle(STREAMERS_CONTAINER).gridTemplateColumns.split(' ').length
    colRangeInputLabel.innerHTML = `Columns: ${colRangeInput.value}`;

    colRangeInput.oninput = (e) => {
        let cols = Number(e.target.value);

        colRangeInputLabel.innerHTML = `Columns: ${colRangeInput.value}`;
        STREAMERS_CONTAINER.style.gridTemplateColumns = '1fr '.repeat(cols)
    }
}

function resetStreamersSize(){
    let streamersElem = document.getElementById('streamers');
    streamersElem.style.removeProperty('max-width');
}

function resizeStreamersToFit(){
    const MARGIN_PX = 10;
    const MAX_ATTEMPTS = 10;

    let streamersElem = document.getElementById('streamers');

    streamersElem.style.removeProperty('max-width');

    let usableHeight = window.innerHeight - streamersElem.offsetTop - MARGIN_PX;
    let usableWidth = window.innerWidth - 2*MARGIN_PX;

    let attempts = 0;
    while (streamersElem.clientHeight > usableHeight && attempts++ < MAX_ATTEMPTS){
        let maxWidth = Math.min(usableWidth, streamersElem.clientWidth / streamersElem.clientHeight * usableHeight);
        streamersElem.style.maxWidth = `${Math.floor(maxWidth)}px`;
    }
}

function setupControls(){
    setupColumnSlider();
}

document.addEventListener('DOMContentLoaded', () => {
    for (let streamer of getStreamers()){
        streamers.push(streamer);
    }

    setupControls();
    setupStoppingOnVisibilityChange();
    setupStoppingOnInactivity();

    startStreamers();
});
