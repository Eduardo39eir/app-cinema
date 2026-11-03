import { useState } from "react";
import { AnimatedNumber } from "./animations";
import { assetUrl } from "./assets";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  Check,
  Eye,
  Grid2X2,
  Heart,
  ImagePlus,
  List,
  Lock,
  Pencil,
  Plus,
  Settings,
  Share2,
  Trash2,
  X,
} from "./icons";
import { movies, movieById, users, genres, formatDate } from "./data";
import { useStore } from "./store";
import {
  Avatar,
  DemoNote,
  Empty,
  Header,
  IconButton,
  Img,
  ListCard,
  MovieRow,
  Poster,
  Rail,
  SearchField,
  Section,
  Sheet,
  Stars,
  Tabs,
  toast,
} from "./components";
import { PostCard } from "./Social";
import { ReviewEditor } from "./MovieDetails";
import type { Movie, MovieList } from "./types";

export function Profile() {
  const { id } = useParams();
  const own = !id || id === "me";
  const s = useStore();
  const user = own ? s.profile : users.find((u) => u.id === id);
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "activity";
  const [edit, setEdit] = useState(false);
  const [create, setCreate] = useState(false);
  const [review, setReview] = useState<Movie | null>(null);
  if (!user)
    return (
      <Empty
        title="Perfil não encontrado"
        text="Conheça outros cinéfilos na comunidade."
        action={
          <Link to="/community" className="button primary">
            Comunidade
          </Link>
        }
      />
    );
  const favorites = own ? s.favorites : user.favorites;
  const posts = s.posts.filter((p) => p.userId === user.id);
  const lists = s.lists.filter((l) => l.userId === user.id);
  return (
    <>
      <div className="profile-cover">
        <Img src={user.cover} alt="Capa do perfil" />
        <div />
        <Header title="" back={!own}>
          {own ? (
            <Link
              to="/settings"
              className="icon-button"
              aria-label="Configurações"
            >
              <Settings size={22} />
            </Link>
          ) : null}
        </Header>
      </div>
      <div className="profile-info">
        <Avatar user={user} size="large" />
        {own ? (
          <button
            className="button secondary small edit-profile"
            onClick={() => setEdit(true)}
          >
            <Pencil size={14} />
            Editar perfil
          </button>
        ) : (
          <button
            className={`button ${s.following.includes(user.id) ? "secondary" : "primary"} small edit-profile`}
            onClick={() => {
              s.follow(user.id);
              toast(
                s.following.includes(user.id)
                  ? "Você deixou de seguir este perfil"
                  : "Agora você segue este perfil",
              );
            }}
          >
            {s.following.includes(user.id) ? (
              <Check size={16} />
            ) : (
              <Plus size={16} />
            )}{" "}
            {s.following.includes(user.id) ? "Seguindo" : "Seguir"}
          </button>
        )}
        <span className="eyebrow">
          {own
            ? "SEU PEQUENO UNIVERSO CINEMATOGRÁFICO"
            : "CINÉFILO · PERFIL DEMONSTRATIVO"}
        </span>
        <h1>
          {user.name}
          {own && s.preferences.privateProfile && <Lock size={18} />}
        </h1>
        <p>{user.bio}</p>
        <div className="profile-stats">
          <Link to={own ? "/list/watched" : `/profile/${user.id}?tab=activity`}>
            <strong>
              <AnimatedNumber value={own ? s.watched.length : posts.length} />
            </strong>
            <span>filmes vistos</span>
          </Link>
          <Link
            to={
              own ? "/profile?tab=reviews" : `/profile/${user.id}?tab=reviews`
            }
          >
            <strong>
              <AnimatedNumber
                value={
                  own
                    ? s.reviews.length
                    : posts.filter((p) => p.rating !== undefined).length
                }
              />
            </strong>
            <span>avaliações</span>
          </Link>
          <Link
            to={own ? "/profile?tab=lists" : `/profile/${user.id}?tab=lists`}
          >
            <strong>
              <AnimatedNumber value={own ? lists.length + 3 : lists.length} />
            </strong>
            <span>listas</span>
          </Link>
        </div>
      </div>
      <Section
        title="Os que ficam com você"
        kicker="FAVORITOS"
        link={own ? "/list/favorites" : undefined}
      >
        {favorites.length ? (
          <Rail items={movies.filter((m) => favorites.includes(m.id))} />
        ) : (
          <div className="favorites-empty">
            <Heart size={24} />
            <p>Seus filmes inesquecíveis merecem um lugar aqui.</p>
            <Link to="/explore" className="text-link coral">
              Encontrar favoritos <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </Section>
      <div className="padded">
        <Tabs
          options={[
            { id: "activity", label: "Atividade" },
            { id: "lists", label: "Listas" },
            { id: "reviews", label: "Avaliações" },
          ]}
          value={tab}
          onChange={(v) => setParams({ tab: v }, { replace: true })}
        />
      </div>
      {tab === "activity" ? (
        <div className="feed">
          {posts.length ? (
            posts.map((p) => <PostCard key={p.id} post={p} />)
          ) : own && s.watched.length ? (
            <div className="padded">
              {s.watched.map((id) => (
                <MovieRow key={id} movie={movieById(id)!}>
                  <span className="badge subtle">
                    <Check size={13} />
                    Assistido
                  </span>
                </MovieRow>
              ))}
            </div>
          ) : (
            <Empty
              title="Sua história com o cinema começa aqui"
              text="Marque um filme como assistido ou publique uma avaliação para registrar o momento."
              action={
                <Link to="/explore" className="button secondary">
                  Descobrir filmes
                </Link>
              }
            />
          )}
        </div>
      ) : tab === "lists" ? (
        <div className="padded">
          {own && (
            <>
              <div className="builtin-lists">
                {[
                  {
                    id: "watchlist",
                    name: "Quero assistir",
                    icon: Bookmark,
                    items: s.watchlist,
                  },
                  {
                    id: "watched",
                    name: "Assistidos",
                    icon: Eye,
                    items: s.watched,
                  },
                  {
                    id: "favorites",
                    name: "Favoritos",
                    icon: Heart,
                    items: s.favorites,
                  },
                ].map((l) => (
                  <Link key={l.id} to={`/list/${l.id}`}>
                    <l.icon size={23} />
                    <strong>{l.name}</strong>
                    <span>{l.items.length} filmes</span>
                  </Link>
                ))}
              </div>
              <div className="section-heading">
                <h2>Suas seleções</h2>
                <button
                  className="text-button coral"
                  onClick={() => setCreate(true)}
                >
                  <Plus size={17} />
                  Criar lista
                </button>
              </div>
            </>
          )}
          <div className="lists-grid">
            {lists.map((l) => (
              <ListCard key={l.id} list={l} />
            ))}
          </div>
          {lists.length === 0 && (
            <p className="quiet-copy">
              Uma lista para cada fase, humor ou pessoa.{" "}
              {own ? "Crie a primeira." : "Nenhuma seleção publicada ainda."}
            </p>
          )}
        </div>
      ) : (
        <div className="padded">
          {own ? (
            s.reviews.length ? (
              s.reviews.map((r) => (
                <div className="profile-review" key={r.id}>
                  <MovieRow movie={movieById(r.movieId)!}>
                    <button
                      className="icon-button"
                      aria-label={`Editar avaliação de ${movieById(r.movieId)!.title}`}
                      onClick={() => setReview(movieById(r.movieId)!)}
                    >
                      <Pencil size={18} />
                    </button>
                  </MovieRow>
                  <div className="review-date">
                    <Stars value={r.rating} />
                    <span>{formatDate(r.date)}</span>
                  </div>
                  {r.spoiler ? (
                    <details>
                      <summary>Revelar seu comentário com spoiler</summary>
                      <p>{r.comment}</p>
                    </details>
                  ) : (
                    <p>{r.comment || "Uma história registrada."}</p>
                  )}
                </div>
              ))
            ) : (
              <Empty
                title="Cada olhar conta uma história"
                text="Abra um filme e toque em Avaliar para dar sua nota de 0 a 5 estrelas."
                action={
                  <Link to="/explore" className="button secondary">
                    Encontrar um filme
                  </Link>
                }
              />
            )
          ) : (
            posts
              .filter((p) => p.rating !== undefined)
              .map((p) => <PostCard key={p.id} post={p} />)
          )}
        </div>
      )}
      <DemoNote />
      {edit && <EditProfile onClose={() => setEdit(false)} />}{" "}
      {create && <ListEditor onClose={() => setCreate(false)} />}{" "}
      {review && (
        <ReviewEditor movie={review} onClose={() => setReview(null)} />
      )}
    </>
  );
}

function EditProfile({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const [name, setName] = useState(s.profile.name);
  const [bio, setBio] = useState(s.profile.bio);
  const [avatar, setAvatar] = useState(s.profile.avatar);
  const [cover, setCover] = useState(s.profile.cover);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const readFile = async (file: File | undefined, kind: "avatar" | "cover") => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) {
      setError("Escolha uma imagem de até 8 MB.");
      return;
    }
    setProcessing(true);
    setError("");
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      const canvas = document.createElement("canvas");
      const scale = Math.min(
        1,
        (kind === "avatar" ? 320 : 1000) / Math.max(img.width, img.height),
      );
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error();
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const value = canvas.toDataURL("image/jpeg", 0.85);
      kind === "avatar" ? setAvatar(value) : setCover(value);
    } catch {
      setError("Não foi possível ler a imagem. Tente outra.");
    } finally {
      setProcessing(false);
      URL.revokeObjectURL(url);
    }
  };
  return (
    <Sheet title="Seu perfil, do seu jeito" onClose={onClose}>
      <div className="edit-preview">
        <Img src={cover} alt="Prévia da capa" />
        <Avatar user={{ name, avatar }} size="large" />
        <h3>{name || "Seu nome"}</h3>
        <p>{bio}</p>
      </div>
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          s.updateProfile({
            name: name.trim(),
            bio: bio.trim(),
            avatar,
            cover,
          });
          toast("Seu perfil foi atualizado");
          onClose();
        }}
      >
        <label>
          Seu nome
          <input
            required
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Sobre você
          <textarea
            maxLength={180}
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </label>
        <span className="field-label">Escolha um avatar</span>
        <div className="avatar-options">
          {users.map((u) => (
            <button
              key={u.id}
              type="button"
              className={avatar === u.avatar ? "selected" : ""}
              aria-label={`Usar avatar ${u.name}`}
              onClick={() => setAvatar(u.avatar)}
            >
              <Avatar user={u} />
            </button>
          ))}
        </div>
        <label className="upload-button">
          <ImagePlus size={18} />
          Enviar foto
          <input
            type="file"
            accept="image/*"
            onChange={(e) => readFile(e.target.files?.[0], "avatar")}
          />
        </label>
        <span className="field-label">Sua capa</span>
        <div className="cover-options">
          {movies
            .filter((m) =>
              ["dune", "interstellar", "batman", "lalaland"].includes(m.id),
            )
            .map((m) => (
              <button
                type="button"
                aria-label={`Usar capa de ${m.title}`}
                className={cover === m.backdrop ? "selected" : ""}
                key={m.id}
                onClick={() => setCover(m.backdrop)}
              >
                <Img src={m.backdrop} alt={m.title} />
              </button>
            ))}
        </div>
        <label className="upload-button">
          <ImagePlus size={18} />
          Enviar capa
          <input
            type="file"
            accept="image/*"
            onChange={(e) => readFile(e.target.files?.[0], "cover")}
          />
        </label>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <button
          className="button primary full"
          type="submit"
          disabled={!name.trim() || processing}
        >
          {processing ? "Preparando imagem…" : "Salvar perfil"}
          <Check size={18} />
        </button>
      </form>
    </Sheet>
  );
}

