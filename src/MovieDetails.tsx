import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Bookmark,
  Check,
  Eye,
  Heart,
  ListPlus,
  Play,
  Plus,
  Star,
  Ticket,
  Trash2,
} from "./icons";
import { movieById, movies, today, users } from "./data";
import { useStore } from "./store";
import {
  Avatar,
  DemoNote,
  Empty,
  Header,
  Img,
  Rail,
  Rating,
  Section,
  Sheet,
  Stars,
  toast,
} from "./components";
import { DiscoveryAssistant } from "./Discovery";
import type { Movie } from "./types";

export function ReviewEditor({
  movie,
  onClose,
}: {
  movie: Movie;
  onClose: () => void;
}) {
  const s = useStore();
  const previous = s.reviews.find((r) => r.movieId === movie.id);
  const [rating, setRating] = useState(previous?.rating ?? 4);
  const [comment, setComment] = useState(previous?.comment ?? "");
  const [date, setDate] = useState(previous?.date ?? today());
  const [spoiler, setSpoiler] = useState(previous?.spoiler ?? false);
  const [publish, setPublish] = useState(false);
  const [remove, setRemove] = useState(false);
  return (
    <Sheet
      title={previous ? "Sua avaliação" : "Registre essa história"}
      onClose={onClose}
    >
      <div className="review-movie">
        <Img src={movie.poster} alt={movie.title} />
        <div>
          <h3>{movie.title}</h3>
          <p>
            {movie.year} · {movie.director}
          </p>
        </div>
      </div>
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          s.saveReview(
            {
              movieId: movie.id,
              rating,
              comment: comment.trim(),
              date,
              spoiler,
            },
            publish,
          );
          toast("Avaliação salva. Seu perfil foi atualizado.");
          onClose();
        }}
      >
        <div className="rating-picker">
          <Stars value={rating} />
          <strong>
            {rating.toFixed(1).replace(".", ",")}
            <small> / 5</small>
          </strong>
          <input
            type="range"
            min="0"
            max="5"
            step="0.5"
            value={rating}
            aria-label="Sua nota"
            onChange={(e) => setRating(+e.target.value)}
          />
          <div>
            <span>0</span>
            <span>Arraste para dar sua nota</span>
            <span>5</span>
          </div>
        </div>
        <label>
          O que ficou com você? <span className="muted">(opcional)</span>
          <textarea
            maxLength={2000}
            rows={4}
            placeholder="Uma cena, um sentimento, uma opinião…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </label>
        <label>
          Data em que assistiu
          <input
            type="date"
            required
            value={date}
            max={today()}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={spoiler}
            onChange={(e) => setSpoiler(e.target.checked)}
          />
          Este comentário contém spoilers
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={publish}
            disabled={s.preferences.privateProfile}
            onChange={(e) => setPublish(e.target.checked)}
          />
          {s.preferences.privateProfile
            ? "Perfil privado: registro só no seu perfil"
            : "Publicar na comunidade local"}
        </label>
        <button className="button primary full" type="submit">
          <Check size={18} />
          Salvar avaliação
        </button>
        {previous && (
          <button
            type="button"
            className="button ghost coral"
            onClick={() => setRemove(true)}
          >
            <Trash2 size={16} />
            Remover avaliação
          </button>
        )}
      </form>
      {remove && (
        <div className="inline-confirm">
          <p>
            Remover sua nota e o comentário? O filme continua nos assistidos.
          </p>
          <button
            className="button primary"
            onClick={() => {
              s.removeReview(previous!.id);
              toast("Avaliação removida");
              onClose();
            }}
          >
            Confirmar remoção
          </button>
          <button className="button ghost" onClick={() => setRemove(false)}>
            Cancelar
          </button>
        </div>
      )}
    </Sheet>
  );
}

function AddToList({ movie, onClose }: { movie: Movie; onClose: () => void }) {
  const s = useStore();
  const [name, setName] = useState("");
  const lists = s.lists.filter((l) => l.userId === "me");
  return (
    <Sheet title="Adicionar a uma lista" onClose={onClose}>
      <p className="muted">{movie.title}</p>
      {lists.map((l) => (
        <button
          className="list-option"
          key={l.id}
          onClick={() => {
            s.toggleListMovie(l.id, movie.id);
            toast(
              l.movies.includes(movie.id)
                ? "Filme removido da lista"
                : "Filme adicionado à lista",
            );
          }}
        >
          <Bookmark size={20} />
          <span>
            {l.name}
            <small>{l.movies.length} filmes</small>
          </span>
          {l.movies.includes(movie.id) ? (
            <Check size={20} />
          ) : (
            <Plus size={20} />
          )}
        </button>
      ))}
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          s.saveList({
            name: name.trim(),
            description: "",
            movies: [movie.id],
            private: s.preferences.privateLists,
          });
          toast("Lista criada com este filme");
          onClose();
        }}
      >
        <label>
          Nova lista
          <input
            value={name}
            maxLength={60}
            required
            onChange={(e) => setName(e.target.value)}
            placeholder="Dê um nome à sua seleção"
          />
        </label>
        <button className="button primary" type="submit">
          <Plus size={18} />
          Criar lista
        </button>
      </form>
    </Sheet>
  );
}

