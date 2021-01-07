export default class Transmission {
    sessionId = null;

    constructor (API_ROOT) {
        this.API_ROOT = API_ROOT;
    }

    async rpc (data, retry = 2) {
        if (retry <= 0) {
            throw Error("Too many retries");
        }

        const headers = {
            "Authorization": "Basic  ",
            "Content-Type": "application/json",
        };

        if (this.sessionId) {
            headers["X-Transmission-Session-Id"] = this.sessionId;
        }

        const res = await fetch(`${this.API_ROOT}/rpc`, {
            method: "post",
            headers,
            body: JSON.stringify(data),
        });

        if (res.status === 409) {
            this.sessionId = res.headers.get("x-transmission-session-id");

            return this.rpc(data, retry - 1);
        }

        return res.json();
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

    async getTorrent (id) {
        const res = await this.rpc({
            method: "torrent-get",
            arguments: {
                ids: [id],
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

        return res.arguments.torrents[0];
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
}