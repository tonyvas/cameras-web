const DATE_MACRO_NEWEST = 'newest';
const DATE_MACRO_OLDEST = 'oldest';

const QUERY_KEY_SOURCES = 'src';
const QUERY_KEY_MACRO = 'macro';
const QUERY_KEY_WINDOW_DATE = 'date';
const QUERY_KEY_WINDOW_START = 'start';
const QUERY_KEY_WINDOW_DURATION = 'duration';

const SOURCE_SEPARATOR = '-';
const SOURCE_ID_ATTR = 'data-id';

const sourceControls = document.querySelector('#source_controls');
const jumpDateControls = document.querySelector('#jump_date_controls');

const sourceCheckboxes = sourceControls.querySelectorAll('.source_checkbox');
const jumpDateInput = jumpDateControls.querySelector('#jump_date_input');

function goWindowPage(dateKey, timeKey=null, durationKey=null){
    let url = new URL(window.location);
    let params = url.searchParams;

    params.delete(QUERY_KEY_MACRO);
    params.set(QUERY_KEY_WINDOW_DATE, dateKey);

    if (timeKey){
        params.set(QUERY_KEY_WINDOW_START, timeKey);
    }
    else{
        params.delete(QUERY_KEY_WINDOW_START);
    }

    if (durationKey){
        params.set(QUERY_KEY_WINDOW_DURATION, durationKey);
    }
    else{
        params.delete(QUERY_KEY_WINDOW_DURATION);
    }

    window.location = url;
}

function goNewestPage(durationKey=null){
    let url = new URL(window.location);
    let params = url.searchParams;

    params.delete(QUERY_KEY_WINDOW_DATE);
    params.delete(QUERY_KEY_WINDOW_START);

    params.set(QUERY_KEY_MACRO, DATE_MACRO_NEWEST);
    params.set(QUERY_KEY_WINDOW_DURATION, durationKey);

    window.location = url;
}

function goOldestPage(durationKey=null){
    let url = new URL(window.location);
    let params = url.searchParams;

    params.delete(QUERY_KEY_WINDOW_DATE);
    params.delete(QUERY_KEY_WINDOW_START);

    params.set(QUERY_KEY_MACRO, DATE_MACRO_OLDEST);
    params.set(QUERY_KEY_WINDOW_DURATION, durationKey);

    window.location = url;
}

function loadInitialSourceControls(params){
    let src = params.get(QUERY_KEY_SOURCES);

    if (src){
        let ids = src.split(SOURCE_SEPARATOR);

        for (let checkbox of sourceCheckboxes){
            let id = checkbox.getAttribute(SOURCE_ID_ATTR)
            if (ids.indexOf(id) >= 0){
                checkbox.checked = true;
            }
        }
    }
}

function loadInitialJumpDateControls(params){
    jumpDateInput.value = '';
}

function loadInitialControlValues(){
    let url = new URL(window.location);
    let params = url.searchParams;

    loadInitialSourceControls(params);
    loadInitialJumpDateControls(params);
}

function getSelectedSourceIds(){
    let ids = [];
    for (let checkbox of sourceCheckboxes){
        if (checkbox.checked){
            ids.push(checkbox.getAttribute(SOURCE_ID_ATTR))
        }
    }

    return ids;
}

function updateSourceParams(params){
    let ids = getSelectedSourceIds();

    if (ids.length == 0){
        params.delete(QUERY_KEY_SOURCES);
    }
    else{
        params.set(QUERY_KEY_SOURCES, ids.join(SOURCE_SEPARATOR));
    }
}

function onUpdateOnFilter(){
    let url = new URL(window.location);
    let params = url.searchParams;

    updateSourceParams(params);

    window.location = url;
}

function onJumpToDate(){
    let dateStr = jumpDateInput.value;
    let dateKey = dateStr.replaceAll('-', '');

    goWindowPage(dateKey);
}

loadInitialControlValues();