export function ListEditor({
  onClose,
  list,
}: {
  onClose: () => void;
  list?: MovieList;
}) {
  const s = useStore();
  const nav = useNavigate();
  const [name, setName] = useState(list?.name ?? "");
  const [description, setDescription] = useState(list?.description ?? "");
  const [privateList, setPrivate] = useState(
    list?.private ?? s.preferences.privateLists,
  );
  const [cover, setCover] = useState(list?.cover ?? "");
  return (
    <Sheet
      title={list ? "Editar seleção" : "Toda lista conta uma história"}
      onClose={onClose}
    >
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          const id = s.saveList(
            {
              name: name.trim(),
              description: description.trim(),
              private: privateList,
              movies: list?.movies ?? [],
              cover: cover || undefined,
            },
            list?.id,
          );
          onClose();
          nav(`/list/${id}`);
          toast(
            list ? "Lista atualizada" : "Lista criada. Adicione seus filmes.",
          );
        }}
      >
        <label>
          Nome da lista
          <input
            value={name}
            maxLength={60}
            required
            placeholder="Filmes para uma noite de chuva"
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Uma breve descrição
          <textarea
            value={description}
            maxLength={300}
            rows={3}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="O que conecta essas histórias?"
          />
        </label>
        <label>
          Capa
          <select value={cover} onChange={(e) => setCover(e.target.value)}>
            <option value="">Composição automática de pôsteres</option>
            {movies
              .filter((m) =>
                ["dune", "interstellar", "batman", "lalaland"].includes(m.id),
              )
              .map((m) => (
                <option key={m.id} value={m.backdrop}>
                  {m.title}
                </option>
              ))}
          </select>
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={privateList}
            onChange={(e) => setPrivate(e.target.checked)}
          />
          Manter esta lista privada
        </label>
        <button type="submit" className="button primary full">
          <Check size={17} />
          {list ? "Salvar alterações" : "Criar lista"}
        </button>
      </form>
    </Sheet>
  );
}

