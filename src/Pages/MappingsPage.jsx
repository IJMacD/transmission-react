import { useState } from 'react';

/** @typedef {import('../..').FileSystemMapping} FileSystemMapping */

/**
 * @param {object} props
 * @param {FileSystemMapping[]} props.mappings
 * @param {(newMapping: FileSystemMapping[]|((oldmappings: FileSystemMapping[]) => FileSystemMapping[])) => void} props.setMappings
 */
export function MappingsPage ({ mappings, setMappings }) {
    const [ base, setBase ] = useState("");
    const [ path, setPath ] = useState("");
    const [editingBase, setEditingBase] = useState("");
    const [editBase, setEditBase] = useState("");
    const [editPath, setEditPath] = useState("");

    /**
     * @param {string} value
     * @param {string} target
     */
    function validateMapping(value, target) {
        if (!value.startsWith("/")) {
            alert("Base must start with '/'");
            return false;
        }

        if (!target.match(/^[a-z0-9]+:/)) {
            alert("Path must start with protocol (e.g. 'file:')");
            return false;
        }

        return true;
    }

    /**
     * @param {string} base
     */
    function removeMapping (base) {
        setMappings(mappings => mappings.filter(m => m.base !== base));
        if (editingBase === base) {
            cancelEdit();
        }
    }

    function addMapping () {
        const nextBase = base.trim();
        const nextPath = path.trim();

        if (!validateMapping(nextBase, nextPath)) {
            return;
        }

        setMappings(mappings => {
            if (mappings.find(m => m.base === nextBase)) {
                alert("Base already exists");
                return mappings;
            }
            return [...mappings, { base: nextBase, path: nextPath }];
        });
        setBase("");
        setPath("");
    }

    /**
     * @param {FileSystemMapping} mapping
     */
    function beginEdit(mapping) {
        setEditingBase(mapping.base);
        setEditBase(mapping.base);
        setEditPath(mapping.path);
    }

    function cancelEdit() {
        setEditingBase("");
        setEditBase("");
        setEditPath("");
    }

    /**
     * @param {string} oldBase
     */
    function saveEdit(oldBase) {
        const nextBase = editBase.trim();
        const nextPath = editPath.trim();

        if (!validateMapping(nextBase, nextPath)) {
            return;
        }

        setMappings(mappings => {
            if (mappings.find(m => m.base === nextBase && m.base !== oldBase)) {
                alert("Base already exists");
                return mappings;
            }

            return mappings.map(m => {
                if (m.base !== oldBase) {
                    return m;
                }

                return {
                    ...m,
                    base: nextBase,
                    path: nextPath,
                };
            });
        });

        cancelEdit();
    }

    return (
        <div className="MappingsPage">
            <h1>File System Mappings</h1>
            <p className="hint">Map remote download paths to local paths used by your browser.</p>

            <div className="MappingsPage-Card">
                <table className="MappingsPage-Table">
                    <thead>
                        <tr>
                            <th>Base</th>
                            <th>Path</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            mappings.length === 0 &&
                            <tr>
                                <td colSpan={3} className="MappingsPage-Empty">No mappings configured.</td>
                            </tr>
                        }
                        {
                            mappings.map(mapping => {
                                const isEditing = editingBase === mapping.base;

                                return (
                                    <tr key={mapping.base}>
                                        <td>
                                            {
                                                isEditing ?
                                                    <input className="MappingsPage-Input" value={editBase} onChange={e => setEditBase(e.target.value)} placeholder="/mnt/downloads" /> :
                                                    <span className="MappingsPage-Base">{mapping.base}</span>
                                            }
                                        </td>
                                        <td>
                                            {
                                                isEditing ?
                                                    <input className="MappingsPage-Input" value={editPath} onChange={e => setEditPath(e.target.value)} placeholder="file:///Users/me/Downloads" /> :
                                                    <a className="MappingsPage-PathLink" href={mapping.path}>{mapping.path}</a>
                                            }
                                        </td>
                                        <td>
                                            {
                                                isEditing ?
                                                    <div className="MappingsPage-Actions">
                                                        <button className="MappingsPage-ActionButton" onClick={() => saveEdit(mapping.base)}>Save</button>
                                                        <button className="MappingsPage-ActionButton" onClick={() => cancelEdit()}>Cancel</button>
                                                    </div> :
                                                    <div className="MappingsPage-Actions">
                                                        <button className="MappingsPage-ActionButton" onClick={() => beginEdit(mapping)}>Edit</button>
                                                        <button className="MappingsPage-ActionButton MappingsPage-ActionButton--danger" onClick={() => removeMapping(mapping.base)}>Remove</button>
                                                    </div>
                                            }
                                        </td>
                                    </tr>
                                )
                            })
                        }
                    </tbody>
                </table>

                <div className="MappingsPage-AddRow">
                    <input className="MappingsPage-Input" value={base} onChange={e => setBase(e.target.value)} placeholder="/mnt/downloads" />
                    <input className="MappingsPage-Input" value={path} onChange={e => setPath(e.target.value)} placeholder="file:///Users/me/Downloads" />
                    <button className="MappingsPage-ActionButton" onClick={() => addMapping()}>Add Mapping</button>
                </div>
            </div>
        </div>
    )
}