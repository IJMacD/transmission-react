import { countSeeds, formatBytesPerSecond } from '../util';

export function TorrentList({ torrents, onTorrentClick=null, onStartClick=null }) {
  return <ul>
    {torrents.map(t => <li key={t.id} className="torrent-item" onClick={() => onTorrentClick(t.id)}><TorrentEntry torrent={t} onStartClick={onStartClick} /></li>)}
  </ul>;
}

export function TorrentEntry({ torrent, onStartClick }) {
  const { id, isFinished, name, rateDownload, rateUpload, percentDone } = torrent;
  const seedCount = countSeeds(torrent);
  return (
    <div style={{ color: isFinished ? "#999" : "#333" }}>
      {name}{' '}
      {rateDownload > 0 && <span>⬇️ {formatBytesPerSecond(rateDownload)}</span>}
      {rateUpload > 0 && <span>⬆️ {formatBytesPerSecond(rateUpload)}</span>}
      {percentDone < 1 && <span className="hint">{(percentDone * 100).toFixed(1)}%</span>}
      {seedCount < 5 && isFinished && onStartClick ? <span title={`Seeds: ${seedCount}`} onClick={e => { e.stopPropagation(); onStartClick(id); }}>⚡</span> : null}
    </div>
  );
}
