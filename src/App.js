import { useEffect, useRef, useState } from 'react';
import './App.css';
import Transmission from "./Transmission";
import { useGraph } from './useGraph';

function App() {
  const [torrents, setTorrents] = useState([]);
  const tmRef = useRef(new Transmission(process.env.REACT_APP_API_ROOT));
  const [ canvasRef, pushData ] = useGraph({
    horizontalGridlines: 500 * 1024,
    colour: ["#CFC","#FCC","#5F5","#F55"],
    style: ["area","area","line","line"],
  });
  const [ selectedTorrent, setSelectedTorrent ] = useState(-1);
  const [ torrentData, setTorrentData ] = useState(null);
  const downloadAverage = useRef(0);
  const uploadAverage = useRef(0);

  useEffect(() => {
    const run = () => {
      const tm = tmRef.current;
      tm.getTorrents().then(setTorrents);
    };
    const id = setInterval(run, 10 * 1000);
    run();

    tmRef.current.getSession().then(console.log);

    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const activeTorrents = torrents.filter(isActive);

    const totalDown = activeTorrents.reduce((total,torrent) => total + torrent.rateDownload, 0);
    const totalUp = activeTorrents.reduce((total,torrent) => total + torrent.rateUpload, 0);

    downloadAverage.current = downloadAverage.current * 0.9 + totalDown * 0.1;
    uploadAverage.current = uploadAverage.current * 0.9 + totalUp * 0.1;

    pushData(totalDown, totalUp, downloadAverage.current, uploadAverage.current);
  }, [torrents, pushData]);

  useEffect(() => {
    if (selectedTorrent >= 0) {
      const run = () => {
        const tm = tmRef.current;
        tm.getTorrent(selectedTorrent).then(setTorrentData);
      };
      const id = setInterval(run, 10 * 1000);
      run();

      return () => clearInterval(id);
    } else {
      setTorrentData(null);
    }
  }, [selectedTorrent]);

  const activeTorrents = torrents.filter(isActive);
  const inactiveUnfinishedTorrents = torrents.filter(t => !isActive(t) && t.percentDone < 1);
  const inactiveFinishedTorrents = torrents.filter(t => !isActive(t) && t.percentDone === 1);

  const totalDown = activeTorrents.reduce((total,torrent) => total + torrent.rateDownload, 0);
  const totalUp = activeTorrents.reduce((total,torrent) => total + torrent.rateUpload, 0);

  return (
    <div className="App">
      <h1>{torrents.length} torrents</h1>
      <p>⬇️ {formatBytesPerSecond(totalDown)} ({formatBytesPerSecond(downloadAverage.current)}) ⬆️ {formatBytesPerSecond(totalUp)} ({formatBytesPerSecond(uploadAverage.current)})</p>
      <canvas ref={canvasRef} />
      {
        selectedTorrent >= 0 ?
          <>
            <button onClick={() => setSelectedTorrent(-1)}>Back</button>
            <TorrentDetails torrent={torrentData} />
          </>
          :
          <>
            <h2>Active ({activeTorrents.length})</h2>
            <TorrentTable torrents={sortBy(activeTorrents, "uploadedEver", true)} onTorrentClick={setSelectedTorrent} />
            <h2>Inactive and Unfinished ({inactiveUnfinishedTorrents.length})</h2>
            <TorrentList torrents={sortBy(inactiveUnfinishedTorrents, "percentDone", true)} onTorrentClick={setSelectedTorrent} />
            <h2>Inactive and Finished ({inactiveFinishedTorrents.length})</h2>
            <TorrentList torrents={sortBy(inactiveFinishedTorrents, "name")} onTorrentClick={setSelectedTorrent} />
          </>
      }
    </div>
  );
}

export default App;

function isActive (torrent) {
  return torrent.rateDownload > 0 || torrent.rateUpload > 0;
}

function TorrentList ({ torrents, onTorrentClick }) {
  return <ul>
    {
      torrents.map(t => <li key={t.id} onClick={() => onTorrentClick(t.id)}><TorrentEntry {...t} /></li>)
    }
  </ul>;
}

function TorrentEntry ({ isFinished, name, rateDownload, rateUpload, percentDone }) {
  return (
    <div style={{ color: isFinished ? "#999" : "#333" }}>
      {name}{' '}
      { rateDownload > 0 && <span>⬇️ {formatBytesPerSecond(rateDownload)}</span> }
      { rateUpload > 0 && <span>⬆️ {formatBytesPerSecond(rateUpload)}</span> }
      { percentDone < 1 && <span className="hint">{(percentDone*100).toFixed(1)}%</span> }
    </div>
  );
}

function formatBytes (n) {
  if (n >= 1024 * 1024 * 1024) return `${(n/(1024 * 1024 * 1024)).toFixed(3)} GB`;
  if (n >= 1024 * 1024) return `${(n/(1024 * 1024)).toFixed(3)} MB`;
  return `${(n/1024).toFixed(3)} kB`;
}

function formatBytesPerSecond (n) {
  return formatBytes(n) + "/s";
}

