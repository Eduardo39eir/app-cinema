import {
  useEffect,
  useRef,
  useState,
  useId,
  type ReactNode,
  type CSSProperties,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Film,
  Plus,
  Star,
  X,
  ChevronRight,
  Bookmark,
  Search,
} from "./icons";
import { movieById } from "./data";
import { useStore } from "./store";
import type { Movie, MovieList, User } from "./types";
import { motion } from "motion/react";
import { animate } from "motion/mini";
import { cineEase, useQuietMotion } from "./animations";
import { assetUrl } from "./assets";

export function Img({
  src,
  alt = "",
  className = "",
  style,
  loading = "lazy",
}: {
  src: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  loading?: "lazy" | "eager";
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return failed ? (
    <span className={`image-fallback ${className}`} role="img" aria-label={alt}>
      <Film />
      <span>{alt}</span>
    </span>
  ) : (
    <img
      src={assetUrl(src)}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      onError={() => setFailed(true)}
    />
  );
}
export function IconButton({
  label,
  children,
  onClick,
  className = "",
  ...rest
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`icon-button ${className}`}
      aria-label={label}
      title={label}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}
export function Header({
  title,
  subtitle,
  children,
  back = false,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  back?: boolean;
}) {
  const nav = useNavigate();
  return (
    <header className={`page-header ${back ? "has-back" : ""}`}>
      {back && (
        <IconButton
          label="Voltar"
          onClick={() => (window.history.state?.idx > 0 ? nav(-1) : nav("/"))}
        >
          <ArrowLeft size={22} />
        </IconButton>
      )}
      <div>
        {title && <h1>{title}</h1>}
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="header-actions">{children}</div>
    </header>
  );
}
export function Rating({
  value,
  label = false,
}: {
  value: number;
  label?: boolean;
}) {
  return (
    <span className="rating">
      <Star size={12} fill="currentColor" />
      {value.toFixed(1).replace(".", ",")}
      {label && <small>/ 5</small>}
    </span>
  );
}
export function Stars({ value }: { value: number }) {
  return (
    <span className="stars" role="img" aria-label={`${value} de 5 estrelas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span className="star-item" key={i}>
          <Star size={17} />
          <span
            style={{ width: `${Math.max(0, Math.min(1, value - i)) * 100}%` }}
          >
            <Star size={17} fill="currentColor" />
          </span>
        </span>
      ))}
    </span>
  );
}
export function Poster({
  movie,
  compact = false,
}: {
  movie: Movie;
  compact?: boolean;
}) {
  const saved = useStore((s) => s.watchlist.includes(movie.id));
  const toggle = useStore((s) => s.toggleMovie);
  return (
    <article className={`poster-card ${compact ? "compact" : ""}`}>
      <Link
        to={`/movie/${movie.id}`}
        className="poster-image"
        aria-label={movie.title}
      >
        <Img src={movie.poster} alt={movie.title} />
        <span className="poster-rating">
          <Rating value={movie.rating} />
        </span>
      </Link>
      <button
        className={`poster-add ${saved ? "selected" : ""}`}
        aria-label={`${saved ? "Remover" : "Adicionar"} ${movie.title} ${saved ? "de" : "a"} Quero assistir`}
        aria-pressed={saved}
        onClick={() => {
          toggle("watchlist", movie.id);
          toast(
            saved
              ? "Removido de Quero assistir"
              : "Adicionado a Quero assistir",
          );
        }}
      >
        {saved ? <Check size={16} /> : <Plus size={16} />}
      </button>
      <Link to={`/movie/${movie.id}`} className="poster-caption">
        <h3>{movie.title}</h3>
        <p>
          {movie.year} <span>·</span> {movie.genres[0]}
        </p>
      </Link>
    </article>
  );
}
export function MovieRow({
  movie,
  children,
}: {
  movie: Movie;
  children?: ReactNode;
}) {
  return (
    <div className="movie-row">
      <Link to={`/movie/${movie.id}`}>
        <Img src={movie.poster} alt={movie.title} />
      </Link>
      <Link to={`/movie/${movie.id}`} className="row-copy">
        <h3>{movie.title}</h3>
        <p>
          {movie.year} · {movie.duration} min
        </p>
        <Rating value={movie.rating} />
      </Link>
      {children ?? <ChevronRight size={18} />}
    </div>
  );
}
export function Section({
  title,
  kicker,
  link,
  children,
}: {
  title: string;
  kicker?: string;
  link?: string;
  children: ReactNode;
}) {
  return (
    <section className="section">
      <div className="section-heading">
        <div>
          {kicker && <span className="eyebrow">{kicker}</span>}
          <h2>{title}</h2>
        </div>
        {link && (
          <Link to={link} className="text-link">
            Ver todos <ArrowRight size={14} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
export function Rail({ items }: { items: Movie[] }) {
  return (
    <div className="poster-rail">
      {items.map((m) => (
        <Poster key={m.id} movie={m} />
      ))}
    </div>
  );
}
export function Empty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-symbol">
        <Film size={28} />
      </div>
      <h2>{title}</h2>
      <p>{text}</p>
      {action}
    </div>
  );
}
export function Avatar({
  user,
  size = "normal",
}: {
  user: Pick<User, "name" | "avatar">;
  size?: "small" | "normal" | "large";
}) {
  return <Img src={user.avatar} alt={user.name} className={`avatar ${size}`} />;
}
export function ListCover({
  list,
}: {
  list: Pick<MovieList, "movies" | "cover" | "name">;
}) {
  return (
    <div className="list-cover">
      {list.cover ? (
        <Img src={list.cover} alt={list.name} />
      ) : list.movies.length ? (
        list.movies
          .slice(0, 4)
          .map((id, i) => (
            <Img
              key={id}
              src={movieById(id)?.poster ?? ""}
              alt=""
              style={{ zIndex: 4 - i }}
            />
          ))
      ) : (
        <Bookmark size={28} />
      )}
    </div>
  );
}
export function ListCard({ list }: { list: MovieList }) {
  return (
    <Link className="list-card" to={`/list/${list.id}`}>
      <ListCover list={list} />
      <h3>{list.name}</h3>
      <p>
        {list.movies.length} {list.movies.length === 1 ? "filme" : "filmes"} ·{" "}
        {list.private ? "Privada" : "Pública"}
      </p>
    </Link>
  );
}
export function Tabs({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const id = useId();
  const quiet = useQuietMotion();
  return (
    <div className="tabs" role="tablist">
      {options.map((o) => (
        <button
          key={o.id}
          role="tab"
          aria-selected={o.id === value}
          className={o.id === value ? "active" : ""}
          onClick={() => onChange(o.id)}
        >
          {o.id === value && (
            <motion.span
              aria-hidden="true"
              className="tab-selection"
              layoutId={quiet ? undefined : `tab-${id}`}
              transition={{
                type: "spring",
                stiffness: 420,
                damping: 35,
                duration: quiet ? 0 : undefined,
              }}
            />
          )}
          {o.label}
        </button>
      ))}
    </div>
  );
}
export function Sheet({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const titleId = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  const quiet = useQuietMotion();
  const quietRef = useRef(quiet);
  quietRef.current = quiet;
  const closing = useRef(false);
  const effect = useRef<ReturnType<typeof animate> | null>(null);
  closeRef.current = onClose;
  const dismiss = () => {
    if (closing.current) return;
    const el = ref.current;
    if (!el || quietRef.current) {
      closeRef.current();
      return;
    }
    closing.current = true;
    el.dataset.closing = "true";
    effect.current?.cancel();
    effect.current = animate(
      el,
      { opacity: [1, 0], transform: ["translateY(0px)", "translateY(28px)"] },
      { duration: 0.16, ease: [0.4, 0, 1, 1] },
    );
    void effect.current.then(() => {
      if (el.isConnected) closeRef.current();
    });
  };
  useEffect(() => {
    const el = ref.current;
    const focus = document.activeElement as HTMLElement;
    el?.showModal();
    closing.current = false;
    if (el && !quietRef.current)
      effect.current = animate(
        el,
        { opacity: [0, 1], transform: ["translateY(46px)", "translateY(0px)"] },
        { duration: 0.38, ease: cineEase },
      );
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      effect.current?.cancel();
      el?.close();
      document.body.style.overflow = overflow;
      focus?.focus();
    };
  }, []);
  useEffect(() => {
    if (quiet) {
      effect.current?.cancel();
      if (closing.current) closeRef.current();
    }
  }, [quiet]);
  return (
    <dialog
      ref={ref}
      aria-modal="true"
      aria-labelledby={titleId}
      className={`sheet ${wide ? "wide" : ""}`}
      onCancel={(e) => {
        e.preventDefault();
        dismiss();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            dismiss();
        }
      }}
    >
      <div className="sheet-handle" />
      <div className="sheet-heading">
        <h2 id={titleId}>{title}</h2>
        <IconButton label="Fechar painel" onClick={dismiss}>
          <X size={20} />
        </IconButton>
      </div>
      <div className="sheet-body">{children}</div>
    </dialog>
  );
}
export function toast(message: string) {
  window.dispatchEvent(new CustomEvent("cine-toast", { detail: message }));
}
export function Toasts() {
  const [message, setMessage] = useState("");
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const show = (e: Event) => {
      setMessage((e as CustomEvent).detail);
      clearTimeout(timer);
      timer = setTimeout(() => setMessage(""), 3000);
    };
    const storage = () => {
      setMessage(
        "Não foi possível salvar neste navegador. Libere espaço ou permita o armazenamento local.",
      );
    };
    window.addEventListener("cine-toast", show);
    window.addEventListener("cine-storage-error", storage);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("cine-toast", show);
      window.removeEventListener("cine-storage-error", storage);
    };
  }, []);
  return (
    <div
      className={`toast ${message ? "visible" : ""}`}
      role="status"
      aria-live="polite"
    >
      <Check size={16} />
      {message}
    </div>
  );
}
export function SearchField({
  value,
  onChange,
  placeholder = "Busque um filme, pessoa ou lista",
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="search-field">
      <Search size={20} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        enterKeyHint="search"
      />
      {value && (
        <IconButton label="Limpar busca" onClick={() => onChange("")}>
          <X size={18} />
        </IconButton>
      )}
    </div>
  );
}
export function DemoNote({ children }: { children?: ReactNode }) {
  return (
    <p className="demo-note">
      <span /> {children ?? "Experiência demonstrativa · dados locais"}
    </p>
  );
}
