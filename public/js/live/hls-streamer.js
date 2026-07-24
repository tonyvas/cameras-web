class Streamer{
    constructor(rootElement){
        this._root = rootElement;
        this._video = rootElement.getElementsByTagName('video')[0];
        
        this._hls = null;
        this._src = 'data-src' in this._video.attributes ? this._video.attributes['data-src'].value : null;

        this._setupStreamer();
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
    }

    _setupHls(){
        this._hls = new Hls({ maxLiveSyncPlaybackRate: 1.5 });

        this._hls.on(Hls.Events.ERROR, (e, data) => {
            if (data.fatal) {
                this._hls.destroy();
                this._hls = null;

                if (data.details === 'manifestIncompatibleCodecsError') {
                    console.error(`[${this._src}] HLS fatal error: incompatible codec`);
                } else if (data.response && data.response.code === 404) {
                    console.error(`[${this._src}] HLS fatal error: stream unavailable`);
                } else {
                    console.error(`[${this._src}] HLS fatal error: ${data.error}`);
                }

                setTimeout(() => {
                    this._setupHls();
                }, 2000);
            }
            // else{
            //    console.error(`[${this._src}] HLS error: ${data.error}`);
            // }
        });

        this._hls.on(Hls.Events.MEDIA_ATTACHED, () => {
            if (this._src){
                this._hls.loadSource(this._src);
                this._setupBitrateTracker();
            }
        });

        this._hls.on(Hls.Events.MANIFEST_LOADED, () => {
            this.play();
        })

        this._video.onplay = () => {
            // this.seekToHead();
            this._video.currentTime = this._hls.liveSyncPosition;
        }

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
        return this._src && !this._video.paused;
    }

    play(){
        this._video.play();
    }

    pause(){
        this._video.pause();
    }

    seekToHead(){
        if (!this._video){
            return;
        }

        if (!this.isPlaying()){
            return;
        }

        if (this._hls.liveSyncPosition - this._video.currentTime > 5){
            this._video.currentTime = this._hls.liveSyncPosition;
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
