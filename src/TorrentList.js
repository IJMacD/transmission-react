import { formatBytesPerSecond } from './util';

export function TorrentList({ torrents, onTorrentClick }) {
  return <ul>
    {torrents.map(t => <li key={t.id} onClick={() => onTorrentClick(t.id)}><TorrentEntry {...t} /></li>)}
  </ul>;
}
function TorrentEntry({ isFinished, name, rateDownload, rateUpload, percentDone }) {
  return (
    <div style={{ color: isFinished ? "#999" : "#333" }}>
      {name}{' '}
      {rateDownload > 0 && <span>⬇️ {formatBytesPerSecond(rateDownload)}</span>}
      {rateUpload > 0 && <span>⬆️ {formatBytesPerSecond(rateUpload)}</span>}
      {percentDone < 1 && <span className="hint">{(percentDone * 100).toFixed(1)}%</span>}
    </div>
  );
}
