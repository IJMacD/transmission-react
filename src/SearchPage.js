import { useState } from "react"
import Transmission from "./Transmission";

const SEARCH_ROOT = "http://nas.lan/magnet_search.php";

/**
 *
 * @param {object} param0
 * @param {Transmission} param0.transmission
 */
export default function SearchPage ({ transmission }) {
    const [ searchTerm, setSearchTerm ] = useState("");
    const [ results, setResults ] = useState([]);
    const [ fetching, setFetching ] = useState(false);
    const [ error, setError ] = useState(null);

    /**
     * @param {React.FormEvent<HTMLFormElement>} e
     */
    function handleSubmit (e) {
        e.preventDefault();

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
        <div>
            <form className="SearchForm" onSubmit={handleSubmit}>
                <input
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search Term"
                    className="SearchBox"
                    disabled={fetching}
                />
                <button disabled={fetching}>Search</button>
            </form>
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