function TorrentTable ({ torrents, onTorrentClick }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Download Speed</th>
          <th>Upload Speed</th>
          <th>Peers</th>
          <th>Uploaded</th>
        </tr>
      </thead>
      <tbody>
        {
          torrents.map(t => (
            <tr key={t.id} onClick={() => onTorrentClick(t.id)}>
              <td>{t.name}</td>
              <td>{t.rateDownload > 0 && formatBytesPerSecond(t.rateDownload)}</td>
              <td>{t.rateUpload > 0 && formatBytesPerSecond(t.rateUpload)}</td>
              <td>{t.peersGettingFromUs+t.peersSendingToUs}</td>
              <td>
                {formatBytes(t.uploadedEver)} <span className="hint">({t.uploadRatio})</span>
                {t.seedRatioLimit > t.uploadRatio && <> [{formatBytes(t.seedRatioLimit * t.sizeWhenDone)} <span className="hint">({t.seedRatioLimit})</span>]</>}
              </td>
            </tr>
          ))
        }
      </tbody>
    </table>
  );
}

function sortBy (array, field, desc=false) {
  const sorter = (array.length && typeof array[0][field] === "string") ?
    (a,b) => (desc ? -1 : 1) * (a[field].localeCompare(b[field]))
    :
    (a,b) => (desc ? -1 : 1) * (a[field] - b[field]);

  return array.sort(sorter);
}

function TorrentDetails ({ torrent }) {
  if (!torrent) return null;

  return (
    <div>
      <h2>{torrent.name}</h2>
      <dl>
        <dt>Size</dt>
        <dd title={`${torrent.sizeWhenDone} bytes`}>{formatBytes(torrent.sizeWhenDone)}</dd>
        {
          torrent.percentDone < 1 &&
          <>
            <dt>Downloaded</dt>
            <dd><span title={`${torrent.downloadedEver} bytes`}>{formatBytes(torrent.downloadedEver)}</span> <span className="hint">{(100*torrent.percentDone).toFixed(1)}%</span> (<span title={`${torrent.leftUntilDone} bytes`}>{formatBytes(torrent.leftUntilDone)} remaining</span> <span className="hint">{(100 * torrent.desiredAvailable / torrent.leftUntilDone).toFixed(1)}% available</span>)</dd>
          </>
        }
        <dt>Added</dt>
        <dd>{new Date(torrent.addedDate * 1000).toISOString()}</dd>
        { torrent.doneDate > 0 &&
          <>
            <dt>Finished</dt>
            <dd>{new Date(torrent.doneDate * 1000).toISOString()}</dd>
          </>
        }
        <dt>Duration</dt>
        <dd>{formatDuration(torrent.secondsDownloading)}</dd>
        { torrent.rateDownload > 0 &&
          <>
            <dt>Current Speed</dt>
            <dd>{formatBytesPerSecond(torrent.rateDownload)}</dd>
          </>
        }
        <dt>Average Speed</dt>
        <dd>{formatBytesPerSecond(torrent.downloadedEver/torrent.secondsDownloading)}</dd>
        { torrent.rateUpload > 0 &&
          <>
            <dt>Upload Speed</dt>
            <dd>{formatBytesPerSecond(torrent.rateUpload)}</dd>
          </>
        }
        <dt>Uploaded</dt>
        <dd>
          {formatBytes(torrent.uploadedEver)} <span className="hint">({torrent.uploadRatio})</span>
          {torrent.seedRatioLimit > torrent.uploadRatio && <> [{formatBytes(torrent.seedRatioLimit * torrent.sizeWhenDone)} <span className="hint">({torrent.seedRatioLimit})</span>]</>}
        </dd>
        {
          torrent.peers.length > 0 &&
          <>
            <dt>Peers</dt>
            <dd>
              <PeerIcons peers={torrent.peers} />
            </dd>
          </>
        }
        <dt>Pieces</dt>
        <dd>{torrent.pieceCount} × {formatBytes(torrent.pieceSize)}</dd>
      </dl>
      <PieceMap pieces={torrent.pieces} count={torrent.pieceCount} />
    </div>
  );
}

function formatDuration (seconds) {
  const out = [];
  if (seconds > 24 * 60 * 60) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds -= days * 24 * 60 * 60;
    out.push(days + (days === 1 ? " day" : " days"));
  }
  if (seconds > 60 * 60) {
    const hours = Math.floor(seconds / (60 * 60));
    seconds -= hours * 60 * 60;
    out.push(hours + (hours === 1 ? " hour" : " hours"));
  }
  if (seconds > 60) {
    const minutes = Math.floor(seconds / (60));
    seconds -= minutes * 60;
    out.push(minutes + (minutes === 1 ? " minute" : " minutes"));
  }
  if (seconds > 0) {
    out.push(seconds + (seconds === 1 ? " second" : " seconds"));
  }
  return out.join(" ");
}

function PieceMap ({ pieces, count }) {
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

function PeerIcons ({ peers }) {
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