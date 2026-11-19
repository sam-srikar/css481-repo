import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 8;

function useShowSearch() {
  const [query, setQuery] = useState("star");
  const [shows, setShows] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setStatus("loading");
      try {
        const response = await fetch(
          `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error("The show search failed.");
        const data = await response.json();
        setShows(data.map((item) => item.show));
        setStatus("ready");
      } catch (error) {
        if (error.name !== "AbortError") setStatus("error");
      }
    }
    load();
    return () => controller.abort();
  }, [query]);

  return { query, setQuery, shows, status };
}

function ShowCard({ show, onOpen }) {
  const image = show.image?.medium || show.image?.original;
  return (
    <article className="show-card">
      <button type="button" onClick={() => onOpen(show.id)} aria-label={`View ${show.name}`}>
        {image ? (
          <img src={image} alt={`${show.name} poster`} />
        ) : (
          <div className="poster-placeholder" aria-label="No poster available">No image</div>
        )}
        <span className="show-card-body">
          <strong>{show.name}</strong>
          <span>{show.premiered?.slice(0, 4) || "Unknown year"} · {show.type || "Show"}</span>
        </span>
      </button>
    </article>
  );
}

function SearchResults({ shows, status, onOpen }) {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [shows]);

  const pageCount = Math.max(1, Math.ceil(shows.length / PAGE_SIZE));
  const visibleShows = useMemo(
    () => shows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [shows, page]
  );

  return (
    <>
      {status === "loading" && <p className="status-message" role="status">Loading shows...</p>}
      {status === "error" && <p className="status-message error" role="alert">Unable to load shows. Please try again.</p>}
      {status === "ready" && shows.length === 0 && (
        <p className="status-message">No shows found. Try another search.</p>
      )}
      {status === "ready" && (
        <>
          <div className="results-heading">
            <h2>Results</h2>
            <span>{shows.length} found</span>
          </div>
          <section className="show-grid" aria-label="Search results">
            {visibleShows.map((show) => (
              <ShowCard key={show.id} show={show} onOpen={onOpen} />
            ))}
          </section>
          {pageCount > 1 && (
            <nav className="pagination" aria-label="Pagination">
              <button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>
                Previous
              </button>
              <span>Page {page} of {pageCount}</span>
              <button type="button" disabled={page === pageCount} onClick={() => setPage((value) => value + 1)}>
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </>
  );
}

function ShowDetail({ id, onBack }) {
  const [show, setShow] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setStatus("loading");
      try {
        const response = await fetch(`https://api.tvmaze.com/shows/${id}?embed=cast`, {
          signal: controller.signal
        });
        if (!response.ok) throw new Error("Show details failed.");
        setShow(await response.json());
        setStatus("ready");
      } catch (error) {
        if (error.name !== "AbortError") setStatus("error");
      }
    }
    load();
    return () => controller.abort();
  }, [id]);

  if (status === "loading") return <p className="status-message" role="status">Loading show details...</p>;
  if (status === "error") return <p className="status-message error" role="alert">Unable to load show details.</p>;

  const cast = show._embedded?.cast?.slice(0, 6) || [];
  return (
    <article className="detail">
      <button className="back-button" type="button" onClick={onBack}>← Back to results</button>
      <div className="detail-layout">
        {show.image?.original ? (
          <img className="detail-poster" src={show.image.original} alt={`${show.name} poster`} />
        ) : (
          <div className="detail-poster poster-placeholder">No image</div>
        )}
        <div className="detail-copy">
          <h1>{show.name}</h1>
          <div className="detail-meta">
            {show.premiered && <span>{show.premiered.slice(0, 4)}–{show.ended?.slice(0, 4) || "Present"}</span>}
            {show.rating?.average && <span>★ {show.rating.average}/10</span>}
            {show.runtime && <span>{show.runtime} min</span>}
          </div>
          <p>{show.summary?.replace(/<[^>]+>/g, "") || "No description available."}</p>
          {show.genres?.length > 0 && (
            <div className="genres" aria-label="Genres">
              {show.genres.map((genre) => <span key={genre}>{genre}</span>)}
            </div>
          )}
          {cast.length > 0 && (
            <div className="cast">
              <h2>Cast</h2>
              <ul>{cast.map((entry) => <li key={entry.person.id}>{entry.person.name}</li>)}</ul>
            </div>
          )}
          {show.officialSite && (
            <a className="official-link" href={show.officialSite} target="_blank" rel="noreferrer">
              Visit official site
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export default function App() {
  const { query, setQuery, shows, status } = useShowSearch();
  const [draft, setDraft] = useState(query);
  const [selectedId, setSelectedId] = useState(() => getHashId());

  useEffect(() => {
    const handleHashChange = () => setSelectedId(getHashId());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  function submitSearch(event) {
    event.preventDefault();
    const nextQuery = draft.trim();
    if (nextQuery) setQuery(nextQuery);
  }

  function openShow(id) {
    window.location.hash = `#/show/${id}`;
  }

  function backToResults() {
    window.history.pushState("", document.title, window.location.pathname + window.location.search);
    setSelectedId(null);
  }

  return (
    <div className="movie-app">
      <div className="shell">
        <header className="app-header">
          <a className="brand" href="index.html">CSS481</a>
          <h1>Picture &amp; Movie Database</h1>
        </header>

        {selectedId ? (
          <ShowDetail id={selectedId} onBack={backToResults} />
        ) : (
          <main>
            <form className="search-form" onSubmit={submitSearch} role="search">
              <label htmlFor="show-search">Search for a show or movie</label>
              <div>
                <input
                  id="show-search"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Try Game of Thrones"
                />
                <button type="submit">Search</button>
              </div>
            </form>
            <SearchResults shows={shows} status={status} onOpen={openShow} />
          </main>
        )}
      </div>
    </div>
  );
}

function getHashId() {
  const match = window.location.hash.match(/^#\/show\/(\d+)$/);
  return match ? match[1] : null;
}
