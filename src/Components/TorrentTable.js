import { ProgressBar } from './ProgressBar';
import { formatBytesPerSecond, formatBytes, countSeeds, formatDuration } from '../util';

export function TorrentTable({ torrents, onTorrentClick = null, onStopClick = null, downloadMode = false }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          { downloadMode && <th>Download Speed</th> }
          <th>{ downloadMode ? "ETA" : "Upload Speed" }</th>
          <th>Seeds</th>
          <th>Peers</th>
          { !downloadMode && <th>Uploaded</th> }
        </tr>
      </thead>
      <tbody>
        {torrents.map(t => (
          <tr key={t.id} onClick={() => onTorrentClick(t.id)}>
            <td>
              {t.name}{' '}
              {t.percentDone < 1 && <span className="hint">{(t.percentDone * 100).toFixed(1)}%</span>}
              { downloadMode && <ProgressBar value={t.percentDone} color="#8F8" /> }
              { t.percentDone === 1 && <span className="hint">{(t.uploadRatio/t.seedRatioLimit * 100).toFixed(1)}%</span>}
              { !downloadMode && <ProgressBar value={(t.uploadRatio/t.seedRatioLimit)} color="#F88" /> }
            </td>
            { downloadMode && <td>{t.rateDownload > 0 && formatBytesPerSecond(t.rateDownload)}</td> }
            { downloadMode ?
              <td>{t.percentDone < 1 && t.rateDownload > 0 && <span>{formatDuration(t.desiredAvailable / t.rateDownload)}</span>}</td>
              :
              <td>{t.rateUpload > 0 && formatBytesPerSecond(t.rateUpload)}</td>
            }
            <td>{countSeeds(t)} {countSeeds(t) > 10 && t.seedRatioLimit < t.uploadRatio ? <span onClick={e => { e.stopPropagation(); onStopClick(t.id); }}>⚠️</span> : null}</td>
            <td>{t.peersGettingFromUs + t.peersSendingToUs}</td>
            { !downloadMode &&
              <td>
                {formatBytes(t.uploadedEver)} <span className="hint">({t.uploadRatio})</span>
                {t.seedRatioLimit > t.uploadRatio && <> [{formatBytes(t.seedRatioLimit * t.sizeWhenDone)} <span className="hint">({t.seedRatioLimit})</span>] </>}
              </td>
            }
          </tr>
        ))}
      </tbody>
    </table>
  );
}
