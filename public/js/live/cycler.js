const STOP_STREAMS_ACTIVITY_TIMEOUT_MS = 4 * 3600 * 1000;

let streamer = null;
let lastActiveTimeMS = Date.now()

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
            console.log('User inactive, stopping streamer')
            if (streamer){
                streamer.pause();
            }


            window.alert('Stream paused due to inactivity. Resume?')
            lastActiveTimeMS = Date.now()
            if (streamer){
                streamer.play();
            }
        }
    }, 1000);
}

function onSelectedOption(option){
    streamer.updateTitle(option.innerHTML)
    streamer.updateSrc(option.value);
    streamer.play();
}

function resizeStreamer(){
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

function setupSelect(){
    let select = document.getElementById('stream-select');
    
    function update(){
        onSelectedOption(select.options[select.selectedIndex])
    }

    select.onchange = update;

    select.onwheel = e => {
        let step = e.deltaY < 0 ? -1 : 1;
        select.selectedIndex = (select.selectedIndex + select.options.length + step) % select.options.length;

        update();
    }

    update();
}

function main(){
    streamer = getStreamers()[0];

    setInterval(() => {
        resizeStreamer();
    }, 500);

    setupSelect();
    setupStoppingOnInactivity();
}

document.addEventListener('DOMContentLoaded', main);
