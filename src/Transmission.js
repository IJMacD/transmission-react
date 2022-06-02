
/**
 * @typedef {{ids: number[];listener?: (value: any) => any;active: boolean;notify: () => void;intervalID: number;}} NotifyInfo
 */

export default class Transmission {
    sessionId = null;

    static STATUS_STOPPED        = 0; /* Torrent is stopped */
    static STATUS_CHECK_WAIT     = 1; /* Queued to check files */
    static STATUS_CHECK          = 2; /* Checking files */
    static STATUS_DOWNLOAD_WAIT  = 3; /* Queued to download */
    static STATUS_DOWNLOAD       = 4; /* Downloading */
    static STATUS_SEED_WAIT      = 5; /* Queued to seed */
    static STATUS_SEED           = 6; /* Seeding */

    constructor (API_ROOT) {
        this.API_ROOT = API_ROOT;

        /** @type {NotifyInfo[]} */
        this._torrentListeners = [];
    }

    /**
     * @param {number} id
     * @param {(value: any) => any} listener
     * @param {number} [interval]
     */
    addTorrentListener (id, listener, interval = 10 * 1000) {
        const info = {
            ids: [id],
            listener,
            active: true,
            notify: null,
            intervalID: null,
        };

        info.notify = () => this.getTorrentDetails([id]).then(data => info.active && listener(data), console.error);
        info.intervalID = setInterval(info.notify, interval);

        this._torrentListeners.push(info);

        info.notify();
    }

    /**
     * @param {number[]} ids
     * @param {(value: any) => any} listener
     * @param {number} [interval]
     */
    addMultipleTorrentListener (ids, listener, interval = 10 * 1000) {
        const info = {
            ids,
            listener,
            active: true,
            notify: null,
            intervalID: null,
        };

        info.notify = () => this.getTorrentDetails(ids).then(data => info.active && listener(data), console.error);
        info.intervalID = setInterval(info.notify, interval);

        this._torrentListeners.push(info);

        info.notify();
    }

    /**
     * @param {number} id
     * @param {(value: any) => any} listener
     */
    removeTorrentListener (id, listener) {
        this._torrentListeners.filter(i => i.ids.includes(id) && i.listener === listener).forEach(i => { clearInterval(i.intervalID); i.active = false; });
        this._torrentListeners = this._torrentListeners.filter(i => !i.ids.includes(id) || i.listener !== listener);
    }

    /**
     * @param {number[]} ids
     * @param {(value: any) => any} listener
     */
    removeMultipleTorrentListener (ids, listener) {
        this._torrentListeners.filter(i => i.ids.every(nid => ids.includes(nid)) && i.listener === listener).forEach(i => { clearInterval(i.intervalID); i.active = false; });
        this._torrentListeners = this._torrentListeners.filter(i => !i.ids.every(nid => ids.includes(nid)) || i.listener !== listener);
    }

    /**
     * @param {string | number | number[]} ids
     */
    notifyTorrents (ids) {
        if (typeof ids === "string") {
            // TODO
            return;
        }

        if (typeof ids === "number") {
            ids = [ids];
        }

        for (const id of ids) {
            this._torrentListeners.forEach(i => {
                if (i.ids.includes(id)) {
                    i.notify();
                }
            });
        }
    }

    async rpc (data, retry = 2) {
        if (retry <= 0) {
            throw Error("Too many retries");
        }

        const headers = {
            "Content-Type": "application/json",
        };

        if (this.sessionId) {
            headers["X-Transmission-Session-Id"] = this.sessionId;
        }

        const res = await fetch(this.API_ROOT, {
            method: "post",
            headers,
            body: JSON.stringify(data),
            credentials: "include",
        });

        if (res.status === 409) {
            this.sessionId = res.headers.get("x-transmission-session-id");

            if (!this.sessionId) {
                throw Error("Couldn't retrieve Transmission Session ID");
            }

            return this.rpc(data, retry - 1);
        }

        if (res.status === 401) {
            throw Error("Authorization needed");
        }

        if (res.ok) {
            return res.json();
        }

        throw Error(res.statusText);
    }

    async getTorrents () {
        const res = await this.rpc({
            method: "torrent-get",
            arguments: {
                fields: [
                    "activityDate",
                    "addedDate",
                    "bandwidthPriority",
                    "comment",
                    "corruptEver",
                    "creator",
                    "dateCreated",
                    "desiredAvailable",
                    "doneDate",
                    "downloadDir",
                    "downloadedEver",
                    "downloadLimit",
                    "downloadLimited",
                    "editDate",
                    "error",
                    "errorString",
                    "eta",
                    "etaIdle",
                    "file-count",
                    "hashString",
                    "haveUnchecked",
                    "haveValid",
                    "honorsSessionLimits",
                    "id",
                    "isFinished",
                    "isPrivate",
                    "isStalled",
                    "leftUntilDone",
                    "magnetLink",
                    "manualAnnounceTime",
                    "maxConnectedPeers",
                    "metadataPercentComplete",
                    "name",
                    "peer-limit",
                    "peers",
                    "peersConnected",
                    "peersGettingFromUs",
                    "peersSendingToUs",
                    "percentDone",
                    "pieceCount",
                    "pieceSize",
                    "primary-mime-type",
                    "queuePosition",
                    "rateDownload",
                    "rateUpload",
                    "recheckProgress",
                    "secondsDownloading",
                    "secondsSeeding",
                    "seedIdleLimit",
                    "seedIdleMode",
                    "seedRatioLimit",
                    "seedRatioMode",
                    "sizeWhenDone",
                    "startDate",
                    "status",
                    "totalSize",
                    "torrentFile",
                    "trackerStats",
                    "uploadedEver",
                    "uploadLimit",
                    "uploadLimited",
                    "uploadRatio",
                    "webseedsSendingToUs",
                ]
            }
        });

        return res.arguments.torrents;
    }

