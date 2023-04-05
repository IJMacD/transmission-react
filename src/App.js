import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import { formatBytesPerSecond, isActive, sortBy } from './util';
import Transmission from "./Transmission";
import { Graph } from './Components/Graph';
import { TorrentTable } from './Components/TorrentTable';
import { TorrentDetails } from './Pages/TorrentDetails';
import { TorrentList } from './Components/TorrentList';
import { TorrentTreeList } from './Components/TorrentTreeList';
import { PeerStats } from './Pages/PeerStats';
import { useSavedState } from './hooks/useSavedState';
import SearchPage from './Pages/SearchPage';
import { useDataLog } from './hooks/useDataLog';
import { MappingsPage } from './Pages/MappingsPage';
import { RSSFeedPage } from './Pages/RSSFeedPage';

const NO_TORRENT = -1;

/** @typedef {import('..').Torrent} Torrent */
/** @typedef {import('..').FileSystemMapping} FileSystemMapping */

function App() {
  const [torrents, setTorrents] = useState(/** @type {Torrent[]} */([]));
  const tmRef = useRef(new Transmission(process.env.REACT_APP_API_ROOT));
  const [ data, pushData ] = useDataLog();
  const [ selectedTorrent, setSelectedTorrent ] = useState(NO_TORRENT);
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
  const [ selectedFilter, setSelectedFilter ] = useState("all");

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

    // Filter out removed torrents
    const torrentIDs = torrents.map(t => t.id);
    setOpenTorrentTabs(openTorrentTabs => openTorrentTabs.filter(id => torrentIDs.includes(id)));
    setSelectedTorrent(selectedTorrent => torrentIDs.includes(selectedTorrent) ? selectedTorrent : NO_TORRENT)

  }, [torrents, pushData, setDownloadMax, setUploadMax, setOpenTorrentTabs]);

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
    setSelectedTorrent(selectedID => selectedID === id ? NO_TORRENT : selectedID);
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

  const filters = ["all","downloading","uploading","unfinished","finished"];

  function setSelected (page, filter, torrentID) {
    if (page) {
      setPage(page);
    }
    else {
      setPage("torrents");

      if (filter) {
        setSelectedTorrent(NO_TORRENT);
        setSelectedFilter(filter);
      }
      else {
        setSelectedTorrent(torrentID);
        setSelectedFilter("");
      }
    }
  }

  return (
    <div className="App">
      <div className='App-Sidebar'>
        <ul>
          {
            filters.map(f => <li key={f} className={page==="torrents"&&selectedTorrent===NO_TORRENT&&f===selectedFilter?"selected":""} onClick={()=>setSelected(null, f)}>{f}</li>)
          }
          {
            openTorrentTabs.map(id => {
              const name = getTorrent(id)?.name || id;
              const active = page === "torrents" && selectedTorrent === id;
              return (
                <li key={id} className={active?"selected":""}>
                  <div
                    onClick={() => { setPage("torrents"); setSelected(null, null, id); }}
                    className="TorrentTabButton"
                  >
                    {name}
                  </div>
                  <button onClick={() => closeTorrent(id)}>❌</button>
                </li>
              );
            })
          }
          <li onClick={() => setPage("peers")} className={page === "peers"?"selected":""}>Peers</li>
          <li onClick={() => setPage("search")} className={page === "search"?"selected":""}>Search</li>
          <li onClick={() => setPage("mappings")} className={page === "mappings"?"selected":""}>Mappings</li>
          <li><button onClick={handleAddLink}>Add Magnet</button></li>
          <li><button onClick={handleAddRSS}>Load RSS</button></li>
        </ul>
      </div>
      <div className='App-Main'>
        <p className='App-StatusBar'>
          ⬇️ {formatBytesPerSecond(totalDown)} (Avg: {formatBytesPerSecond(downloadAverage.current)}, Max: {formatBytesPerSecond(downloadMax)}){' '}
          ⬆️ {formatBytesPerSecond(totalUp)} (Avg: {formatBytesPerSecond(uploadAverage.current)}, Max: {formatBytesPerSecond(uploadMax)}){' '}
          <label>Alt Speed: <input type="checkbox" checked={sessionData['alt-speed-enabled']||false} onChange={e => setAltSpeedEnabled(e.target.checked)} /></label>
        </p>
        { page === "torrents" && selectedTorrent === NO_TORRENT && <Graph data={data} options={graphOptions} /> }
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
              <TorrentDetails torrent={getTorrent(id, true)} transmission={tmRef.current} pathMappings={pathMappings} />
            </div>
          })
        }
        { page === "torrents" && selectedTorrent === NO_TORRENT &&
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
    </div>
  );
}

export default App;

