export interface Torrent {
    activityDate: number; // 1653403894,
    addedDate: number; // 1653403317,
    bandwidthPriority: number; // 0,
    comment: string; // "",
    corruptEver: number; // 0,
    creator: string; // "",
    dateCreated: number; // 0,
    desiredAvailable: number; // 694173696,
    doneDate: number; // 0,
    downloadDir: string; // "/mnt/volume2/Download",
    downloadLimit: number; // 100,
    downloadLimited: boolean; // false,
    downloadedEver: number; // 349226610,
    editDate: number; // 1653403325,
    error: number; // 0,
    errorString: string; // "",
    eta: number; // 1686,
    etaIdle: number; // -1,
    ['file-count']: number; // 0,
    fileStats: any[]; // "[{…}, {…}]",
    files: any[]; // "[{…}, {…}]",
    hashString: string; // "3533dfedf9586830266acdd1058ab3a42fe92642",
    haveUnchecked: number; // 2605056,
    haveValid: number; // 345186464,
    honorsSessionLimits: boolean; // true,
    id: number; // 36,
    isFinished: boolean; // false,
    isPrivate: boolean; // false,
    isStalled: boolean; // false,
    labels: any[]; // "[]",
    leftUntilDone: number; // 694173696,
    magnetLink: string; // "magnet:?xt=urn:btih:3533dfedf9586830266acdd1058ab3a42fe92642&dn=The.Blues.Brothers.1980.EXTENDED.720p.BluRay.999MB.HQ.x265.10bit-GalaxyRG%5BTGx%5D&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.cyberia.is%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.iamhansen.xyz%3A2000%2Fannounce&tr=udp%3A%2F%2Fp4p.arenabg.com%3A1337%2Fannounce&tr=udp%3A%2F%2Fexplodie.org%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrac...",
    manualAnnounceTime: number; // -1,
    maxConnectedPeers: number; // 50,
    metadataPercentComplete: number; // 1,
    name: string; // "The.Blues.Brothers.1980.EXTENDED.720p.BluRay.999MB.HQ.x265.10bit-GalaxyRG[TGx]",
    ['peer-limit']: number; // 50,
    peers: any[]; // "[{…}, {…}, {…}, {…}, {…}, {…}]",
    peersConnected: number; // 6,
    peersFrom: object; // "{fromCache: 0, fromDht: 0, fromIncoming: 0, fromLpd…}",
    peersGettingFromUs: number; // 1,
    peersSendingToUs: number; // 5,
    percentDone: number; // 0.3337,
    pieceCount: number; // 1988,
    pieceSize: number; // 524288,
    pieces: string; // "kAAAdAU9Qlig2QKGO4HVaW4oAcACoaS1EADqSCg2kIGpWceNQwS/AAlxigEjDJUCBF8MQglmCQIaQcsJIBMBgwGhLQuUIO1/VQAiAjAiqBDcCTCJkYm2HhDZgBAgQskOGBDTAEBjIQhD3vtFCIBeHaYloJeFyQCQUkAxDgfAqIJIYoYURQCH5HpDmapEopCRQRApghE0AgSATAMJQBEIBubDELcEsFhlByJIHSymECPAFmQ6aBaiQIc5sGEiyAXYGdEQLphBBUqFhBShaAwlOgCx/g4ISE0AUIX4kAMiQWAwIXGAgCYYkA5gAGjKiBChlgEgyyIhAAEQ",
    ['primary-mime-type']: number; // 0,
    priorities: number[]; // "[0, 0]",
    queuePosition: number; // 31,
    rateDownload: number; // 411000,
    rateUpload: number; // 41000,
    recheckProgress: number; // 0,
    secondsDownloading: number; // 643,
    secondsSeeding: number; // 0,
    seedIdleLimit: number; // 30,
    seedIdleMode: number; // 0,
    seedRatioLimit: number; // 2,
    seedRatioMode: number; // 0,
    sizeWhenDone: number; // 1041965216,
    startDate: number; // 1653403326,
    status: number; // 4,
    torrentFile: string; // "/var/lib/transmission-daemon/.config/transmission-daemon/torrents/3533dfedf9586830266acdd1058ab3a42fe92642.torrent",
    totalSize: number; // 1041965216,
    trackerStats: any[]; // "[{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, …]",
    trackers: any[]; // "[{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, …]",
    uploadLimit: number; // 100,
    uploadLimited: boolean; // false,
    uploadRatio: number; // 0.017,
    uploadedEver: number; // 5947841,
    wanted: number[]; // "[1, 1]",
    webseeds: any[]; // "[]",
    webseedsSendingToUs: number; // 0
}

interface TorrentFile {
    bytesCompleted: number; // 59,
    length: number; // 59,
    name: string; // "Final Destination 3 (2006)/Other/AhaShare.com.txt"
}

interface FileSystemMapping {
    base: string;
    path: string;
}

interface SearchResult {
    name: string;
    link: string;
    magnet: string;
    size: number;
    seeds: number;
    leeches: number;
}