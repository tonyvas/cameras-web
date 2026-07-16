function getHLSStreamers(){
    if (!process.env.HLS_STREAMS){
        return [];
    }

    let streams = {};
    for (let namePair of process.env.HLS_STREAMS.split(',')){
        let [hName, uName] = namePair.split(':');

        streams[hName.trim()] = uName.trim();
    }

    return streams;
}

module.exports = { getHLSStreamers };