import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  Check,
  ChevronRight,
  Heart,
  ListPlus,
  MessageCircle,
  Plus,
  Send,
  Star,
  Users,
  Eye,
} from "./icons";
import { formatDate, movieById, movies, users } from "./data";
import { useStore } from "./store";
import {
  Avatar,
  DemoNote,
  Empty,
  Header,
  IconButton,
  Img,
  ListCover,
  MovieRow,
  SearchField,
  Sheet,
  Stars,
  Tabs,
  toast,
} from "./components";
import { ReviewEditor } from "./MovieDetails";
import type { Post, Movie } from "./types";

export function PostCard({ post }: { post: Post }) {
  const s = useStore();
  const user =
    post.userId === "me" ? s.profile : users.find((u) => u.id === post.userId)!;
  const movie = movieById(post.movieId)!;
  const list = s.lists.find((l) => l.id === post.listId);
  const [revealed, setRevealed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState(false);
  const [text, setText] = useState("");
  return (
    <article className="post-card">
      <div className="post-author">
        <Link to={user.id === "me" ? "/profile" : `/profile/${user.id}`}>
          <Avatar user={user} />
          <span>
            <strong>{user.name}</strong>
            <small>
              {post.listId ? "compartilhou uma lista" : "registrou um filme"} ·{" "}
              {formatDate(post.date)}
            </small>
          </span>
        </Link>
        <span className="sample-label">
          {user.id === "me" ? "VOCÊ" : "DEMO"}
        </span>
      </div>
      {list ? (
        <Link className="post-list" to={`/list/${list.id}`}>
          <ListCover list={list} />
          <div>
            <span className="eyebrow">UMA LISTA PARA GUARDAR</span>
            <h3>{list.name}</h3>
            <p>
              {list.movies.length} filmes <ArrowRight size={15} />
            </p>
          </div>
        </Link>
      ) : (
        <Link className="post-movie" to={`/movie/${movie.id}`}>
          <Img src={movie.backdrop} alt={movie.title} />
          <div>
            <span>
              {movie.year} · {movie.genres[0]}
            </span>
            <h3>{movie.title}</h3>
            {post.rating !== undefined && <Stars value={post.rating} />}
          </div>
          <span className="post-mini-poster">
            <Img src={movie.poster} alt="" />
          </span>
        </Link>
      )}
      {post.spoiler && !revealed ? (
        <button className="spoiler-mask" onClick={() => setRevealed(true)}>
          <EyeIcon />
          <strong>Essa conversa tem spoilers</strong>
          <span>Toque para revelar</span>
        </button>
      ) : (
        <div className="post-text">
          <p className={!expanded ? "clamped" : ""}>{post.text}</p>
          {post.text.length > 220 && (
            <button
              className="text-button coral"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Ler menos" : "Continuar lendo"}
            </button>
          )}
          {post.spoiler && (
            <button className="text-button" onClick={() => setRevealed(false)}>
              Ocultar spoiler
            </button>
          )}
        </div>
      )}
      <div className="post-actions">
        <button
          className={post.liked ? "coral" : ""}
          aria-label={`${post.liked ? "Descurtir" : "Curtir"} publicação de ${user.name}`}
          aria-pressed={post.liked}
          onClick={() => s.togglePost(post.id, "liked")}
        >
          <Heart size={20} fill={post.liked ? "currentColor" : "none"} />
          {post.likes}
        </button>
        <button
          aria-label={`Comentar publicação de ${user.name}`}
          onClick={() => setComments(true)}
        >
          <MessageCircle size={20} />
          {post.comments.length}
        </button>
        <button
          className={`save-post ${post.saved ? "coral" : ""}`}
          aria-label={
            post.saved ? "Remover publicação dos salvos" : "Salvar publicação"
          }
          aria-pressed={post.saved}
          onClick={() => {
            s.togglePost(post.id, "saved");
            toast(
              post.saved
                ? "Publicação removida dos salvos"
                : "Publicação salva",
            );
          }}
        >
          <Bookmark size={20} fill={post.saved ? "currentColor" : "none"} />
        </button>
      </div>
      {comments && (
        <Sheet title="A conversa continua" onClose={() => setComments(false)}>
          <MovieRow movie={movie} />
          {post.comments.length ? (
            <div className="comments">
              {post.comments.map((c) => {
                const u =
                  c.userId === "me"
                    ? s.profile
                    : users.find((u) => u.id === c.userId)!;
                return (
                  <div className="comment" key={c.id}>
                    <Avatar user={u} size="small" />
                    <div>
                      <strong>{u.name}</strong>
                      <p>{c.text}</p>
                      <small>{formatDate(c.date)}</small>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="muted">Seja a primeira pessoa a comentar.</p>
          )}
          <form
            className="composer"
            onSubmit={(e) => {
              e.preventDefault();
              if (!text.trim()) return;
              s.comment(post.id, text);
              setText("");
              toast("Comentário publicado localmente");
            }}
          >
            <input
              aria-label="Seu comentário"
              placeholder="O que você achou?"
              value={text}
              maxLength={1000}
              onChange={(e) => setText(e.target.value)}
              enterKeyHint="send"
            />
            <button
              type="submit"
              className="composer-submit"
              aria-label="Publicar comentário"
              disabled={!text.trim()}
            >
              <Send size={19} />
            </button>
          </form>
        </Sheet>
      )}
    </article>
  );
}
function EyeIcon() {
  return (
    <span className="spoiler-icon">
      <Eye size={21} />
    </span>
  );
}

export function Community() {
  const s = useStore();
  const [tab, setTab] = useState("all");
  const [publish, setPublish] = useState(false);
  const [review, setReview] = useState<Movie | null>(null);
  const [query, setQuery] = useState("");
  const feed = s.posts
    .filter(
      (p) =>
        !(p.userId === "me" && s.preferences.privateProfile) &&
        (!p.listId ||
          (!s.lists.find((l) => l.id === p.listId)?.private &&
            !(p.userId === "me" && s.preferences.privateLists))),
    )
    .filter(
      (p) =>
        tab === "all" ||
        (tab === "following" ? s.following.includes(p.userId) : p.saved),
    );
  return (
    <>
      <Header
        title="Entre cenas"
        subtitle="O cinema continua depois dos créditos."
      >
        <Link to="/chats" className="icon-button" aria-label="Conversas">
          <MessageCircle size={22} />
        </Link>
      </Header>
      <div className="community-people">
        {users.map((u) => (
          <Link to={`/profile/${u.id}`} key={u.id}>
            <div>
              <Avatar user={u} />
            </div>
            <span>{u.name.split(" ")[0]}</span>
          </Link>
        ))}
      </div>
      <div className="padded">
        <button className="publish-prompt" onClick={() => setPublish(true)}>
          <Avatar user={s.profile} size="small" />
          <span>Que história ficou com você?</span>
          <Plus size={20} />
        </button>
        <Tabs
          options={[
            { id: "all", label: "Para você" },
            { id: "following", label: "Seguindo" },
            { id: "saved", label: "Salvos" },
          ]}
          value={tab}
          onChange={setTab}
        />
        <DemoNote>
          Perfis e interações de exemplo · suas ações ficam neste aparelho
        </DemoNote>
      </div>
      <div className="feed">
        {feed.length ? (
          feed.map((p) => <PostCard key={p.id} post={p} />)
        ) : (
          <Empty
            title={
              tab === "following"
                ? "Encontre sua companhia de cinema"
                : "Guarde boas conversas"
            }
            text={
              tab === "following"
                ? "Abra um perfil acima e toque em Seguir para acompanhar suas publicações."
                : "Toque no marcador de uma publicação para encontrá-la aqui."
            }
          />
        )}
      </div>
      {publish && (
        <Sheet
          title="Compartilhe uma história"
          onClose={() => setPublish(false)}
        >
          <p className="muted">
            Avalie um filme ou compartilhe uma de suas listas.
          </p>
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Escolha um filme para avaliar"
          />
          <div className="picker-movies">
            {movies
              .filter((m) =>
                m.title.toLowerCase().includes(query.toLowerCase()),
              )
              .map((m) => (
                <button
                  className="picker-movie"
                  key={m.id}
                  onClick={() => {
                    setPublish(false);
                    setReview(m);
                  }}
                >
                  <Img src={m.poster} alt="" />
                  <span>
                    {m.title}
                    <small>{m.year}</small>
                  </span>
                  <Star size={19} />
                </button>
              ))}
          </div>
          <h3>Suas listas</h3>
          {s.lists.filter((l) => l.userId === "me").length ? (
            s.lists
              .filter((l) => l.userId === "me")
              .map((l) => (
                <button
                  className="list-option"
                  key={l.id}
                  disabled={
                    !l.movies.length ||
                    l.private ||
                    s.preferences.privateProfile ||
                    s.preferences.privateLists
                  }
                  onClick={() => {
                    s.publishList(l.id);
                    setPublish(false);
                    toast("Lista compartilhada na comunidade local");
                  }}
                >
                  <ListPlus size={20} />
                  <span>
                    {l.name}
                    <small>
                      {l.private || s.preferences.privateLists
                        ? "Lista privada"
                        : `${l.movies.length} filmes`}
                    </small>
                  </span>
                  <ArrowRight size={18} />
                </button>
              ))
          ) : (
            <p className="muted">
              Crie uma lista no seu perfil para compartilhar.
            </p>
          )}
        </Sheet>
      )}
      {review && (
        <ReviewEditor movie={review} onClose={() => setReview(null)} />
      )}
    </>
  );
}

export function Chats() {
  const s = useStore();
  return (
    <>
      <Header
        title="Conversas de cinema"
        subtitle="Para trocar ideias, cena por cena."
        back
      />
      <div className="padded">
        <DemoNote>
          Mensagens locais · sem pessoas online ou respostas automáticas
        </DemoNote>
        {s.chats.map((c) => {
          const u = users.find((u) => u.id === c.userId)!;
          const last = c.messages.at(-1);
          return (
            <Link key={c.id} className="chat-row" to={`/chats/${c.id}`}>
              <Avatar user={u} />
              <div>
                <strong>{c.title}</strong>
                <p>
                  {last?.movieId
                    ? `Filme: ${movieById(last.movieId)?.title}`
                    : (last?.text ?? "Comece uma conversa")}
                </p>
                <small>Conversa demonstrativa</small>
              </div>
              <ChevronRight size={18} />
            </Link>
          );
        })}
        <div className="chat-editorial">
          <Users size={28} />
          <h2>
            Filmes acabam.
            <br />
            Boas conversas, não.
          </h2>
          <p>
            Use este espaço para experimentar mensagens e compartilhar títulos
            do catálogo.
          </p>
        </div>
      </div>
    </>
  );
}

export function ChatDetail() {
  const { id } = useParams();
  const s = useStore();
  const chat = s.chats.find((c) => c.id === id);
  const [text, setText] = useState("");
  const [pick, setPick] = useState(false);
  const [query, setQuery] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "instant", block: "end" });
  }, [chat?.messages.length]);
  if (!chat)
    return (
      <Empty
        title="Conversa não encontrada"
        text="Volte para escolher uma conversa."
        action={
          <Link to="/chats" className="button primary">
            Conversas
          </Link>
        }
      />
    );
  const send = (movieId?: string) => {
    if (!text.trim() && !movieId) return;
    s.sendMessage(chat.id, text, movieId);
    setText("");
    setPick(false);
  };
  return (
    <div className="chat-page">
      <Header
        title={chat.title}
        subtitle="Conversa local de demonstração"
        back
      />
      <div className="chat-messages">
        <p className="chat-date">SÓ NESTE APARELHO</p>
        {chat.messages.map((m) => (
          <div key={m.id} className={`message ${m.mine ? "mine" : ""}`}>
            {m.movieId && (
              <Link className="message-film" to={`/movie/${m.movieId}`}>
                <Img src={movieById(m.movieId)!.poster} alt="" />
                <span>
                  <small>VAMOS FALAR SOBRE</small>
                  <strong>{movieById(m.movieId)!.title}</strong>
                  <span>
                    Ver filme <ArrowRight size={13} />
                  </span>
                </span>
              </Link>
            )}
            {m.text && <p>{m.text}</p>}
            <small>
              {m.mine ? "Você · salvo localmente" : "Mensagem de exemplo"}
            </small>
          </div>
        ))}
        <div ref={end} />
      </div>
      <form
        className="chat-composer"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <IconButton label="Compartilhar filme" onClick={() => setPick(true)}>
          <Plus size={21} />
        </IconButton>
        <input
          aria-label="Sua mensagem"
          placeholder="Continue a conversa…"
          maxLength={2000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          enterKeyHint="send"
        />
        <button
          className="send-button"
          type="submit"
          aria-label="Enviar mensagem"
          disabled={!text.trim()}
        >
          <Send size={19} />
        </button>
      </form>
      {pick && (
        <Sheet title="Compartilhar um filme" onClose={() => setPick(false)}>
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Buscar no catálogo"
          />
          <div className="picker-movies">
            {movies
              .filter((m) =>
                m.title.toLowerCase().includes(query.toLowerCase()),
              )
              .map((m) => (
                <button
                  key={m.id}
                  className="picker-movie"
                  onClick={() => send(m.id)}
                >
                  <Img src={m.poster} alt="" />
                  <span>
                    {m.title}
                    <small>{m.year}</small>
                  </span>
                  <Send size={18} />
                </button>
              ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}
