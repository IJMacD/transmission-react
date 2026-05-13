import { useState } from "react"
import React from "react";

const SEARCH_ROOT = "//" + (window.location.hostname === "localhost" ? "nas.home.ijmacd.com" : window.location.hostname) + "/magnet_search.php";

/** @typedef {import('../..').SearchResult} SearchResult */

/**
 *
 * @param {object} props
 * @param {import('../Transmission').default} props.transmission
 */
export default function SearchPage ({ transmission }) {
    const [ searchTerm, setSearchTerm ] = useState("");
    const [ results, setResults ] = useState(/** @type {SearchResult[]} */([]));
    const [ fetching, setFetching ] = useState(false);
    const [ error, setError ] = useState(/** @type {Error?} */(null));

    /**
     * @param {React.FormEvent<HTMLFormElement>} e
     */
    function handleSubmit (e) {
        e.preventDefault();
        setError(null);

        fetch(`${SEARCH_ROOT}?search=${searchTerm}`)
            .then(r => r.json())
            .then(setResults, setError)
            .then(() => setFetching(false));

        setFetching(true);
    }

    /**
     *
     * @param {React.MouseEvent<HTMLAnchorElement>} e
     */
    function handleClick (e) {
        e.preventDefault();

        if (transmission) {
            transmission.addMagnet(e.currentTarget.href);
            alert("Added");
        }
    }

    return (
        <div className="SearchPage">
            <form className="SearchForm" onSubmit={handleSubmit}>
                <input
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search Term"
                    className="SearchBox"
                    disabled={fetching}
                />
                <button className="SearchButton" disabled={fetching}>Search</button>
            </form>
            { error && <p>{error.message}</p> }
            <table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Size</th>
						<th>Seeds</th>
						<th>Leeches</th>
					</tr>
				</thead>
                <tbody>
                {
                    results.map(item => <tr key={item.link}><td><a href={item.magnet} onClick={handleClick}>{item.name}</a></td><td>{item.size}</td><td>{item.seeds}</td><td>{item.leeches}</td></tr>)
                }
                </tbody>
            </table>
        </div>
    );
}