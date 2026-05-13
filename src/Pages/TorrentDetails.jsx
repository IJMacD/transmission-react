import { useEffect, useState } from 'react';
import { formatBytesPerSecond, formatBytes, formatDuration, countSeeds } from '../util';
import { Graph } from '../Components/Graph';
import Transmission from '../Transmission';
import { FileTreeList } from '../Components/FileTreeList';
import { useDataLog } from '../hooks/useDataLog';
import { ProgressGraph } from '../Components/ProgressGraph';
import PieceMap from '../Components/PieceMap';

/**
 *
 * @param {object} props
 * @param {Torrent} props.torrent
 * @param {import('../Transmission').default} props.transmission
 * @param {FileSystemMapping[]} props.pathMappings
 * @returns
 */
export function TorrentDetails({ torrent, transmission, pathMappings }) {
  const [ data, pushData ] = useDataLog();

  const [ downloadAverage, setDownloadAverage ] = useState(torrent ? torrent.rateDownload : NaN);
  const [ uploadAverage, setUploadAverage ] = useState(torrent ? torrent.rateUpload : NaN);

  const [ pieceHighlightRange, setPieceHighlightRange ] = useState(/** @type {[number, number]} */(null));

  useEffect(() => {
    if (torrent) {
      const uploadPercent = torrent.uploadRatio / torrent.seedRatioLimit;
      pushData(Date.now(), torrent.rateDownload, torrent.rateUpload, torrent.percentDone, uploadPercent);

      setDownloadAverage(downloadAverage => isNaN(downloadAverage) ? torrent.rateDownload : downloadAverage * 0.9 + torrent.rateDownload * 0.1);
      setUploadAverage(uploadAverage => isNaN(uploadAverage) ? torrent.rateUpload : uploadAverage * 0.9 + torrent.rateUpload * 0.1);
    }
  }, [torrent, pushData])

  if (!torrent)
    return null;

  function handleMove () {
    const location = prompt("Enter new location", torrent.downloadDir);

    if (location && location.length) {
      transmission.moveTorrent(torrent.id, location);
    }
  }

  function handleStop () {
    transmission.stopTorrent(torrent.id);
  }

  function handleStart () {
    transmission.startTorrent(torrent.id);
  }

  function handleRename (path) {
    const segs = path.replace(/\/$/, "").split("/");
    const oldName = segs[segs.length-1];
    const name = prompt("Enter new name:", oldName);
    if (name) {
      transmission.renameFile(torrent.id, path, name);
    }
  }

  function handleFileHoverStart (file) {
    let cumlSize = 0;
    for (const f of torrent.files) {
      if (file === f) break;
      cumlSize += f.length;
    }
    const firstPiece = Math.floor(cumlSize / torrent.pieceSize);
    const lastPiece = Math.floor((cumlSize + file.length) / torrent.pieceSize);
    setPieceHighlightRange([firstPiece, lastPiece]);
  }

  function handleFileHoverEnd (file) {
    setPieceHighlightRange(null);
  }

  function handleRemove (deleteFiles = false) {
    transmission.removeTorrent(torrent.id, deleteFiles);
  }

  const seedCount = countSeeds(torrent);

  const graphData = [
    ...data.slice(0, 3),
    movingAverage(data[1] || []),
    movingAverage(data[2] || []),
  ];

  const graphOptions = {
    horizontalGridlines: 500 * 1024,
    colour: ["#CFC","#FCC","#8D8","#D88"],
    style: ["area","area","line","line"],
  };

  const foundMapping = pathMappings.find(m => torrent.downloadDir.startsWith(m.base));
  const pathMapping = foundMapping ? foundMapping.path + torrent.downloadDir.substring(foundMapping.base.length) : null;

  // Only show relevant slice of data
  const downloadRecordedStatsEndIndex = data[3]?.indexOf(1);
  /** @type {[number[], number[]]} */
  const downloadRecordedStats = downloadRecordedStatsEndIndex < 0 ?
  // Incomplete
  [ data[0], data[3] ] :
  (
    // If we don't have  any real data (i.e. already complete)
    !downloadRecordedStatsEndIndex || downloadRecordedStatsEndIndex === 0 ?
      [[],[]] :
      [ data[0].slice(0, downloadRecordedStatsEndIndex), data[3].slice(0, downloadRecordedStatsEndIndex) ]
  );

  /** @type {[number[], number[]]} */
  const uploadRecordedStats = [ data[0], data[4] ];

  return (
    <div className="TorrentDetails">
      <div className="TorrentDetails-Header">
        <h2 className="TorrentDetails-Title">
          {torrent.name}
          <a className="TorrentDetails-MagnetLink" href={torrent.magnetLink} title="Open magnet link">🧲</a>
        </h2>
      </div>
      {
        torrent.status !== Transmission.STATUS_STOPPED &&
        <>
          <p className="TorrentDetails-LiveStats">⬇️ {formatBytesPerSecond(torrent.rateDownload)} (Avg: {formatBytesPerSecond(downloadAverage)}) ⬆️ {formatBytesPerSecond(torrent.rateUpload)} (Avg: {formatBytesPerSecond(uploadAverage)})</p>
          <div className="TorrentDetails-GraphPanel">
            <Graph data={graphData} options={graphOptions} />
          </div>
        </>
      }
      {
        downloadRecordedStats[0].length > 1 &&
          <div className="TorrentDetails-GraphPanel">
            <ProgressGraph data={downloadRecordedStats} startTime={torrent.addedDate * 1000} finalValueLabel={formatBytes(torrent.sizeWhenDone)} />
          </div>
      }
      {
        torrent.status === Transmission.STATUS_SEED && uploadRecordedStats.length > 0 &&
          <div className="TorrentDetails-GraphPanel">
            <ProgressGraph data={uploadRecordedStats} startTime={torrent.addedDate * 1000} color="#F44" finalValueLabel={formatBytes(torrent.seedRatioLimit * torrent.sizeWhenDone)} />
          </div>
      }
      <dl className="TorrentDetails-StatsList">
        <dt className="TorrentDetails-Label">Status</dt>
        <dd className="TorrentDetails-Value TorrentDetails-Value--status">
          { torrent.status === Transmission.STATUS_STOPPED && "STOPPED" }
          { torrent.status === Transmission.STATUS_CHECK_WAIT && "CHECK_WAIT" }
          { torrent.status === Transmission.STATUS_CHECK && "CHECK" }
          { torrent.status === Transmission.STATUS_DOWNLOAD_WAIT && "DOWNLOAD_WAIT" }
          { torrent.status === Transmission.STATUS_DOWNLOAD && "DOWNLOAD" }
          { torrent.status === Transmission.STATUS_SEED_WAIT && "SEED_WAIT" }
          { torrent.status === Transmission.STATUS_SEED && "SEED" }
          <span className="TorrentDetails-Actions">
            { torrent.status !== Transmission.STATUS_STOPPED && <button className="TorrentDetails-ActionButton" onClick={handleStop}>Stop</button> }
            { torrent.status === Transmission.STATUS_STOPPED && <button className="TorrentDetails-ActionButton" onClick={handleStart}>Start</button> }
            <button className="TorrentDetails-ActionButton" onClick={() => handleRemove()}>Remove</button>
            <button className="TorrentDetails-ActionButton TorrentDetails-ActionButton--danger" onClick={() => window.confirm("Are you sure you want to delete the files on disk?") && handleRemove(true)}>Delete Files</button>
          </span>
        </dd>
        <dt className="TorrentDetails-Label">Size</dt>
        <dd className="TorrentDetails-Value" title={`${torrent.sizeWhenDone} bytes`}>{formatBytes(torrent.sizeWhenDone)}</dd>
        {torrent.percentDone < 1 &&
          <>
            <dt className="TorrentDetails-Label">Downloaded</dt>
            <dd className="TorrentDetails-Value"><span title={`${torrent.downloadedEver} bytes`}>{formatBytes(torrent.downloadedEver)}</span> <span className="hint">{(100 * torrent.percentDone).toFixed(1)}%</span> (<span title={`${torrent.leftUntilDone} bytes`}>{formatBytes(torrent.leftUntilDone)} remaining</span> <span className="hint">{(100 * torrent.desiredAvailable / torrent.leftUntilDone).toFixed(1)}% available</span>)</dd>
          </>}
        <dt className="TorrentDetails-Label">Added</dt>
        <dd className="TorrentDetails-Value">{new Date(torrent.addedDate * 1000).toISOString()}</dd>
        {torrent.doneDate > 0 &&
          <>
            <dt className="TorrentDetails-Label">Finished</dt>
            <dd className="TorrentDetails-Value">{new Date(torrent.doneDate * 1000).toISOString()}</dd>
          </>}
        <dt className="TorrentDetails-Label">Duration</dt>
        <dd className="TorrentDetails-Value">{formatDuration(torrent.secondsDownloading)}</dd>
        <dt className="TorrentDetails-Label">Location</dt>
        <dd className="TorrentDetails-Value">{torrent.downloadDir} <button className="TorrentDetails-ActionButton" onClick={handleMove}>Move</button></dd>
        {
          torrent.desiredAvailable > 0 && downloadAverage > 0 &&
          <>
            <dt className="TorrentDetails-Label">ETA</dt>
            <dd className="TorrentDetails-Value">{new Date(Date.now() + (torrent.desiredAvailable / downloadAverage) * 1000).toISOString()} <span className="hint">in {formatDuration(torrent.desiredAvailable / downloadAverage)}</span></dd>
          </>
        }
        {
          torrent.percentDone < 1 &&
          <>
            <dt className="TorrentDetails-Label">Current Speed</dt>
            <dd className="TorrentDetails-Value">{formatBytesPerSecond(torrent.rateDownload)}</dd>
          </>
        }
        <dt className="TorrentDetails-Label">Average Speed</dt>
        <dd className="TorrentDetails-Value">{formatBytesPerSecond(torrent.downloadedEver / torrent.secondsDownloading)}</dd>
        {
        downloadAverage > 0 &&
          <>
            <dt className="TorrentDetails-Label">Recent Average Speed</dt>
            <dd className="TorrentDetails-Value">{formatBytesPerSecond(downloadAverage)}</dd>
          </>
        }
        {
        torrent.rateUpload > 0 &&
          <>
            <dt className="TorrentDetails-Label">Upload Speed</dt>
            <dd className="TorrentDetails-Value">{formatBytesPerSecond(torrent.rateUpload)}</dd>
          </>
        }
        {
        downloadAverage > 0 &&
          <>
            <dt className="TorrentDetails-Label">Recent Average Upload Speed</dt>
            <dd className="TorrentDetails-Value">{formatBytesPerSecond(uploadAverage)}</dd>
          </>
        }
        <dt className="TorrentDetails-Label">Uploaded</dt>
        <dd className="TorrentDetails-Value">
          {formatBytes(torrent.uploadedEver)} <span className="hint">({torrent.uploadRatio.toFixed(2)})</span>
          {torrent.seedRatioLimit > torrent.uploadRatio && <> [Limit: {formatBytes(torrent.seedRatioLimit * torrent.sizeWhenDone)} <span className="hint">({torrent.seedRatioLimit})</span>]</>}
        </dd>
        <dt className="TorrentDetails-Label">Seeds</dt>
        <dd className="TorrentDetails-Value">{seedCount}</dd>
        { torrent.peers.length > 0 &&
          <>
            <dt className="TorrentDetails-Label">Peers</dt>
            <dd className="TorrentDetails-Value">
              <PeerIcons peers={torrent.peers} />
            </dd>
          </>
        }
        <dt className="TorrentDetails-Label">Available</dt>
        <dd className="TorrentDetails-Value">
          { (100 * (torrent.desiredAvailable + torrent.downloadedEver) / torrent.sizeWhenDone).toFixed() }%
        </dd>
        <dt className="TorrentDetails-Label">Pieces</dt>
        <dd className="TorrentDetails-Value">{torrent.pieceCount} × {formatBytes(torrent.pieceSize)}</dd>
        { torrent.files &&
          <>
            <dt className="TorrentDetails-Label">Files</dt>
            <dd className="TorrentDetails-Value TorrentDetails-FilesPanel" style={{maxHeight:"50vh",overflowY:"auto"}}>
              <FileTreeList files={torrent.files} onRenameClick={handleRename} pathMapping={pathMapping} onHoverStart={handleFileHoverStart} onHoverEnd={handleFileHoverEnd} />
            </dd>
          </>
        }
      </dl>
      { torrent.pieces && <div className="TorrentDetails-PieceMapPanel"><PieceMap pieces={torrent.pieces} count={torrent.pieceCount} highlightRange={pieceHighlightRange} /></div> }
    </div>
  );
}

export function PeerIcons ({ peers }) {
    return (
      <div className="PeerIcons">
        {
          peers.map(p => {
            const isSeed = p.progress === 1;
            const transferring = p.rateToClient > 0 || p.rateToPeer > 0;
            const className = `PeerIcons-Icon ${isSeed?"PeerIcons-Icon--seed":"PeerIcons-Icon--peer"} ${p.isDownloadingFrom?"PeerIcons-Icon--downloading":""} ${p.isUploadingTo?"PeerIcons-Icon--uploading":""} ${transferring?"":"PeerIcons-Icon--stalled"}`;
            return <div key={`${p.address}/${p.port}`} className={className} title={`[${p.address}]:${p.port} ${(100*p.progress).toFixed(1)}%\n⬇️ ${formatBytesPerSecond(p.rateToClient)}\n⬆️ ${formatBytesPerSecond(p.rateToPeer)}`} />;
          })
        }
      </div>
    )
}

/**
 *
 * @param {number[]} values
 */
function movingAverage (values) {
  return values.map((v, i, vs) => {
    if (i < 4) return v;
    return (vs[i - 4] + vs[i - 3] + vs[i - 2] + vs[i - 1] + vs[i]) / 5;
  });
}