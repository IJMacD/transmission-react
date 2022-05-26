import { formatBytes } from "./util";

/** @typedef {Map<string, TreeMap|TorrentFile>} TreeMap */

/**
 *
 * @param {object} props
 * @param {object[]} props.files
 * @param {(newName: string) => void} props.onRenameClick
 * @param {string} [props.pathMapping]
 * @returns
 */
export function FileTreeList({ files, onRenameClick, pathMapping = null }) {
  /** @type {TreeMap} */
  const map = new Map();

  for (const t of files) {
    const { name } = t;

    let parentMap = map;
    const segs = name.replace(/\/$/, "").split("/");
    const segsCount = segs.length;
    for (let i = 0; i < segsCount; i++) {
      const seg = segs[i];

      if (i === segsCount - 1) {
        parentMap.set(seg, t);
        break;
      }

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
    <TreeItem item={map} onRenameClick={onRenameClick} pathMapping={pathMapping} />
  );
}

/**
 *
 * @param {object} props
 * @param {TreeMap} props.item
 * @param {(newName: string) => void} props.onRenameClick
 * @param {string} [props.pathMapping]
 * @returns
 */
function TreeItem ({ item, onRenameClick, pathMapping = null }) {
  return (
    <ul className="TreeItem">
      {[...item.entries()].map(([key, value]) => {
        if (value instanceof Map) {
          return (
            <li key={key}>
              /{key} <button onClick={() => onRenameClick(key)}>Rename</button>
              <TreeItem item={value} onRenameClick={onRenameClick} pathMapping={pathMapping} />
            </li>
          );
        }

        return (
          <li key={key} className="file-item">
            {
              pathMapping && value.bytesCompleted === value.length ?
              <a href={`${pathMapping}/${value.name}`}>{key}</a> :
              key
            } {' '}
            { formatBytes(value.length) }{' '}
            {((value.bytesCompleted/value.length)*100).toFixed()}% {' '}
            <button onClick={() => onRenameClick(value.name)}>Rename</button>
          </li>
        );
      })}
    </ul>
  )
}
