import { useEffect, useRef, useState } from 'react';
import './App.css';
import Transmission from "./Transmission";
import { useGraph } from './useGraph';

function App() {
  const [torrents, setTorrents] = useState([]);
  const tmRef = useRef(new Transmission(process.env.REACT_APP_API_ROOT));
  const [ canvasRef, pushData ] = useGraph({
    horizontalGridlines: 500 * 1024,
  });

  useEffect(() => {
    const run = () => {
      const tm = tmRef.current;
      tm.getTorrents().then(setTorrents);
    };
    const id = setInterval(run, 10 * 1000);
    run();

    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const activeTorrents = torrents.filter(isActive);

    const totalDown = activeTorrents.reduce((total,torrent) => total + torrent.rateDownload, 0);
    const totalUp = activeTorrents.reduce((total,torrent) => total + torrent.rateUpload, 0);

    pushData(totalDown, totalUp);
  }, [torrents]);

  const activeTorrents = torrents.filter(isActive);
  const inactiveTorrents = torrents.filter(t => !isActive(t));

  const totalDown = activeTorrents.reduce((total,torrent) => total + torrent.rateDownload, 0);
  const totalUp = activeTorrents.reduce((total,torrent) => total + torrent.rateUpload, 0);

  return (
    <div className="App">
      <h1>{torrents.length} torrents</h1>
      <p>⬇️ {formatBytesPerSecond(totalDown)} ⬆️ {formatBytesPerSecond(totalUp)}</p>
      <canvas ref={canvasRef} />
      <h2>Active ({activeTorrents.length})</h2>
      <TorrentTable torrents={sortBy(activeTorrents, "uploadedEver", true)} onTorrentClick={id => tmRef.current.getTorrent(id)} />
      <h2>Inactive ({inactiveTorrents.length})</h2>
      <TorrentList torrents={sortBy(inactiveTorrents, "name")} onTorrentClick={id => tmRef.current.getTorrent(id)} />
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

function TorrentEntry ({ isFinished, name, rateDownload, rateUpload }) {
  return (
    <div style={{ color: isFinished ? "#999" : "#333" }}>
      {name}
      { rateDownload > 0 ? <span>⬇️ {formatBytesPerSecond(rateDownload)}</span> : null }
      { rateUpload > 0 ? <span>⬆️ {formatBytesPerSecond(rateUpload)}</span> : null }
    </div>
  );
}

function formatBytes (n) {
  if (n > 1024 * 1024 * 1024) return `${(n/(1024 * 1024 * 1024)).toFixed(3)} GB`;
  if (n > 1024 * 1024) return `${(n/(1024 * 1024)).toFixed(3)} MB`;
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
              <td>{t.peersGettingFromUs}</td>
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