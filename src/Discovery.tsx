import { useLayoutEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Film,
  Heart,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "./icons";
import { movies, genres, users } from "./data";
import { useStore } from "./store";
import { motion } from "motion/react";
import { BlurWords, useQuietMotion } from "./animations";
import {
  Avatar,
  DemoNote,
  Empty,
  Header,
  IconButton,
  Img,
  ListCard,
  Poster,
  Rail,
  Rating,
  SearchField,
  Section,
  Sheet,
  Tabs,
  toast,
} from "./components";

export function Onboarding() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const finish = useStore((s) => s.finishOnboarding);
  const nav = useNavigate();
  const done = () => {
    finish(selected, favorites);
    nav("/", { replace: true });
  };
  return (
    <div className="onboarding">
      <header>
        <span className="brand">
          cine<span>.</span>
        </span>
        <button className="text-button" onClick={done}>
          Pular
        </button>
      </header>
      {step === 0 ? (
        <>
          <div className="onboarding-collage">
            {[
              movies[6],
              movies[0],
              movies[8],
              movies[2],
              movies[4],
              movies[1],
            ].map((m) => (
              <Img src={m.poster} alt={m.title} key={m.id} loading="eager" />
            ))}
          </div>
          <div className="welcome-copy">
            <span className="eyebrow">PARA QUEM VIVE CINEMA</span>
            <h1>
              Sua próxima
              <br />
              história começa
              <br />
              <em>aqui.</em>
            </h1>
            <p>
              Descubra filmes. Guarde momentos.
              <br />
              Encontre quem sente o mesmo.
            </p>
          </div>
        </>
      ) : step === 1 ? (
        <div className="onboard-step" key="genres">
          <span className="eyebrow">01 / SEU UNIVERSO</span>
          <h1>
            Que tipo de história
            <br />
            te prende?
          </h1>
          <p>Escolha seus gêneros favoritos. Você pode mudar depois.</p>
          <div className="genre-grid">
            {genres.map((g) => (
              <button
                className={`genre-tile ${selected.includes(g) ? "active" : ""}`}
                key={g}
                aria-pressed={selected.includes(g)}
                onClick={() =>
                  setSelected((v) =>
                    v.includes(g) ? v.filter((x) => x !== g) : [...v, g],
                  )
                }
              >
                {g}
                {selected.includes(g) ? (
                  <Check size={17} />
                ) : (
                  <Plus size={17} />
                )}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="onboard-step" key="favorites">
          <span className="eyebrow">02 / SEUS INESQUECÍVEIS</span>
          <h1>
            Alguns filmes
            <br />
            ficam com a gente.
          </h1>
          <p>Toque nos seus favoritos para começar sua coleção.</p>
          <div className="onboard-posters">
            {movies.slice(0, 9).map((m) => (
              <button
                className={favorites.includes(m.id) ? "chosen" : ""}
                aria-label={`Favoritar ${m.title}`}
                aria-pressed={favorites.includes(m.id)}
                key={m.id}
                onClick={() =>
                  setFavorites((v) =>
                    v.includes(m.id)
                      ? v.filter((x) => x !== m.id)
                      : [...v, m.id],
                  )
                }
              >
                <Img src={m.poster} alt={m.title} />
                <span>
                  <Check size={20} />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="onboard-bottom">
        <div className="dots">
          {[0, 1, 2].map((i) => (
            <span key={i} className={i === step ? "active" : ""} />
          ))}
        </div>
        <button
          className="button primary full"
          onClick={() => (step < 2 ? setStep(step + 1) : done())}
        >
          {step === 0
            ? "Encontre sua próxima história"
            : step === 1
              ? "Continuar"
              : "Entrar no Cine"}
          <ArrowRight size={19} />
        </button>
        {step === 0 ? (
          <button className="button ghost full" onClick={done}>
            Entrar como visitante
          </button>
        ) : (
          <button
            className="button ghost full"
            onClick={() => setStep(step - 1)}
          >
            Voltar
          </button>
        )}
        <small>Sem conta. Só você e o cinema.</small>
      </div>
    </div>
  );
}

const discoveryMemory = { feature: 0, tab: "you" };

function FeatureCarousel() {
  const quiet = useQuietMotion();
  const featured = [movies[1], movies[2], movies[6], movies[4], movies[8]];
  const [active, setActive] = useState(discoveryMemory.feature);
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el)
      el.scrollTo({
        left: discoveryMemory.feature * el.clientWidth,
        behavior: "instant",
      });
  }, []);
  const go = (n: number) => {
    const el = ref.current;
    if (el)
      el.scrollTo({
        left: n * el.clientWidth,
        behavior:
          window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
          useStore.getState().preferences.reducedMotion
            ? "instant"
            : "smooth",
      });
  };
  return (
    <div
      className="feature-carousel"
      style={{
        background: `radial-gradient(ellipse at 50% 35%, ${featured[active].color}40, transparent 70%)`,
      }}
    >
      <div
        className="carousel-track"
        ref={ref}
        onScroll={(e) => {
          const el = e.currentTarget;
          discoveryMemory.feature = Math.min(
            featured.length - 1,
            Math.max(0, Math.round(el.scrollLeft / el.clientWidth)),
          );
          setActive(discoveryMemory.feature);
        }}
      >
        {featured.map((m, i) => (
          <div className="carousel-slide" key={m.id}>
            <Link to={`/movie/${m.id}`} tabIndex={i === active ? 0 : -1}>
              <Img
                src={
                  featured[(i + featured.length - 1) % featured.length].poster
                }
                alt=""
                className="side-poster left"
              />
              <Img
                src={featured[(i + 1) % featured.length].poster}
                alt=""
                className="side-poster right"
              />
              <Img src={m.poster} alt={m.title} className="center-poster" />
            </Link>
          </div>
        ))}
      </div>
      <motion.div
        className="carousel-caption"
        key={active}
        initial={quiet ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: quiet ? 0 : 0.32 }}
      >
        <span className="eyebrow">ESCOLHIDO PARA A SUA PRÓXIMA SESSÃO</span>
        <h3>{featured[active].title}</h3>
        <p>
          <Rating value={featured[active].rating} /> <span>·</span>{" "}
          {featured[active].year} <span>·</span> {featured[active].genres[0]}
        </p>
      </motion.div>
      <div className="carousel-controls">
        <IconButton
          label="Filme anterior"
          onClick={() => go(Math.max(0, active - 1))}
          disabled={active === 0}
        >
          <ChevronLeft size={18} />
        </IconButton>
        <div className="dots">
          {featured.map((m, i) => (
            <button
              aria-label={`Mostrar ${m.title}`}
              aria-pressed={i === active}
              key={m.id}
              className={i === active ? "active" : ""}
              onClick={() => go(i)}
            />
          ))}
        </div>
        <IconButton
          label="Próximo filme"
          onClick={() => go(Math.min(featured.length - 1, active + 1))}
          disabled={active === featured.length - 1}
        >
          <ChevronRight size={18} />
        </IconButton>
      </div>
    </div>
  );
}

export function Home() {
  const s = useStore();
  const [tab, updateTab] = useState(discoveryMemory.tab);
  const setTab = (value: string) => {
    discoveryMemory.tab = value;
    updateTab(value);
  };
  const [assistant, setAssistant] = useState(false);
  const hero = movies[0];
  const saved = s.watchlist.includes(hero.id);
  const favoritesGenres = movies
    .filter((m) => s.favorites.includes(m.id))
    .flatMap((m) => m.genres);
  const ranked = [...movies].sort(
    (a, b) =>
      b.genres.filter(
        (g) => s.preferences.genres.includes(g) || favoritesGenres.includes(g),
      ).length -
      a.genres.filter(
        (g) => s.preferences.genres.includes(g) || favoritesGenres.includes(g),
      ).length,
  );
  return (
    <>
      <header className="home-header">
        <Link to="/" className="brand" aria-label="Cine início">
          cine<span>.</span>
        </Link>
        <div className="header-actions">
          <Link
            to="/explore"
            className="icon-button"
            aria-label="Buscar filmes"
          >
            <Search size={21} />
          </Link>
          <Link
            to="/notifications"
            className="icon-button notification-button"
            aria-label="Notificações"
          >
            <Bell size={21} />
            {s.notices.some((n) => !n.read) && <span />}
          </Link>
          <Link to="/profile" aria-label="Meu perfil">
            <Avatar user={s.profile} size="small" />
          </Link>
        </div>
      </header>
      <div className="home-intro">
        <p>SEU ENCONTRO DIÁRIO COM O CINEMA</p>
        <h1>
          <BlurWords text="O que vamos ver hoje?" />
        </h1>
      </div>
      <div className="home-tabs">
        <Tabs
          options={[
            { id: "you", label: "Para você" },
            { id: "trending", label: "Em alta" },
            { id: "cinema", label: "Nos cinemas" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>
      {tab === "you" ? (
        <>
          <section className="hero">
            <Img
              src={hero.backdrop}
              alt="Paul Atreides entre as dunas de Arrakis"
              className="hero-background"
              loading="eager"
            />
            <div className="hero-shade" />
            <div className="hero-top">
              <span className="badge">
                <span /> ESCOLHA DA SEMANA
              </span>
              <span className="hero-index">CINE SELECT</span>
            </div>
            <div className="hero-content">
              <p className="eyebrow">UMA OBRA DE DENIS VILLENEUVE</p>
              <h2 className="dune-title">
                DUNA<span>PARTE DOIS</span>
              </h2>
              <div className="hero-meta">
                <Rating value={hero.rating} label />
                <span>2024</span>
                <span>Ficção científica</span>
              </div>
              <p className="hero-description">
                Algumas jornadas mudam tudo.
                <br />
                Esta atravessa o universo.
              </p>
              <div className="hero-actions">
                <Link className="button primary" to="/movie/dune">
                  Ver detalhes <ArrowRight size={17} />
                </Link>
                <button
                  className={`button secondary ${saved ? "is-saved" : ""}`}
                  onClick={() => {
                    s.toggleMovie("watchlist", "dune");
                    toast(
                      saved
                        ? "Removido da sua lista"
                        : "Adicionado a Quero assistir",
                    );
                  }}
                >
                  {saved ? <Check size={17} /> : <Plus size={17} />}{" "}
                  {saved ? "Na sua lista" : "Quero assistir"}
                </button>
              </div>
            </div>
          </section>
          <Section
            title="Feitos para o seu gosto"
            kicker="PARA VOCÊ"
            link="/explore"
          >
            <Rail items={ranked.slice(0, 8)} />
          </Section>
          <Section title="Uma boa história espera" kicker="SAIA DO ÓBVIO">
            <FeatureCarousel />
          </Section>
          <Section
            title="A magia da tela grande"
            kicker="NOS CINEMAS"
            link="/explore?cinema=1"
          >
            <Rail items={movies.filter((m) => m.cinema)} />
          </Section>
          <Section
            title="Seus amigos assistiram"
            kicker="CINEMA É MELHOR JUNTO"
            link="/community"
          >
            <div className="friend-films">
              {s.posts
                .filter((p) => p.userId !== "me" && p.rating !== undefined)
                .slice(0, 3)
                .map((p) => {
                  const u = users.find((u) => u.id === p.userId)!;
                  const m = movies.find((m) => m.id === p.movieId)!;
                  return (
                    <Link to={`/movie/${m.id}`} key={p.id}>
                      <Img src={m.backdrop} alt="" />
                      <div>
                        <Avatar user={u} size="small" />
                        <p>
                          <strong>{u.name.split(" ")[0]}</strong> assistiu
                          <br />
                          <b>{m.title}</b>
                        </p>
                        <Rating value={p.rating!} />
                      </div>
                    </Link>
                  );
                })}
            </div>
          </Section>
          <button
            className="assistant-banner"
            onClick={() => setAssistant(true)}
          >
            <span className="assistant-icon">
              <Sparkles size={23} />
            </span>
            <span>
              <strong>Sem ideia do que assistir?</strong>
              <small>Encontre um filme para o seu momento.</small>
            </span>
            <ArrowRight size={19} />
          </button>
        </>
      ) : (
        <div className="padded">
          <p className="muted">
            {tab === "cinema"
              ? "Reprises especiais · sessões demonstrativas"
              : "As histórias favoritas da nossa comunidade demo"}
          </p>
          <div className="poster-grid">
            {(tab === "cinema"
              ? movies.filter((m) => m.cinema)
              : [...movies].sort((a, b) => b.rating - a.rating)
            ).map((m) => (
              <Poster key={m.id} movie={m} />
            ))}
          </div>
        </div>
      )}
      <DemoNote />
      {assistant && <DiscoveryAssistant onClose={() => setAssistant(false)} />}
    </>
  );
}

export function DiscoveryAssistant({
  onClose,
  movieId,
}: {
  onClose: () => void;
  movieId?: string;
}) {
  const [mode, setMode] = useState("similar");
  const base = movies.find((m) => m.id === movieId) ?? movies[0];
  const selected =
    mode === "short"
      ? movies.filter((m) => m.duration <= 90)
      : movies
          .filter(
            (m) =>
              m.id !== base.id && m.genres.some((g) => base.genres.includes(g)),
          )
          .slice(0, 5);
  return (
    <Sheet title="Encontre sua próxima história" onClose={onClose}>
      <DemoNote>Sugestões do catálogo local · sem IA conectada</DemoNote>
      <div className="chip-row wrap">
        {[
          { id: "similar", label: "Filmes parecidos" },
          { id: "short", label: "Até 90 minutos" },
          { id: "explain", label: "Explique sem spoilers" },
        ].map((o) => (
          <button
            className={`chip ${mode === o.id ? "active" : ""}`}
            key={o.id}
            onClick={() => setMode(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {mode === "explain" ? (
        <div className="assistant-answer">
          <span className="eyebrow">{base.title}</span>
          <p>{base.synopsis}</p>
          <p className="muted">
            Uma sugestão para quem gosta de{" "}
            {base.genres.join(" e ").toLowerCase()}. Esta é uma sinopse
            cadastrada, sem geração de texto por IA.
          </p>
        </div>
      ) : (
        <>
          <p className="muted">
            {mode === "short"
              ? "Pouco tempo também rende uma boa história."
              : `Se você gosta de ${base.title}, experimente:`}
          </p>
          <div className="poster-grid three">
            {selected.map((m) => (
              <div key={m.id} onClick={onClose}>
                <Poster movie={m} />
              </div>
            ))}
          </div>
        </>
      )}
    </Sheet>
  );
}

export function Explore() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const type = params.get("tab") ?? "movies";
  const genre = params.get("genre") ?? "";
  const year = params.get("year") ?? "";
  const rating = params.get("rating") ?? "";
  const content = params.get("content") ?? "";
  const cinema = params.get("cinema") === "1";
  const [filters, setFilters] = useState(false);
  const s = useStore();
  const set = (key: string, val: string) => {
    setParams(
      (p) => {
        const n = new URLSearchParams(p);
        val ? n.set(key, val) : n.delete(key);
        return n;
      },
      { replace: true },
    );
  };
  const normalized = (v: string) =>
    v
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const match = (v: string) => normalized(v).includes(normalized(q));
  const results = movies.filter(
    (m) =>
      (match(m.title) || match(m.original)) &&
      (!genre || m.genres.includes(genre)) &&
      (!year || String(m.year) === year) &&
      (!rating || m.rating >= +rating) &&
      (!content || m.type === content) &&
      (!cinema || m.cinema),
  );
  const filteredUsers = [s.profile, ...users].filter(
    (u) => match(u.name) || match(u.bio),
  );
  const people = [
    ...new Map(
      movies
        .flatMap((m) => [
          { name: m.director, type: "Direção" },
          ...m.cast.map((c) => ({ name: c.name, type: "Elenco" })),
        ])
        .filter((p) => match(p.name))
        .map((p) => [p.name, p]),
    ).values(),
  ];
  const lists = s.lists.filter((l) => match(l.name) || match(l.description));
  const count =
    type === "movies"
      ? results.length
      : type === "people"
        ? filteredUsers.length + people.length
        : lists.length;
  const active = [
    genre,
    year,
    rating ? `Nota ${rating}+` : "",
    content,
    cinema ? "Nos cinemas" : "",
  ].filter(Boolean);
  return (
    <>
      <Header
        title="Explorar"
        subtitle="Um universo de histórias para descobrir."
      />
      <div className="padded">
        <div className="search-row">
          <SearchField value={q} onChange={(v) => set("q", v)} />
          <IconButton
            label="Filtros"
            className={active.length ? "filter-active" : ""}
            onClick={() => setFilters(true)}
          >
            <SlidersHorizontal size={21} />
            {active.length > 0 && <b>{active.length}</b>}
          </IconButton>
        </div>
        <Tabs
          options={[
            { id: "movies", label: "Filmes" },
            { id: "people", label: "Pessoas" },
            { id: "lists", label: "Listas" },
          ]}
          value={type}
          onChange={(v) => set("tab", v)}
        />
        {type === "movies" && (
          <>
            <div className="chip-row">
              <button
                className={`chip ${!genre ? "active" : ""}`}
                onClick={() => set("genre", "")}
              >
                Todos
              </button>
              {genres.map((g) => (
                <button
                  className={`chip ${genre === g ? "active" : ""}`}
                  key={g}
                  onClick={() => set("genre", genre === g ? "" : g)}
                >
                  {g}
                </button>
              ))}
            </div>
            {active.length > 0 && (
              <div className="active-filters">
                <span>{active.join(" · ")}</span>
                <button
                  className="text-button coral"
                  onClick={() => setParams(q ? { q } : {}, { replace: true })}
                >
                  Limpar filtros <X size={14} />
                </button>
              </div>
            )}
          </>
        )}
        <div className="results-heading">
          <span>
            {count} {count === 1 ? "resultado" : "resultados"}
          </span>
          <span>{q ? `“${q}”` : "CATÁLOGO CINE"}</span>
        </div>
        {count === 0 ? (
          <Empty
            title="Ainda não encontramos essa história"
            text="Tente outro título ou remova alguns filtros."
            action={
              <button
                className="button secondary"
                onClick={() => setParams({})}
              >
                Limpar busca e filtros
              </button>
            }
          />
        ) : type === "movies" ? (
          <div className="poster-grid three">
            {results.map((m) => (
              <Poster key={m.id} movie={m} />
            ))}
          </div>
        ) : type === "people" ? (
          <div className="people-results">
            {filteredUsers.map((u) => (
              <Link
                className="person-row"
                to={u.id === "me" ? "/profile" : `/profile/${u.id}`}
                key={u.id}
              >
                <Avatar user={u} />
                <div>
                  <strong>{u.name}</strong>
                  <p>{u.bio}</p>
                  <small>Perfil demonstrativo</small>
                </div>
                <ChevronRight size={18} />
              </Link>
            ))}
            {people.map((p) => (
              <details key={p.name} className="person-result">
                <summary>
                  <span className="person-initial">{p.name[0]}</span>
                  <span>
                    <strong>{p.name}</strong>
                    <small>{p.type} · ver filmes</small>
                  </span>
                  <ChevronRight size={18} />
                </summary>
                <Rail
                  items={movies.filter(
                    (m) =>
                      m.director === p.name ||
                      m.cast.some((c) => c.name === p.name),
                  )}
                />
              </details>
            ))}
          </div>
        ) : (
          <div className="lists-grid">
            {lists.map((l) => (
              <ListCard key={l.id} list={l} />
            ))}
          </div>
        )}
      </div>
      {filters && (
        <Sheet title="Do seu jeito" onClose={() => setFilters(false)}>
          <div className="form-stack">
            <label>
              Gênero
              <select
                value={genre}
                onChange={(e) => set("genre", e.target.value)}
              >
                <option value="">Todos os gêneros</option>
                {genres.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </label>
            <label>
              Ano
              <select
                value={year}
                onChange={(e) => set("year", e.target.value)}
              >
                <option value="">Todos os anos</option>
                {[...new Set(movies.map((m) => m.year))]
                  .sort((a, b) => b - a)
                  .map((y) => (
                    <option key={y}>{y}</option>
                  ))}
              </select>
            </label>
            <label>
              Tipo de conteúdo
              <select
                value={content}
                onChange={(e) => set("content", e.target.value)}
              >
                <option value="">Todos</option>
                <option>Filme</option>
                <option>Curta</option>
              </select>
            </label>
            <label>
              Nota média mínima
              <select
                value={rating}
                onChange={(e) => set("rating", e.target.value)}
              >
                <option value="">Qualquer nota</option>
                <option value="4">4 de 5</option>
                <option value="4.5">4,5 de 5</option>
              </select>
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={cinema}
                onChange={(e) => set("cinema", e.target.checked ? "1" : "")}
              />
              Só com sessões disponíveis
            </label>
            <button
              className="button primary full"
              onClick={() => setFilters(false)}
            >
              Mostrar {results.length}{" "}
              {results.length === 1 ? "filme" : "filmes"}{" "}
              <ArrowRight size={17} />
            </button>
            <button
              className="button ghost"
              onClick={() => setParams(q ? { q } : {}, { replace: true })}
            >
              Limpar filtros
            </button>
          </div>
        </Sheet>
      )}
    </>
  );
}
