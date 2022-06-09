import { formatBytes } from "../util";

/** @typedef {Map<string, TreeMap|(TorrentFile & {firstPiece: number; lastPiece: number})>} TreeMap */

/**
 *
 * @param {object} props
 * @param {object[]} props.files
 * @param {(newName: string) => void} props.onRenameClick
 * @param {string} [props.pathMapping]
 * @param {number} [props.pieceSize]
 * @param {(file: TorrentFile) => void} [props.onHoverStart]
 * @param {(file: TorrentFile) => void} [props.onHoverEnd]
 * @returns
 */
export function FileTreeList({
  files,
  onRenameClick,
  pathMapping = null,
  pieceSize = NaN,
  onHoverStart = null,
  onHoverEnd = null,
})
{
  /** @type {TreeMap} */
  const map = new Map();

  let cumlSize = 0;

  for (const t of files) {
    const { name } = t;

    let parentMap = map;
    const segs = name.replace(/\/$/, "").split("/");
    const segsCount = segs.length;
    for (let i = 0; i < segsCount; i++) {
      const seg = segs[i];

      // Last segment is the file
      if (i === segsCount - 1) {
        // Calculate piece range
        t.firstByte = cumlSize;
        cumlSize += t.length;
        t.lastByte = cumlSize;
        t.firstPiece = Math.floor(t.firstByte/pieceSize);
        t.lastPiece = Math.floor(t.lastByte/pieceSize);

        parentMap.set(seg, t);
        break;
      }

      // Other segments are directories
      /** @type {TreeMap} */
      let m;
      if (parentMap.has(seg)) {
        // @ts-ignore
        m = parentMap.get(seg);
      } else {
        m = new Map();
        parentMap.set(seg, m);
      }

      parentMap = m;
    }
  }

  return (
    <TreeItem item={map} onRenameClick={onRenameClick} pathMapping={pathMapping} onHoverStart={onHoverStart} onHoverEnd={onHoverEnd} />
  );
}

/**
 *
 * @param {object} props
 * @param {TreeMap} props.item
 * @param {(newName: string) => void} props.onRenameClick
 * @param {string} [props.pathMapping]
 * @param {(file: TorrentFile) => void} [props.onHoverStart]
 * @param {(file: TorrentFile) => void} [props.onHoverEnd]
 * @returns
 */
function TreeItem ({
  item,
  onRenameClick,
  pathMapping = null,
  onHoverStart = null,
  onHoverEnd = null,
})
{
  return (
    <ul className="TreeItem">
      {[...item.entries()].map(([key, value]) => {
        if (value instanceof Map) {
          return (
            <li key={key}>
              /{key} <button onClick={() => onRenameClick(key)}>Rename</button>
              <TreeItem item={value} onRenameClick={onRenameClick} pathMapping={pathMapping} onHoverStart={onHoverStart} onHoverEnd={onHoverEnd} />
            </li>
          );
        }

        return (
          <li key={key} className="file-item" onMouseEnter={() => onHoverStart?.(value)} onMouseLeave={() => onHoverEnd?.(value)}>
            {
              pathMapping && value.bytesCompleted === value.length ?
              <a href={`${pathMapping}/${value.name}`}>{key}</a> :
              key
            } &ndash; {' '}
            { formatBytes(value.length) }{' '}
            {
              value.bytesCompleted < value.length &&
              <span className="hint">
                {((value.bytesCompleted/value.length)*100).toFixed()}%
              </span>
            }{' '}
            {!isNaN(value.firstPiece) &&
              <span className="hint">
                Pieces: {value.firstPiece} &ndash; {value.lastPiece}
              </span>
            }{' '}
            <button onClick={() => onRenameClick(value.name)} style={{fontSize:"0.6em",padding:2}}>Rename</button>
          </li>
        );
      })}
    </ul>
  )
}
