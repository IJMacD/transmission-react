import { formatBytesPerSecond, formatBytes } from './util';

export function TorrentTable({ torrents, onTorrentClick }) {
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
        {torrents.map(t => (
          <tr key={t.id} onClick={() => onTorrentClick(t.id)}>
            <td>{t.name}</td>
            <td>{t.rateDownload > 0 && formatBytesPerSecond(t.rateDownload)}</td>
            <td>{t.rateUpload > 0 && formatBytesPerSecond(t.rateUpload)}</td>
            <td>{t.peersGettingFromUs + t.peersSendingToUs}</td>
            <td>
              {formatBytes(t.uploadedEver)} <span className="hint">({t.uploadRatio})</span>
              {t.seedRatioLimit > t.uploadRatio && <> [{formatBytes(t.seedRatioLimit * t.sizeWhenDone)} <span className="hint">({t.seedRatioLimit})</span>]</>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