export function MovieDetails() {
  const { id } = useParams();
  const movie = movieById(id);
  const s = useStore();
  const [modal, setModal] = useState<
    "review" | "trailer" | "list" | "assistant" | "gallery" | null
  >(null);
  const [expanded, setExpanded] = useState(false);
  if (!movie)
    return (
      <>
        <Header title="Filme não encontrado" back />
        <Empty
          title="Essa história não está no catálogo"
          text="Volte para descobrir outros filmes."
          action={
            <Link className="button primary" to="/explore">
              Explorar filmes
            </Link>
          }
        />
      </>
    );
  const review = s.reviews.find((r) => r.movieId === id);
  const friends = s.posts.filter((p) => p.movieId === id && p.userId !== "me");
  return (
    <>
      <div className="detail-hero">
        <Img src={movie.backdrop} alt={movie.title} loading="eager" />
        <div className="detail-veil" />
        <Header title="" back />
        <span className="detail-badge badge">
          {movie.cinema ? "SESSÕES ESPECIAIS" : "CATÁLOGO CINE"}
        </span>
      </div>
      <div className="detail-content">
        <div className="detail-title-row">
          <Img src={movie.poster} alt={movie.title} className="detail-poster" />
          <div>
            <span className="eyebrow">{movie.director}</span>
            <h1>{movie.title}</h1>
            <p className="metadata">
              {movie.year} <span>·</span> {movie.duration} min{" "}
              <span className="certificate">{movie.certificate}</span>
            </p>
          </div>
        </div>
        <div className="detail-genre">
          {movie.genres.map((g) => (
            <Link to={`/explore?genre=${encodeURIComponent(g)}`} key={g}>
              {g}
            </Link>
          ))}
        </div>
        <div className="detail-score">
          <div>
            <Rating value={movie.rating} label />
            <span>Média demonstrativa</span>
          </div>
          <div>
            <Stars value={review?.rating ?? movie.rating} />
            <span>
              {review
                ? `Sua nota: ${review.rating.toFixed(1).replace(".", ",")}`
                : "Qual é a sua nota?"}
            </span>
          </div>
          <button
            className="button small secondary"
            onClick={() => setModal("review")}
          >
            {review ? "Editar nota" : "Avaliar"}
          </button>
        </div>
        <div className="movie-actions">
          {(
            [
              { kind: "watchlist", label: "Quero assistir", icon: Bookmark },
              { kind: "watched", label: "Já assisti", icon: Eye },
              { kind: "favorites", label: "Favoritar", icon: Heart },
            ] as const
          ).map(({ kind, label, icon: Icon }) => (
            <button
              key={kind}
              aria-pressed={s[kind].includes(movie.id)}
              className={s[kind].includes(movie.id) ? "active" : ""}
              onClick={() => {
                s.toggleMovie(kind, movie.id);
                toast(
                  s[kind].includes(movie.id)
                    ? `${label}: removido`
                    : `${label}: salvo no perfil`,
                );
              }}
            >
              <Icon
                size={21}
                fill={
                  kind === "favorites" && s.favorites.includes(movie.id)
                    ? "currentColor"
                    : "none"
                }
              />
              <span>{label}</span>
            </button>
          ))}
          <button onClick={() => setModal("list")}>
            <ListPlus size={21} />
            <span>Adicionar à lista</span>
          </button>
        </div>
        <div className="detail-ctas">
          {movie.cinema && (
            <Link className="button primary" to={`/sessions/${movie.id}`}>
              <Ticket size={18} />
              Ver sessões
            </Link>
          )}
          {movie.trailer && (
            <button
              className="button secondary"
              onClick={() => setModal("trailer")}
            >
              <Play size={17} />
              Trailer
            </button>
          )}
        </div>
        <section className="detail-section">
          <h2>A história</h2>
          <p className={expanded ? "synopsis" : "synopsis clamped"}>
            {movie.synopsis}
          </p>
          <button
            className="text-button coral"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Ler menos" : "Ler sinopse completa"}
          </button>
        </section>
        <section className="detail-section">
          <div className="section-heading">
            <h2>Quem dá vida à história</h2>
            <span className="muted">Elenco</span>
          </div>
          <div className="cast-rail">
            {movie.cast.map((c) => (
              <Link
                key={c.name}
                to={`/explore?tab=people&q=${encodeURIComponent(c.name)}`}
              >
                <span className="cast-photo">
                  {c.photo ? (
                    <Img src={c.photo} alt={c.name} />
                  ) : (
                    <span>
                      {c.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                  )}
                </span>
                <strong>{c.name}</strong>
                <small>{c.role}</small>
              </Link>
            ))}
          </div>
        </section>
        <section className="detail-section">
          <h2>Dentro do filme</h2>
          <button
            className="gallery-preview"
            onClick={() => setModal("gallery")}
          >
            <Img
              src={movie.gallery[0]}
              alt={`Abrir galeria de ${movie.title}`}
            />
            <span>
              Ver galeria <Plus size={16} />
            </span>
          </button>
        </section>
        <section className="detail-section">
          <h2>O que a comunidade achou</h2>
          {friends.length ? (
            friends.map((p) => {
              const u = users.find((x) => x.id === p.userId)!;
              return (
                <div className="friend-review" key={p.id}>
                  <Link to={`/profile/${u.id}`}>
                    <Avatar user={u} size="small" />
                    <strong>{u.name}</strong>
                  </Link>
                  <Stars value={p.rating ?? 0} />
                  {p.spoiler ? (
                    <details>
                      <summary>Contém spoiler · revelar</summary>
                      <p>{p.text}</p>
                    </details>
                  ) : (
                    <p>{p.text}</p>
                  )}
                </div>
              );
            })
          ) : (
            <div className="quiet-empty">
              <Star size={22} />
              <p>A primeira opinião pode ser sua.</p>
              <button
                className="text-button coral"
                onClick={() => setModal("review")}
              >
                Escrever avaliação
              </button>
            </div>
          )}
        </section>
        <section className="detail-section">
          <h2>Onde assistir</h2>
          <p className="muted">
            {movie.cinema
              ? "Há sessões demonstrativas cadastradas para este filme."
              : "Disponibilidade de streaming não cadastrada."}
          </p>
          {movie.cinema && (
            <Link className="text-link coral" to={`/sessions/${movie.id}`}>
              Encontrar uma sessão <Ticket size={16} />
            </Link>
          )}
        </section>
      </div>
      <Section
        title="A próxima pode ser esta"
        link={`/explore?genre=${encodeURIComponent(movie.genres[0])}`}
      >
        <Rail
          items={movies.filter(
            (m) =>
              m.id !== id && m.genres.some((g) => movie.genres.includes(g)),
          )}
        />
      </Section>
      <button
        className="button secondary assistant-detail"
        onClick={() => setModal("assistant")}
      >
        Mais sugestões para você
      </button>
      <DemoNote />
      {modal === "review" && (
        <ReviewEditor movie={movie} onClose={() => setModal(null)} />
      )}{" "}
      {modal === "list" && (
        <AddToList movie={movie} onClose={() => setModal(null)} />
      )}{" "}
      {modal === "assistant" && (
        <DiscoveryAssistant movieId={movie.id} onClose={() => setModal(null)} />
      )}{" "}
      {modal === "gallery" && (
        <Sheet
          title={`Galeria · ${movie.title}`}
          onClose={() => setModal(null)}
        >
          {movie.gallery.map((src) => (
            <Img
              key={src}
              src={src}
              alt={`Imagem de ${movie.title}`}
              className="gallery-image"
            />
          ))}
        </Sheet>
      )}{" "}
      {modal === "trailer" && (
        <Sheet
          title={`Trailer · ${movie.title}`}
          onClose={() => setModal(null)}
        >
          <div className="video-container">
            <iframe
              title={`Trailer de ${movie.title}`}
              src={`https://www.youtube-nocookie.com/embed/${movie.trailer}`}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
          <p className="muted">
            O vídeo precisa de internet. Caso não carregue, abra no YouTube.
          </p>
          <a
            className="button secondary full"
            target="_blank"
            rel="noreferrer"
            href={`https://www.youtube.com/watch?v=${movie.trailer}`}
          >
            <Play size={17} />
            Abrir trailer no YouTube
          </a>
        </Sheet>
      )}
    </>
  );
}
