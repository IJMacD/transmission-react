import { useEffect, useRef, useState } from 'react';
import './App.css';
import { formatBytesPerSecond, sortBy } from './util';
import Transmission from "./Transmission";
import { useGraph } from './useGraph';
import { TorrentTable } from './TorrentTable';
import { TorrentDetails } from './TorrentDetails';
import { TorrentList } from './TorrentList';
import { PeerStats } from './PeerStats';

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
  const [ page, setPage ] = useState("torrents");

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
      <p>⬇️ {formatBytesPerSecond(totalDown)} ({formatBytesPerSecond(downloadAverage.current)}) ⬆️ {formatBytesPerSecond(totalUp)} ({formatBytesPerSecond(uploadAverage.current)})</p>
      <button onClick={() => setPage("torrents")} disabled={page === "torrents"}>Torrents</button>
      <button onClick={() => setPage("peers")} disabled={page === "peers"}>Peers</button>
      { selectedTorrent < 0 && <canvas ref={canvasRef} /> }
      {
        page === "peers" &&
        <div>
          <h1>Peers</h1>
          <PeerStats torrents={torrents} />
        </div>
      }
      { page === "torrents" &&
        <div>
          <h1>{torrents.length} torrents</h1>
          { selectedTorrent >= 0 ?
            <>
              <button onClick={() => setSelectedTorrent(-1)}>Back</button>
              <TorrentDetails torrent={torrentData} />
            </>
            :
            <>
              <h2>Active ({activeTorrents.length})</h2>
              <TorrentTable torrents={sortBy(activeTorrents, "uploadedEver", true)} onTorrentClick={setSelectedTorrent} onStopClick={id => tmRef.current.stopTorrent(id)} />
              <h2>Inactive and Unfinished ({inactiveUnfinishedTorrents.length})</h2>
              <TorrentList torrents={sortBy(inactiveUnfinishedTorrents, "percentDone", true)} onTorrentClick={setSelectedTorrent} />
              <h2>Inactive and Finished ({inactiveFinishedTorrents.length})</h2>
              <TorrentList torrents={sortBy(inactiveFinishedTorrents, "name")} onTorrentClick={setSelectedTorrent} onStartClick={id => tmRef.current.startTorrent(id)} />
            </>
          }
        </div>
      }
    </div>
  );
}

export default App;

function isActive (torrent) {
  return torrent.rateDownload > 0 || torrent.rateUpload > 0;
}