export function ListDetail() {
  const { id } = useParams();
  const s = useStore();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const view = params.get("view") ?? "grid";
  const sort = params.get("sort") ?? "added";
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [q, setQ] = useState("");
  const builtin = id === "watchlist" || id === "watched" || id === "favorites";
  const list = builtin
    ? {
        id: id!,
        name:
          id === "watchlist"
            ? "Quero assistir"
            : id === "watched"
              ? "Assistidos"
              : "Favoritos",
        description:
          id === "watchlist"
            ? "As próximas histórias da sua vida."
            : id === "watched"
              ? "Cada filme, uma nova memória."
              : "Os filmes que fazem parte de você.",
        movies: s[id! as "watchlist" | "watched" | "favorites"],
        private: s.preferences.privateLists,
        userId: "me",
      }
    : s.lists.find((l) => l.id === id);
  if (!list)
    return (
      <>
        <Header title="Lista não encontrada" back />
        <Empty
          title="Esta seleção não está disponível"
          text="Veja suas outras listas no perfil."
          action={
            <Link className="button primary" to="/profile?tab=lists">
              Minhas listas
            </Link>
          }
        />
      </>
    );
  const own = list.userId === "me";
  const items = list.movies
    .map((id) => movieById(id))
    .filter((m): m is Movie => !!m);
  const sorted = [...items].sort((a, b) =>
    sort === "title"
      ? a.title.localeCompare(b.title, "pt-BR")
      : sort === "rating"
        ? b.rating - a.rating
        : sort === "year"
          ? b.year - a.year
          : 0,
  );
  const toggle = (movieId: string) => {
    if (builtin)
      s.toggleMovie(id as "watchlist" | "watched" | "favorites", movieId);
    else s.toggleListMovie(list.id, movieId);
  };
  const set = (key: string, val: string) =>
    setParams(
      (p) => {
        p.set(key, val);
        return p;
      },
      { replace: true },
    );
  return (
    <>
      <Header title={list.name} back>
        {own && !builtin && (
          <IconButton label="Editar lista" onClick={() => setEditing(true)}>
            <Pencil size={20} />
          </IconButton>
        )}
      </Header>
      <div className="padded">
        <div className="list-hero">
          {list.cover ? (
            <Img src={list.cover} alt={list.name} />
          ) : (
            items
              .slice(0, 4)
              .map((m) => <Img key={m.id} src={m.poster} alt={m.title} />)
          )}
          {!items.length && !list.cover && <Bookmark size={40} />}
        </div>
        <p className="list-description">{list.description}</p>
        <div className="list-meta">
          <span>{items.length} filmes</span>
          <span>
            {list.private || s.preferences.privateLists ? "Privada" : "Pública"}{" "}
            · {own ? "por você" : users.find((u) => u.id === list.userId)?.name}
          </span>
        </div>
        {own && (
          <div className="list-tools">
            <button className="button primary" onClick={() => setAdding(true)}>
              <Plus size={18} />
              Adicionar filmes
            </button>
            {!builtin && (
              <IconButton
                label="Compartilhar lista"
                disabled={
                  !items.length ||
                  list.private ||
                  s.preferences.privateLists ||
                  s.preferences.privateProfile
                }
                onClick={() => {
                  s.publishList(list.id);
                  toast("Lista compartilhada na comunidade");
                }}
              >
                <Share2 size={19} />
              </IconButton>
            )}
          </div>
        )}
        <div className="collection-toolbar">
          <select
            aria-label="Ordenar filmes"
            value={sort}
            onChange={(e) => set("sort", e.target.value)}
          >
            <option value="added">Ordem de adição</option>
            <option value="title">Título A–Z</option>
            <option value="rating">Maior nota</option>
            <option value="year">Mais recentes</option>
          </select>
          <IconButton
            label={view === "grid" ? "Mostrar em lista" : "Mostrar em grade"}
            onClick={() => set("view", view === "grid" ? "list" : "grid")}
          >
            {view === "grid" ? <List size={20} /> : <Grid2X2 size={20} />}
          </IconButton>
        </div>
        {!items.length ? (
          <Empty
            title="Uma seleção em branco, infinitas histórias"
            text="Adicione filmes para começar sua lista."
          />
        ) : view === "grid" ? (
          <div className="poster-grid three">
            {sorted.map((m) => (
              <div className="collection-movie" key={m.id}>
                <Poster movie={m} />
                {own && (
                  <button
                    className="collection-remove"
                    aria-label={`Remover ${m.title} desta lista`}
                    onClick={() => {
                      toggle(m.id);
                      toast("Filme removido da lista");
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          sorted.map((m) => (
            <MovieRow key={m.id} movie={m}>
              {own ? (
                <IconButton
                  label={`Remover ${m.title} desta lista`}
                  onClick={() => toggle(m.id)}
                >
                  <X size={18} />
                </IconButton>
              ) : undefined}
            </MovieRow>
          ))
        )}
        {own && !builtin && (
          <button
            className="button ghost coral full"
            onClick={() => setRemoving(true)}
          >
            <Trash2 size={17} />
            Excluir lista
          </button>
        )}
      </div>
      {editing && (
        <ListEditor list={list} onClose={() => setEditing(false)} />
      )}{" "}
      {adding && (
        <Sheet
          title="Encontre os próximos da lista"
          onClose={() => setAdding(false)}
        >
          <SearchField
            value={q}
            onChange={setQ}
            placeholder="Buscar filme para adicionar"
          />
          <div className="picker-movies">
            {movies
              .filter((m) => m.title.toLowerCase().includes(q.toLowerCase()))
              .map((m) => (
                <button
                  className="picker-movie"
                  key={m.id}
                  aria-pressed={list.movies.includes(m.id)}
                  onClick={() => toggle(m.id)}
                >
                  <Img src={m.poster} alt="" />
                  <span>
                    {m.title}
                    <small>{m.year}</small>
                  </span>
                  {list.movies.includes(m.id) ? (
                    <Check className="coral" size={21} />
                  ) : (
                    <Plus size={21} />
                  )}
                </button>
              ))}
          </div>
          <button
            className="button primary full"
            onClick={() => setAdding(false)}
          >
            Concluir <Check size={18} />
          </button>
        </Sheet>
      )}{" "}
      {removing && (
        <Sheet title="Excluir esta lista?" onClose={() => setRemoving(false)}>
          <p>
            A seleção “{list.name}” será excluída, junto com suas publicações.
            Seus filmes assistidos e avaliações permanecem.
          </p>
          <button
            className="button primary full"
            onClick={() => {
              s.removeList(list.id);
              nav("/profile?tab=lists", { replace: true });
              toast("Lista excluída");
            }}
          >
            Confirmar exclusão
          </button>
          <button
            className="button ghost full"
            onClick={() => setRemoving(false)}
          >
            Cancelar
          </button>
        </Sheet>
      )}
    </>
  );
}

export function SettingsPage() {
  const s = useStore();
  const [reset, setReset] = useState(false);
  const nav = useNavigate();
  return (
    <>
      <Header
        title="Do seu jeito"
        subtitle="Um espaço para a sua forma de ver cinema."
        back
      />
      <div className="padded settings">
        <section>
          <h2>Suas histórias favoritas</h2>
          <p>Seus gêneros ajudam a escolher o que aparece no início.</p>
          <div className="chip-row wrap">
            {genres.map((g) => (
              <button
                key={g}
                className={`chip ${s.preferences.genres.includes(g) ? "active" : ""}`}
                aria-pressed={s.preferences.genres.includes(g)}
                onClick={() =>
                  s.updatePreferences({
                    genres: s.preferences.genres.includes(g)
                      ? s.preferences.genres.filter((x) => x !== g)
                      : [...s.preferences.genres, g],
                  })
                }
              >
                {g}
              </button>
            ))}
          </div>
        </section>
        <section>
          <h2>Privacidade e notificações</h2>
          {(
            [
              {
                key: "privateProfile",
                title: "Perfil privado",
                text: "Suas publicações saem do feed da comunidade local.",
              },
              {
                key: "privateLists",
                title: "Listas privadas",
                text: "Bloqueia o compartilhamento das suas listas.",
              },
              {
                key: "notifications",
                title: "Lembretes de sessão",
                text: "Receba novos avisos dentro do Cine.",
              },
              {
                key: "reducedMotion",
                title: "Reduzir movimento",
                text: "Transições mais discretas em todo o aplicativo.",
              },
            ] as const
          ).map((o) => (
            <label className="setting-row" key={o.key}>
              <span>
                <strong>{o.title}</strong>
                <small>{o.text}</small>
              </span>
              <input
                className="switch"
                type="checkbox"
                role="switch"
                checked={s.preferences[o.key]}
                onChange={(e) =>
                  s.updatePreferences({ [o.key]: e.target.checked })
                }
              />
            </label>
          ))}
        </section>
        <section>
          <h2>Aparência</h2>
          <div className="appearance-options">
            <button
              className={s.preferences.appearance === "cinema" ? "active" : ""}
              onClick={() => s.updatePreferences({ appearance: "cinema" })}
            >
              <span className="theme-swatch" />
              Cinema escuro
              {s.preferences.appearance === "cinema" && <Check size={17} />}
            </button>
            <button
              className={
                s.preferences.appearance === "contrast" ? "active" : ""
              }
              onClick={() => s.updatePreferences({ appearance: "contrast" })}
            >
              <span className="theme-swatch contrast" />
              Alto contraste
              {s.preferences.appearance === "contrast" && <Check size={17} />}
            </button>
          </div>
        </section>
        <section>
          <h2>Sobre esta experiência</h2>
          <p>
            Cine é um protótipo local. Catálogo, notas, perfis, conversas e
            sessões servem para demonstrar a experiência. Seus dados ficam neste
            navegador; não há conta, cobrança, reserva real ou IA conectada.
          </p>
          <p>
            Imagens de filmes: TMDB e Wikimedia. Retratos dos perfis: Unsplash.
            Os retratos ilustram pessoas fictícias. Este produto não é endossado
            pelo TMDB.
          </p>
          <a
            className="text-link coral"
            href={assetUrl("/assets/sources.json")}
            target="_blank"
            rel="noreferrer"
          >
            Ver fontes das imagens <ArrowRight size={15} />
          </a>
        </section>
        <button
          className="button secondary coral full"
          onClick={() => setReset(true)}
        >
          <Trash2 size={18} />
          Reiniciar dados de demonstração
        </button>
        <DemoNote>Cine · versão 1.0</DemoNote>
      </div>
      {reset && (
        <Sheet
          title="Começar uma nova história?"
          onClose={() => setReset(false)}
        >
          <p>
            Isso apaga suas listas, avaliações, mensagens, perfil e ingressos
            deste navegador e restaura os exemplos iniciais.
          </p>
          <button
            className="button primary full"
            onClick={() => {
              s.reset();
              nav("/", { replace: true });
              setReset(false);
              toast("Dados de demonstração reiniciados");
            }}
          >
            Sim, reiniciar todos os dados
          </button>
          <button className="button ghost full" onClick={() => setReset(false)}>
            Manter meus dados
          </button>
        </Sheet>
      )}
    </>
  );
}

export function Notifications() {
  const s = useStore();
  const [unread, setUnread] = useState(false);
  const items = s.notices.filter((n) => !unread || !n.read);
  return (
    <>
      <Header title="Novidades para você" back />
      <div className="padded">
        <div className="section-heading">
          <button
            className={`chip ${unread ? "active" : ""}`}
            onClick={() => setUnread(!unread)}
          >
            {unread ? "Somente não lidas" : "Todas as novidades"}
          </button>
          <button
            className="text-button coral"
            disabled={!s.notices.some((n) => !n.read)}
            onClick={() => {
              s.readNotice();
              toast("Todas marcadas como lidas");
            }}
          >
            Marcar como lidas
          </button>
        </div>
        {items.length ? (
          items.map((n) => (
            <Link
              className={`notice ${!n.read ? "unread" : ""}`}
              key={n.id}
              to={n.url}
              onClick={() => s.readNotice(n.id)}
            >
              <span className="notice-icon">
                {n.id === "welcome" ? (
                  <Heart size={20} />
                ) : (
                  <Bookmark size={20} />
                )}
              </span>
              <div>
                <h3>{n.title}</h3>
                <p>{n.text}</p>
              </div>
              {!n.read && <i />}
            </Link>
          ))
        ) : (
          <Empty
            title="Tudo em dia por aqui"
            text="Quando houver novidades, você encontra todas neste espaço."
          />
        )}
      </div>
    </>
  );
}
