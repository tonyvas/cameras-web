const SOURCE_PARAM = 'src';
const LIMIT_PARAM = 'lmt';

const NEWER_THAN_CURSOR_PARAM = 'ntc';
const OLDER_THAN_CURSOR_PARAM = 'otc';

const START_TIMESTAMP_PARAM = 'sts';

const SOURCE_SEPARATOR = '-';
const SOURCE_ID_ATTR = 'data-id';

const sourceControls = document.querySelector('#source_controls');
const limitControls = document.querySelector('#limit_controls');
const jumpStartControls = document.querySelector('#jump_ts_controls');

const sourceCheckboxes = sourceControls.querySelectorAll('.source_checkbox');
const limitSelect = limitControls.querySelector('#limit_select');
const jumpStartDateInput = jumpStartControls.querySelector('.date_input');
const jumpStartTimeInput = jumpStartControls.querySelector('.time_input');

function goOlderThanPage(id){
    let url = new URL(window.location);
    let params = url.searchParams;

    if (id >= 0){
        params.delete(START_TIMESTAMP_PARAM);
        params.delete(NEWER_THAN_CURSOR_PARAM);
        params.set(OLDER_THAN_CURSOR_PARAM, id);

        window.location = url;
    }
}

function goNewerThanPage(id){
    let url = new URL(window.location);
    let params = url.searchParams;

    if (id >= 0){
        params.delete(START_TIMESTAMP_PARAM);
        params.delete(OLDER_THAN_CURSOR_PARAM);
        params.set(NEWER_THAN_CURSOR_PARAM, id);

        window.location = url;
    }
}

function goLatestPage(){
    let url = new URL(window.location);
    let params = url.searchParams;

    params.delete(NEWER_THAN_CURSOR_PARAM);
    params.delete(OLDER_THAN_CURSOR_PARAM);
    params.delete(START_TIMESTAMP_PARAM);

    window.location = url;
}

function goOldestPage(){
    alert('Not implemented yet!');
}

function loadInitialSourceControls(params){
    let src = params.get(SOURCE_PARAM);

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

function loadInitialLimitControls(params){
    let lmt = params.get(LIMIT_PARAM);
    if (lmt){
        let options = limitSelect.options;
        for (let i = 0; i < options.length; i++){
            if (options[i].value == lmt){
                limitSelect.selectedIndex = i;
                break;
            }
        }
    }
}

function loadInitialControlValues(){
    let url = new URL(window.location);
    let params = url.searchParams;

    loadInitialSourceControls(params);
    loadInitialLimitControls(params);
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
        params.delete(SOURCE_PARAM);
    }
    else{
        params.set(SOURCE_PARAM, ids.join(SOURCE_SEPARATOR));
    }
}

function updateLimitParams(params){
    let lmt = limitSelect.options[limitSelect.selectedIndex].value;
    params.set(LIMIT_PARAM, lmt);
}

function updateOnFilter(){
    let url = new URL(window.location);
    let params = url.searchParams;

    updateSourceParams(params);
    updateLimitParams(params);

    window.location = url;
}

function getJumpStartDate(){
    let dateStr = jumpStartDateInput.value;
    let timeStr = jumpStartTimeInput.value;

    if (!dateStr){
        throw new Error('Invalid date!');
    }

    let [year, month, dom] = dateStr.split('-');
    let [hours, minutes, seconds, millis] = [23, 59, 59, 999];

    if (timeStr){
        let [hr, min, sec] = timeStr.split(':');

        hours = hr ? hr : hours;
        minutes = min ? min : minutes;

        if (sec){
            let [s, ms] = sec.split('.');
            
            seconds = s ? s : seconds;
            millis = ms ? ms : millis;
        }
    }
        
    return new Date(year, month-1, dom, hours, minutes, seconds, millis);
}

function updateOnJumpStart(){
    try {
        let date = getJumpStartDate();
        console.log(date);

        let url = new URL(window.location);
        let params = url.searchParams;

        params.delete(OLDER_THAN_CURSOR_PARAM);
        params.delete(NEWER_THAN_CURSOR_PARAM);
        params.set(START_TIMESTAMP_PARAM, Math.floor(date.getTime()));

        window.location = url;
    } catch (error) {
        alert(error.message);
    }
}

loadInitialControlValues();