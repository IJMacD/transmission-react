import { formatBytesPerSecond, formatBytes, formatDuration, countSeeds } from './util';
import { useGraph } from './useGraph';
import { useEffect, useState } from 'react';

/**
 *
 * @param {object} props
 * @param {object} props.torrent
 * @param {import('./Transmission').default} props.transmission
 * @returns
 */
export function TorrentDetails({ torrent, transmission }) {
  const [ canvasRef, pushData ] = useGraph({
    horizontalGridlines: 500 * 1024,
    colour: ["#CFC","#FCC","#8D8","#D88"],
    style: ["area","area","line","line"],
  });
  const [ downloadAverage, setDownloadAverage ] = useState(torrent ? torrent.rateDownload : 0);
  const [ uploadAverage, setUploadAverage ] = useState(torrent ? torrent.rateUpload : 0);

  useEffect(() => {
    if (torrent) {
        pushData(torrent.rateDownload, torrent.rateUpload, downloadAverage, uploadAverage);
        setDownloadAverage(downloadAverage => downloadAverage * 0.9 + torrent.rateDownload * 0.1);
        setUploadAverage(uploadAverage => uploadAverage * 0.9 + torrent.rateUpload * 0.1);
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

  const seedCount = countSeeds(torrent);

  return (
    <div>
      <h2>{torrent.name} <a href={torrent.magnetLink} style={{fontSize:"0.5em",textDecoration:"none"}}>🧲</a></h2>
      <canvas ref={canvasRef} />
      <dl>
        <dt>Size</dt>
        <dd title={`${torrent.sizeWhenDone} bytes`}>{formatBytes(torrent.sizeWhenDone)}</dd>
        {torrent.percentDone < 1 &&
          <>
            <dt>Downloaded</dt>
            <dd><span title={`${torrent.downloadedEver} bytes`}>{formatBytes(torrent.downloadedEver)}</span> <span className="hint">{(100 * torrent.percentDone).toFixed(1)}%</span> (<span title={`${torrent.leftUntilDone} bytes`}>{formatBytes(torrent.leftUntilDone)} remaining</span> <span className="hint">{(100 * torrent.desiredAvailable / torrent.leftUntilDone).toFixed(1)}% available</span>)</dd>
          </>}
        <dt>Added</dt>
        <dd>{new Date(torrent.addedDate * 1000).toISOString()}</dd>
        {torrent.doneDate > 0 &&
          <>
            <dt>Finished</dt>
            <dd>{new Date(torrent.doneDate * 1000).toISOString()}</dd>
          </>}
        <dt>Duration</dt>
        <dd>{formatDuration(torrent.secondsDownloading)}</dd>
        <dt>Location</dt>
        <dd>{torrent.downloadDir} <button onClick={handleMove}>Move</button></dd>
        {
          torrent.desiredAvailable > 0 && downloadAverage > 0 &&
          <>
            <dt>ETA</dt>
            <dd>{new Date(Date.now() + (torrent.desiredAvailable / downloadAverage) * 1000).toISOString()} <span className="hint">in {formatDuration(torrent.desiredAvailable / downloadAverage)}</span></dd>
          </>
        }
        {torrent.rateDownload > 0 &&
          <>
            <dt>Current Speed</dt>
            <dd>{formatBytesPerSecond(torrent.rateDownload)}</dd>
          </>}
        <dt>Average Speed</dt>
        <dd>{formatBytesPerSecond(torrent.downloadedEver / torrent.secondsDownloading)}</dd>
        {
        downloadAverage > 0 &&
          <>
            <dt>Recent Average Speed</dt>
            <dd>{formatBytesPerSecond(downloadAverage)}</dd>
          </>
        }
        {
        torrent.rateUpload > 0 &&
          <>
            <dt>Upload Speed</dt>
            <dd>{formatBytesPerSecond(torrent.rateUpload)}</dd>
          </>
        }
        {
        downloadAverage > 0 &&
          <>
            <dt>Recent Average Upload Speed</dt>
            <dd>{formatBytesPerSecond(uploadAverage)}</dd>
          </>
        }
        <dt>Uploaded</dt>
        <dd>
          {formatBytes(torrent.uploadedEver)} <span className="hint">({torrent.uploadRatio})</span>
          {torrent.seedRatioLimit > torrent.uploadRatio && <> [{formatBytes(torrent.seedRatioLimit * torrent.sizeWhenDone)} <span className="hint">({torrent.seedRatioLimit})</span>]</>}
        </dd>
        <dt>Seeds</dt>
        <dd>{seedCount}</dd>
        {torrent.peers.length > 0 &&
          <>
            <dt>Peers</dt>
            <dd>
              <PeerIcons peers={torrent.peers} />
            </dd>
          </>}
        <dt>Pieces</dt>
        <dd>{torrent.pieceCount} × {formatBytes(torrent.pieceSize)}</dd>
      </dl>
      <PieceMap pieces={torrent.pieces} count={torrent.pieceCount} />
    </div>
  );
}

export function PieceMap ({ pieces, count }) {
    return (
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {
          [...Array(count)].map((_,i) => <div key={i} title={`Piece ${i}`} className={`PieceMap-Piece ${isPieceDone(pieces, i)?`PieceMap-Piece--done`:""}`} />)
        }
      </div>
    );
}

function isPieceDone (pieces, i) {
    const byteString = atob(pieces);
    const byteIndex = Math.floor(i / 8);
    const byteVal = byteString.charCodeAt(byteIndex);
    return (byteVal & (128 >> (i % 8))) > 0;
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