    /**
     * @param {number[]} ids
     */
    async getTorrentDetails (ids) {
        const res = await this.rpc({
            method: "torrent-get",
            arguments: {
                ids,
                fields: [
                    "activityDate",
                    "addedDate",
                    "bandwidthPriority",
                    "comment",
                    "corruptEver",
                    "creator",
                    "dateCreated",
                    "desiredAvailable",
                    "doneDate",
                    "downloadDir",
                    "downloadedEver",
                    "downloadLimit",
                    "downloadLimited",
                    "editDate",
                    "error",
                    "errorString",
                    "eta",
                    "etaIdle",
                    "file-count",
                    "files",
                    "fileStats",
                    "hashString",
                    "haveUnchecked",
                    "haveValid",
                    "honorsSessionLimits",
                    "id",
                    "isFinished",
                    "isPrivate",
                    "isStalled",
                    "labels",
                    "leftUntilDone",
                    "magnetLink",
                    "manualAnnounceTime",
                    "maxConnectedPeers",
                    "metadataPercentComplete",
                    "name",
                    "peer-limit",
                    "peers",
                    "peersConnected",
                    "peersFrom",
                    "peersGettingFromUs",
                    "peersSendingToUs",
                    "percentDone",
                    "pieces",
                    "pieceCount",
                    "pieceSize",
                    "priorities",
                    "primary-mime-type",
                    "queuePosition",
                    "rateDownload",
                    "rateUpload",
                    "recheckProgress",
                    "secondsDownloading",
                    "secondsSeeding",
                    "seedIdleLimit",
                    "seedIdleMode",
                    "seedRatioLimit",
                    "seedRatioMode",
                    "sizeWhenDone",
                    "startDate",
                    "status",
                    "trackers",
                    "trackerStats",
                    "totalSize",
                    "torrentFile",
                    "uploadedEver",
                    "uploadLimit",
                    "uploadLimited",
                    "uploadRatio",
                    "wanted",
                    "webseeds",
                    "webseedsSendingToUs",
                ]
            }
        });

        return res.arguments.torrents;
    }

    async getSession () {
        const res = await this.rpc({
            method: "session-get",
            arguments: {
                fields: [
                    "alt-speed-down",
                    "alt-speed-enabled",
                    "alt-speed-time-begin",
                    "alt-speed-time-enabled",
                    "alt-speed-time-end",
                    "alt-speed-time-day",
                    "alt-speed-up",
                    "blocklist-url",
                    "blocklist-enabled",
                    "blocklist-size",
                    "cache-size-mb",
                    "config-dir",
                    "download-dir",
                    "download-queue-size",
                    "download-queue-enabled",
                    "dht-enabled",
                    "encryption",
                    "idle-seeding-limit",
                    "idle-seeding-limit-enabled",
                    "incomplete-dir",
                    "incomplete-dir-enabled",
                    "lpd-enabled",
                    "peer-limit-global",
                    "peer-limit-per-torrent",
                    "pex-enabled",
                    "peer-port",
                    "peer-port-random-on-start",
                    "port-forwarding-enabled",
                    "queue-stalled-enabled",
                    "queue-stalled-minutes",
                    "rename-partial-files",
                    "rpc-version",
                    "rpc-version-minimum",
                    "script-torrent-done-filename",
                    "script-torrent-done-enabled",
                    "seedRatioLimit",
                    "seedRatioLimited",
                    "seed-queue-size",
                    "seed-queue-enabled",
                    "speed-limit-down",
                    "speed-limit-down-enabled",
                    "speed-limit-up",
                    "speed-limit-up-enabled",
                    "start-added-torrents",
                    "trash-original-torrent-files",
                    "units",
                    "utp-enabled",
                    "version",
                ]
            }
        });

        return res.arguments;
    }

    /**
     * @param {number|number[]} ids
     */
    startTorrent (ids) {
        return this.rpc({ method: "torrent-start", arguments: { ids } }).then(() => this.notifyTorrents(ids));
    }

    /**
     * @param {number|number[]} ids
     */
    stopTorrent (ids) {
        return this.rpc({ method: "torrent-stop", arguments: { ids } }).then(() => this.notifyTorrents(ids));
    }

    /**
     * Add local or remote Torrent file, or magnet link
     * @param {string} filename
     */
    addLink (filename) {
        return this.rpc({ method: "torrent-add", arguments: { filename }});
    }

    /**
     * Alias for addLink
     * (Backwards compat)
     * @param {string} filename
     */
    addMagnet (filename) {
        return this.addLink(filename);
    }

    /**
     * @param {number|string} ids
     * @param {string} location
     */
    moveTorrent (ids, location) {
        const move = true;
        return this.rpc({ method: "torrent-set-location", arguments: { ids, location, move }}).then(() => this.notifyTorrents(ids));
    }

    /**
     * @param {number|string} ids
     * @param {string} path
     * @param {string} name
     */
    renameFile (ids, path, name) {
        return this.rpc({ method: "torrent-rename-path", arguments: { ids, path, name }}).then(() => this.notifyTorrents(ids));
    }

    /**
     * @param {string} name
     * @param {any} value
     */
    setSession (name, value) {
        return this.rpc({ method: "session-set", arguments: { [name]: value } });
    }


    /**
     * @param {number|string} ids
     * @param {boolean} [deleteFiles]
     */
    removeTorrent (ids, deleteFiles = false) {
        return this.rpc({ method: "torrent-remove", arguments: { ids, "delete-local-data": deleteFiles } });
    }
}
