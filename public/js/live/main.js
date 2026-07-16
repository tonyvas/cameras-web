function getStreamers(){
    let streamers = [];

    for (let elem of document.getElementsByClassName('streamer')){
        streamers.push(new Streamer(elem));
    }

    return streamers;
}