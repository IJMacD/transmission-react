import { useEffect, useRef, useState, Fragment } from 'react';
import './App.css';
import { formatBytesPerSecond, sortBy } from './util';
import Transmission from "./Transmission";
import { Graph } from './Graph';
import { TorrentTable } from './TorrentTable';
import { TorrentDetails } from './TorrentDetails';
import { TorrentList } from './TorrentList';
import { TorrentTreeList } from './TorrentTreeList';
import { PeerStats } from './PeerStats';
import { useSavedState } from './useSavedState';
import SearchPage from './SearchPage';
import { useDataLog } from './useDataLog';
import { MappingsPage } from './MappingsPage';
import { RSSFeedPage } from './RSSFeedPage';

function App() {
  /** @type {[ Torrent[], import('react').Dispatch<import('react').SetStateAction<Torrent[]>> ]} */
  const [torrents, setTorrents] = useState([]);
  const tmRef = useRef(new Transmission(process.env.REACT_APP_API_ROOT));
  const [ data, pushData ] = useDataLog();
  const [ selectedTorrent, setSelectedTorrent ] = useState(-1);
  const [ openTorrentTabs, setOpenTorrentTabs ] = useState(/** @type {number[]} */([]));
  const [ torrentData, setTorrentData ] = useState(/** @type {Torrent[]} */([]));
  const downloadAverage = useRef(NaN);
  const uploadAverage = useRef(NaN);
  const [ downloadMax, setDownloadMax ] = useSavedState("TRANSMISSION_DOWNLOAD_MAX", 0);
  const [ uploadMax, setUploadMax ] = useSavedState("TRANSMISSION_UPLOAD_MAX", 0);
  const [ page, setPage ] = useState("torrents");
  const [ pathMappings, setPathMappings ] = useSavedState("TRANSMISSION_PATH_MAPPINGS", /** @type {FileSystemMapping[]} */([]));
  const [ rssFeed, setRSSFeed ] = useState("https://");
  const [ sessionData, setSessionData ] = useState({});

  useEffect(() => {
    const run = () => {
      const tm = tmRef.current;
      tm.getTorrents().then(setTorrents, console.log);
      tm.getSession().then(setSessionData, console.log);
    };
    const id = setInterval(run, 10 * 1000);
    run();

    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const activeTorrents = torrents.filter(isActive);

    const totalDown = activeTorrents.reduce((total,torrent) => total + torrent.rateDownload, 0);
    const totalUp = activeTorrents.reduce((total,torrent) => total + torrent.rateUpload, 0);

    downloadAverage.current = isNaN(downloadAverage.current) ? totalDown : downloadAverage.current * 0.9 + totalDown * 0.1;
    uploadAverage.current = isNaN(uploadAverage.current) ? totalUp : uploadAverage.current * 0.9 + totalUp * 0.1;

    setDownloadMax(downloadMax => Math.max(downloadMax, totalDown));
    setUploadMax(uploadMax => Math.max(uploadMax, totalUp));

    pushData(Date.now(), totalDown, totalUp, downloadAverage.current, uploadAverage.current);

  }, [torrents, pushData, setDownloadMax, setUploadMax]);

  useEffect(() => {
    if (openTorrentTabs.length > 0) {
      const tm = tmRef.current;
      tm.addMultipleTorrentListener(openTorrentTabs, setTorrentData);

      return () => tm.removeMultipleTorrentListener(openTorrentTabs, setTorrentData);
    } else {
      // setTorrentData(null);
    }
  }, [openTorrentTabs]);

  function selectTorrent (id) {
    setSelectedTorrent(id);
    setOpenTorrentTabs(openTorrentTabs => {
      if (!openTorrentTabs.includes(id)) {
        return [ ...openTorrentTabs, id ];
      }
      return openTorrentTabs;
    });
  }

  function closeTorrent (id) {
    setSelectedTorrent(selectedID => selectedID === id ? -1 : selectedID);
    setOpenTorrentTabs(openTorrentTabs => openTorrentTabs.filter(t => t !== id));
  }

  function handleAddLink () {
    const link = prompt("Enter magnet link:", "magnet://");

    if (link) {
      tmRef.current.addMagnet(link);
    }
  }

  function handleAddRSS () {
    const link = prompt("Enter RSS feed:", rssFeed);

    if (link) {
      setRSSFeed(link);
      setPage("rss");
    }
  }

  function getTorrent (id, details = false) {
    if (details) {
      return torrentData.find(t => t.id === id);
    }
    return torrents.find(t => t.id === id);
  }

  function setAltSpeedEnabled (enabled) {
    tmRef.current.setSession("alt-speed-enabled", enabled).then(() => {
      tmRef.current.getSession().then(setSessionData);
    });
  }

  const graphOptions = {
    horizontalGridlines: 500 * 1024,
    colour: ["#CFC","#FCC","#5F5","#F55"],
    style: ["area","area","line","line"],
  };

  const activeTorrents = torrents.filter(isActive);
  // const inactiveUnfinishedTorrents = torrents.filter(t => !isActive(t) && t.percentDone < 1);
  // const inactiveFinishedTorrents = torrents.filter(t => !isActive(t) && t.percentDone === 1);
  const downloadingTorrents = torrents.filter(t => t.status === Transmission.STATUS_DOWNLOAD || t.status === Transmission.STATUS_DOWNLOAD_WAIT);
  const uploadingTorrents = torrents.filter(t => t.status === Transmission.STATUS_SEED || t.status === Transmission.STATUS_SEED_WAIT);
  // const recentlyFinishedTorrents = torrents.filter(t => t.percentDone === 1 && isRecentlyFinished(t));
  const stoppedTorrents = torrents.filter(t => t.status === Transmission.STATUS_STOPPED);
  const finishedTorrents = torrents.filter(t => t.percentDone === 1);
  const unfinishedTorrents = stoppedTorrents.filter(t => t.percentDone !== 1);

  const totalDown = activeTorrents.reduce((total,torrent) => total + torrent.rateDownload, 0);
  const totalUp = activeTorrents.reduce((total,torrent) => total + torrent.rateUpload, 0);

  return (
    <div className="App">
      <p>
        ⬇️ {formatBytesPerSecond(totalDown)} (Avg: {formatBytesPerSecond(downloadAverage.current)}, Max: {formatBytesPerSecond(downloadMax)}){' '}
        ⬆️ {formatBytesPerSecond(totalUp)} (Avg: {formatBytesPerSecond(uploadAverage.current)}, Max: {formatBytesPerSecond(uploadMax)}){' '}
        Alt Speed: <input type="checkbox" checked={sessionData['alt-speed-enabled']} onChange={e => setAltSpeedEnabled(e.target.checked)} />
      </p>
      <button onClick={() => { setPage("torrents"); setSelectedTorrent(-1); }} disabled={page === "torrents" && selectedTorrent === -1}>Torrents</button>
      {
        openTorrentTabs.map(id => {
          const name = getTorrent(id)?.name || id;
          const active = page === "torrents" && selectedTorrent === id;
          return (
            <button
              key={id}
              onClick={() => { setPage("torrents"); setSelectedTorrent(id); }}
              disabled={active}
              className="TorrentTabButton"
            >
              {name}
            </button>
          );
        })
      }
      <button onClick={() => setPage("peers")} disabled={page === "peers"}>Peers</button>
      <button onClick={() => setPage("search")} disabled={page === "search"}>Search</button>
      <button onClick={() => setPage("mappings")} disabled={page === "mappings"}>Mappings</button>
      <button onClick={handleAddLink}>Add Magnet</button>
      <button onClick={handleAddRSS}>Load RSS</button>
      { page === "torrents" && <Graph data={data} options={graphOptions} /> }
      {
        page === "peers" &&
        <div>
          <h1>Peers</h1>
          <PeerStats torrents={torrents} />
        </div>
      }
      {
        page === "mappings" &&
        <MappingsPage mappings={pathMappings} setMappings={setPathMappings} />
      }
      {
        page === "rss" &&
        <div>
          <button onClick={() => setPage("torrents")}>Close</button>
          <RSSFeedPage feed={rssFeed} transmission={tmRef.current} />
        </div>
      }
      {
        openTorrentTabs.map(id => {
          return <div key={id} style={{ display: page === "torrents" && selectedTorrent === id ? "block" : "none" }}>
            <button onClick={() => closeTorrent(id)}>Close</button>
            <TorrentDetails torrent={getTorrent(id, true)} transmission={tmRef.current} pathMappings={pathMappings} />
          </div>
        })
      }
      { page === "torrents" && selectedTorrent === -1 &&
        <div>
          <h1>{torrents.length} torrents</h1>
          { downloadingTorrents.length > 0 &&
            <>
              <h2>Downloading ({downloadingTorrents.length})</h2>
              <TorrentTable torrents={sortBy(downloadingTorrents, "percentDone", true)} onTorrentClick={selectTorrent} downloadMode={true} />
            </>
          }
          { uploadingTorrents.length > 0 &&
            <>
              <h2>Uploading ({uploadingTorrents.length})</h2>
              <TorrentTable torrents={sortBy(uploadingTorrents, "uploadRatio", true)} onTorrentClick={selectTorrent} onStopClick={id => tmRef.current.stopTorrent(id)} />
            </>
          }
          {/*
          <h2>Recently Finished ({recentlyFinishedTorrents.length})</h2>
          <TorrentList torrents={sortBy(recentlyFinishedTorrents, "doneDate", true)} onTorrentClick={selectTorrent} />
          */}
          <h2>Unfinished ({unfinishedTorrents.length})</h2>
          <TorrentList torrents={sortBy(unfinishedTorrents, "percentDone", true)} onTorrentClick={selectTorrent} />
          <h2>Finished ({finishedTorrents.length})</h2>
          <TorrentTreeList torrents={sortBy(finishedTorrents, "name")} onTorrentClick={selectTorrent} onStartClick={id => tmRef.current.startTorrent(id)} />
        </div>
      }
      { page === "search" &&
        <div>
          <h1>Search</h1>
          <SearchPage transmission={tmRef.current} />
        </div>
      }
    </div>
  );
}

export default App;


function isActive (torrent) {
  return torrent.rateDownload > 0 || torrent.rateUpload > 0;
}

function isRecentlyFinished (torrent) {
  return Date.now() - (torrent.doneDate * 1000) < (7 * 24 * 60 * 60 * 1000);
}
