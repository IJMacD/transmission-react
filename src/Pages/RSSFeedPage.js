import Transmission from '../Transmission';
import { useFetch } from '../hooks/useFetch';

/**
 * @param {object} props
 * @param {string} props.feed
 * @param {Transmission} props.transmission
 */
export function RSSFeedPage ({ feed, transmission }) {
    const [ data, loading, error ] = useFetch(feed);

    let items;

    if (data) {
        const doc = new DOMParser().parseFromString(data, "application/xml");

        items = [...doc.querySelectorAll("item")].map(item => {
            const id = item.querySelector("guid").textContent;
            const title = item.querySelector("title").textContent;
            const link = item.querySelector("link").textContent;

            return { id, title, link };
        })
    }

    return (
        <div>
            <h1>RSS Feed</h1>
            <pre><code>{ feed }</code></pre>
            { loading && <p>Loading</p> }
            { !loading && error && <p>Error: {error.message}</p> }
            { !loading && items &&
                <div>
                    <button onClick={() => items.map(item => transmission.addLink(item.link))}>Add All</button>
                    <ul>
                        {
                            items.map(item => {
                                return (
                                    <li key={item.id}>
                                        <a href={item.link}>
                                            {item.title}
                                        </a>{' '}
                                        <button onClick={() => transmission.addLink(item.link)}>Add</button>
                                    </li>
                                );
                            })
                        }
                    </ul>
                </div>
            }
        </div>
    )
}