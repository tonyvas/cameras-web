const SOURCE_PARAM = 'src';
const LIMIT_PARAM = 'lmt';

const NEWER_THAN_CURSOR_PARAM = 'ntc';
const OLDER_THAN_CURSOR_PARAM = 'otc';

const END_TIMESTAMP_PARAM = 'ets';

const SOURCE_SEPARATOR = '-';
const SOURCE_ID_ATTR = 'data-id';

const sourceControls = document.querySelector('#source_controls');
const limitControls = document.querySelector('#limit_controls');
const jumpDateControls = document.querySelector('#jump_date_controls');

const sourceCheckboxes = sourceControls.querySelectorAll('.source_checkbox');
const limitSelect = limitControls.querySelector('#limit_select');
const jumpDateDateInput = jumpDateControls.querySelector('.date_input');

function goOlderThanPage(id){
    let url = new URL(window.location);
    let params = url.searchParams;

    if (id >= 0){
        params.delete(END_TIMESTAMP_PARAM);
        params.delete(NEWER_THAN_CURSOR_PARAM);
        params.set(OLDER_THAN_CURSOR_PARAM, id);

        window.location = url;
    }
}

function goNewerThanPage(id){
    let url = new URL(window.location);
    let params = url.searchParams;

    if (id >= 0){
        params.delete(END_TIMESTAMP_PARAM);
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
    params.delete(END_TIMESTAMP_PARAM);

    window.location = url;
}

function goOldestPage(){
    alert('Not implemented yet!');
}

function goDatePage(year, month, dom){
    let url = new URL(window.location);
    let params = url.searchParams;

    let date = new Date(year, month-1, dom);

    // Add 1 day, as end bound is excluded
    // If requested 2026-11-22, set end bound to 2026-11-23 00:00:00
    date.setDate(date.getDate() + 1);

    params.delete(OLDER_THAN_CURSOR_PARAM);
    params.delete(NEWER_THAN_CURSOR_PARAM);
    params.set(END_TIMESTAMP_PARAM, date.getTime());

    window.location = url;
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

function loadInitialJumpDateControls(params){
    let ets = params.get(END_TIMESTAMP_PARAM);
    if (ets){
        let date = new Date(Number(ets));
        date.setDate(date.getDate() - 1); // End bound is not included. If ets is 2026-11-22 00:00:00, then content is 2026-11-21
        
        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        let dom = date.getDate();

        jumpDateDateInput.value = `${year.toString()}-${month.toString().padStart(2, '0')}-${dom.toString().padStart(2, '0')}`;
    }
}

function loadInitialControlValues(){
    let url = new URL(window.location);
    let params = url.searchParams;

    loadInitialSourceControls(params);
    loadInitialLimitControls(params);
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

function updateOnJumpDate(){
    let dateStr = jumpDateDateInput.value;

    if (!dateStr){
        return alert('Invalid date!');
    }

    let [year, month, date] = dateStr.split('-');
    goDatePage(year, month, date);
}

loadInitialControlValues();