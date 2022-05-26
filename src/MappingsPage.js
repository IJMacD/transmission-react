import { useState } from 'react';

/**
 * @param {object} props
 * @param {FileSystemMapping[]} props.mappings
 * @param {(newMapping: FileSystemMapping[]|((oldmappings: FileSystemMapping[]) => FileSystemMapping[])) => void} props.setMappings
 */
export function MappingsPage ({ mappings, setMappings }) {
    const [ base, setBase ] = useState("");
    const [ path, setPath ] = useState("");

    /**
     * @param {string} base
     */
    function removeMapping (base) {
        setMappings(mappings => mappings.filter(m => m.base !== base));
    }

    function addMapping () {
        if (!base.startsWith("/")) {
            alert("Base must start with '/'");
            return;
        }

        if (!path.match(/^[a-z0-9]+:/)) {
            alert("Path must start with protocol (e.g. 'file:')");
            return;
        }

        setMappings(mappings => [ ...mappings, { base, path } ]);
        setBase("");
        setPath("");
    }

    return (
        <div>
            <h1>File System Mappings</h1>
            <ul>
                {
                    mappings.map(mapping => {
                        return (
                            <li key={mapping.base}>
                                {mapping.base}{' → '}
                                <a href={mapping.path}>{mapping.path}</a>{' '}
                                <button onClick={() => removeMapping(mapping.base)}>Remove</button>
                            </li>
                        )
                    })
                }
                <li>
                    <input value={base} onChange={e => setBase(e.target.value)} placeholder="Base" />
                    {' → '}
                    <input value={path} onChange={e => setPath(e.target.value)} placeholder="Path" />
                    {' '}
                    <button onClick={() => addMapping()}>Add</button>
                </li>
            </ul>
        </div>
    )
}