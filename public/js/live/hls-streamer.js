class Streamer{
    constructor(rootElement){
        this._root = rootElement;
        this._video = rootElement.getElementsByTagName('video')[0];
        
        this._hls = null;
        this._src = 'data-src' in this._video.attributes ? this._video.attributes['data-src'].value : null;

        this._setupStreamer();

        setInterval(() => {
            this.seekToHead();
        }, 500)
    }

    _setupStreamer(){
        if (this._hls){
            this._hls.destroy();
            this._hls = null;
        }

        if (Hls.isSupported()){
            this._setupHls();
        }
        else{
            this._video.src = this._src;
        }

        //this._video.onplaying = this._video.onseeked = this._video.onseeking = () => {
        //    this.seekToHead()
        //}
    }

    _setupHls(){
        this._hls = new Hls();

        this._hls.on(Hls.Events.ERROR, (e, data) => {
            if (data.fatal) {
                this._hls.destroy();
                this._hls = null;

                if (data.details === 'manifestIncompatibleCodecsError') {
                    console.error(`HLS fatal error: incompatible codec`);
                } else if (data.response && data.response.code === 404) {
                    console.error(`HLS fatal error: stream unavailable`);
                } else {
                    console.error(`HLS fatal error: ${data.error}`);
                }

                setTimeout(() => {
                    this._setupHls();
                    this.play();
                }, 2000);
            }
            //else{
            //    console.error(`HLS error: ${data.error}`);
            //}
        });

        this._hls.on(Hls.Events.MEDIA_ATTACHED, () => {
            if (this._src){
                this._hls.loadSource(this._src);
                this._setupBitrateTracker();
            }
        });

        this._hls.attachMedia(this._video);
    }

    _setupBitrateTracker(){
        if (!this._hls){
            return;
        }

        const MAX_ITEMS = 50;

        let elem = this._root.getElementsByClassName('streamer-bandwidth')[0];
        let durations = [];
        let sizes = [];

        this._hls.on(Hls.Events.FRAG_LOADED, (_, data) => {
            durations.push(data.frag.duration)
            sizes.push(data.frag.stats.total*8);

            while (durations.length > MAX_ITEMS){
                durations.splice(0, 1);
                sizes.splice(0, 1);
            }

            let totalDuration = 0;
            let totalSize = 0;

            for (let i = 0; i < durations.length; i++){
                totalDuration += durations[i];
                totalSize += sizes[i];
            }

            let bitrate = totalSize / totalDuration
            elem.innerHTML = `${(bitrate / 1e6).toFixed(2)} Mb/s`;
        })
    }

    isPlaying(){
        return !this._video.paused;
    }

    play(){
        this._video.play();
        this.seekToHead();
    }

    pause(){
        this._video.pause();
    }

    seekToHead(){
        if (!this._video){
            return
        }

        if (this._video.paused){
            return
        }

        if (this._video.duration - this._video.currentTime > 5){
            this._video.currentTime = this._video.duration;
        }
    }

    updateSrc(src){
        this._src = src;
        this._setupStreamer();
    }

    updateTitle(title){
        this._root.getElementsByClassName('streamer-title')[0].innerHTML = title;
    }
}
