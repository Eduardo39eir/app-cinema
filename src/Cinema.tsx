import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import QRCode from "qrcode";
import { newId } from "./id";
import { isNative, shareTicket } from "./native";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Expand,
  List,
  MapPin,
  Minus,
  Plus,
  Ticket as TicketIcon,
} from "./icons";
import {
  cinemas,
  dayOffset,
  formatDate,
  money,
  movieById,
  movies,
  today,
} from "./data";
import { useStore } from "./store";
import {
  DemoNote,
  Empty,
  Header,
  IconButton,
  Img,
  MovieRow,
  Sheet,
  Tabs,
  toast,
} from "./components";
import type { Ticket } from "./types";

export function Sessions() {
  const { id } = useParams();
  const movie = movieById(id);
  const s = useStore();
  const [date, setDate] = useState(today());
  const [calendar, setCalendar] = useState(false);
  const [month, setMonth] = useState(() => today().slice(0, 7));
  useEffect(() => s.refreshSessions(), []);
  if (!movie)
    return (
      <Empty
        title="Filme não encontrado"
        text="Escolha um título no catálogo."
        action={
          <Link to="/explore" className="button primary">
            Explorar
          </Link>
        }
      />
    );
  const sessions = s.sessions.filter(
    (x) => x.movieId === id && x.date === date,
  );
  const available = s.sessions.filter((x) => x.movieId === id);
  const currentMonth = new Date(month + "-01T12:00:00");
  const monthCount = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  ).getDate();
  const start = (currentMonth.getDay() + 6) % 7;
  const moveMonth = (offset: number) => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() + offset);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };
  return (
    <>
      <Header title="Vamos ao cinema?" back />
      <div className="padded">
        <MovieRow movie={movie} />
        <DemoNote>Programação fictícia de reprises · sem venda real</DemoNote>
        <div className="section-heading">
          <h2>Escolha o dia</h2>
          <IconButton
            label={calendar ? "Ver datas em lista" : "Ver calendário"}
            onClick={() => setCalendar(!calendar)}
          >
            {calendar ? <List size={21} /> : <CalendarDays size={21} />}
          </IconButton>
        </div>
        {calendar ? (
          <div className="calendar">
            <div className="calendar-month">
              <IconButton label="Mês anterior" onClick={() => moveMonth(-1)}>
                <ChevronLeft size={18} />
              </IconButton>
              <strong>
                {currentMonth.toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric",
                })}
              </strong>
              <IconButton label="Próximo mês" onClick={() => moveMonth(1)}>
                <ChevronRight size={18} />
              </IconButton>
            </div>
            <div className="calendar-grid">
              {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
                <small key={i}>{d}</small>
              ))}
              {Array.from({ length: start }, (_, i) => (
                <span key={"blank" + i} />
              ))}
              {Array.from({ length: monthCount }, (_, i) => {
                const dt = month + "-" + String(i + 1).padStart(2, "0");
                return (
                  <button
                    key={dt}
                    disabled={!available.some((x) => x.date === dt)}
                    className={date === dt ? "active" : ""}
                    onClick={() => setDate(dt)}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="date-rail">
            {Array.from({ length: 7 }, (_, i) => {
              const d = dayOffset(i);
              return (
                <button
                  key={d}
                  aria-label={formatDate(d, { day: "numeric", month: "long" })}
                  aria-pressed={date === d}
                  className={date === d ? "active" : ""}
                  onClick={() => setDate(d)}
                >
                  <small>
                    {i === 0
                      ? "Hoje"
                      : formatDate(d, { weekday: "short" }).replace(".", "")}
                  </small>
                  <strong>{formatDate(d, { day: "2-digit" })}</strong>
                  <span>
                    {formatDate(d, { month: "short" }).replace(".", "")}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        <div className="section-heading">
          <h2>Encontre sua sala</h2>
          <span className="muted">São Paulo, SP</span>
        </div>
        {cinemas.map((c) => {
          const available = sessions.filter((x) => x.cinemaId === c.id);
          return (
            <section key={c.id} className="cinema-card">
              <div className="cinema-name">
                <span>
                  <MapPin size={21} />
                </span>
                <div>
                  <h3>{c.name}</h3>
                  <p>{c.address}</p>
                </div>
              </div>
              <div className="session-times">
                {available.map((x) => {
                  const past =
                    new Date(`${x.date}T${x.time}:00`).getTime() <= Date.now();
                  return past ? (
                    <div key={x.id} className="session-time expired">
                      <strong>{x.time}</strong>
                      <small>Encerrada</small>
                    </div>
                  ) : (
                    <Link
                      className="session-time"
                      key={x.id}
                      to={`/booking/${x.id}`}
                    >
                      <strong>{x.time}</strong>
                      <small>{x.language}</small>
                      <span>
                        {x.format} · {money(x.price)}
                      </span>
                    </Link>
                  );
                })}
              </div>
              {available.length === 0 && (
                <p className="muted">Nenhuma sessão para esta data.</p>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}

export function Booking() {
  const { sessionId } = useParams();
  const s = useStore();
  const session = s.sessions.find((x) => x.id === sessionId);
  const [seats, setSeats] = useState<string[]>([]);
  const [step, setStep] = useState<"seats" | "summary">("seats");
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const requestId = useRef(newId());
  const lock = useRef(false);
  const nav = useNavigate();
  useEffect(() => {
    setSeats([]);
    setStep("seats");
    requestId.current = newId();
    lock.current = false;
  }, [sessionId]);
  if (!session)
    return (
      <>
        <Header title="Sessão indisponível" back />
        <Empty
          title="Escolha uma nova sessão"
          text="Esta sessão não está mais na programação."
          action={
            <Link to="/explore?cinema=1" className="button primary">
              Ver filmes em cartaz
            </Link>
          }
        />
      </>
    );
  const movie = movieById(session.movieId)!;
  const cinema = cinemas.find((c) => c.id === session.cinemaId)!;
  const occupied = [
    ...session.occupied,
    ...s.tickets.filter((t) => t.sessionId === sessionId).map((t) => t.seat),
  ];
  const toggleSeat = (seat: string) => {
    setError("");
    if (occupied.includes(seat)) return;
    setSeats((v) => {
      if (v.includes(seat)) return v.filter((x) => x !== seat);
      if (v.length >= 6) {
        toast("Você pode reservar até 6 lugares.");
        return v;
      }
      return [...v, seat].sort();
    });
  };
  const confirm = () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    const result = s.reserve(session.id, seats, requestId.current);
    if (result.error) {
      lock.current = false;
      setBusy(false);
      setError(result.error);
      setStep("seats");
      setSeats((v) => v.filter((x) => !occupied.includes(x)));
      return;
    }
    nav(`/ticket/${result.tickets[0].id}`, {
      replace: true,
      state: { confirmed: true },
    });
  };
  return (
    <>
      <Header
        title={
          step === "seats" ? "O melhor lugar é o seu" : "Confira sua sessão"
        }
        back
      />
      <div className="booking-steps">
        <span className="active">
          01 <b>Assentos</b>
        </span>
        <i />
        <span className={step === "summary" ? "active" : ""}>
          02 <b>Resumo</b>
        </span>
        <i />
        <span>
          03 <b>Ingresso</b>
        </span>
      </div>
      <div className="padded">
        <MovieRow movie={movie} />
        <div className="booking-context">
          <p>
            <MapPin size={15} />
            {cinema.name} · Sala {session.room}
          </p>
          <span>
            {formatDate(session.date, { day: "numeric", month: "long" })} ·{" "}
            {session.time} · {session.language}
          </span>
          <Link to={`/sessions/${movie.id}`} className="text-button coral">
            Trocar sessão
          </Link>
        </div>
        {step === "seats" ? (
          <>
            <div className="section-heading">
              <div>
                <h2>Escolha seus assentos</h2>
                <p className="muted">
                  Até 6 lugares para compartilhar a história.
                </p>
              </div>
            </div>
            <div className="screen-curve">
              <span>TELA</span>
            </div>
            <div className="seat-controls">
              <span>Deslize o mapa para os lados</span>
              <IconButton
                label="Diminuir mapa"
                disabled={zoom <= 1}
                onClick={() => setZoom(Math.max(1, zoom - 0.25))}
              >
                <Minus size={16} />
              </IconButton>
              <IconButton
                label="Ampliar mapa"
                disabled={zoom >= 1.5}
                onClick={() => setZoom(Math.min(1.5, zoom + 0.25))}
              >
                <Plus size={16} />
              </IconButton>
            </div>
            <div className="seat-scroll">
              <div className="seat-map" style={{ width: 412 * zoom }}>
                {["A", "B", "C", "D", "E", "F"].map((row) => (
                  <div className="seat-row" key={row}>
                    <span>{row}</span>
                    {Array.from({ length: 8 }, (_, i) => {
                      const seat = row + (i + 1);
                      const isOccupied = occupied.includes(seat);
                      return (
                        <button
                          key={seat}
                          disabled={isOccupied}
                          className={`${isOccupied ? "occupied" : ""} ${seats.includes(seat) ? "selected" : ""} ${i === 4 ? "aisle" : ""}`}
                          aria-label={`Assento ${seat}${isOccupied ? " ocupado" : ""}`}
                          aria-pressed={seats.includes(seat)}
                          onClick={() => toggleSeat(seat)}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div className="seat-legend">
              <span>
                <i />
                Disponível
              </span>
              <span>
                <i className="occupied" />
                Ocupado
              </span>
              <span>
                <i className="selected" />
                Seu lugar
              </span>
            </div>
            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}
            <div className="booking-total">
              <div>
                <small>
                  {seats.length
                    ? `ASSENTOS ${seats.join(", ")}`
                    : "ESCOLHA SEUS LUGARES"}
                </small>
                <strong>{money(session.price * seats.length)}</strong>
                <span>
                  {seats.length} {seats.length === 1 ? "ingresso" : "ingressos"}{" "}
                  · {money(session.price)} cada
                </span>
              </div>
              <button
                className="button primary"
                disabled={!seats.length}
                onClick={() => {
                  toast("");
                  setStep("summary");
                }}
              >
                Continuar <ArrowRight size={18} />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="summary-card">
              <span className="eyebrow">SUA PRÓXIMA HISTÓRIA, MARCADA</span>
              <h2>{movie.title}</h2>
              <dl>
                <div>
                  <dt>Cinema</dt>
                  <dd>{cinema.name}</dd>
                </div>
                <div>
                  <dt>Data e horário</dt>
                  <dd>
                    {formatDate(session.date)} · {session.time}
                  </dd>
                </div>
                <div>
                  <dt>Sala e formato</dt>
                  <dd>
                    {session.room} · {session.format}
                  </dd>
                </div>
                <div>
                  <dt>Idioma</dt>
                  <dd>{session.language}</dd>
                </div>
                <div>
                  <dt>Assentos</dt>
                  <dd>{seats.join(", ")}</dd>
                </div>
                <div>
                  <dt>Valor por pessoa</dt>
                  <dd>{money(session.price)}</dd>
                </div>
                <div className="summary-total">
                  <dt>
                    Total · {seats.length}{" "}
                    {seats.length === 1 ? "ingresso" : "ingressos"}
                  </dt>
                  <dd>{money(session.price * seats.length)}</dd>
                </div>
              </dl>
            </div>
            <div className="demo-explanation">
              <TicketIcon size={22} />
              <div>
                <strong>É uma reserva de demonstração</strong>
                <p>
                  Nenhum valor será cobrado. Os ingressos não são válidos para
                  entrada no cinema.
                </p>
              </div>
            </div>
            <button
              className="button primary full"
              disabled={busy || !seats.length}
              onClick={confirm}
            >
              {busy ? "Confirmando…" : "Confirmar reserva demonstrativa"}
              <Check size={18} />
            </button>
            <button
              className="button ghost full"
              onClick={() => setStep("seats")}
            >
              Alterar assentos
            </button>
          </>
        )}
      </div>
    </>
  );
}

function TicketCard({ ticket }: { ticket: Ticket }) {
  const session = useStore((s) =>
    s.sessions.find((x) => x.id === ticket.sessionId),
  );
  if (!session) return null;
  const movie = movieById(session.movieId)!;
  const cinema = cinemas.find((c) => c.id === session.cinemaId)!;
  return (
    <Link to={`/ticket/${ticket.id}`} className="ticket-preview">
      <div className="ticket-preview-image">
        <Img src={movie.backdrop} alt={movie.title} />
        <span className="badge">INGRESSO DEMO</span>
        <h2>{movie.title}</h2>
      </div>
      <div className="ticket-preview-info">
        <p>{cinema.name}</p>
        <div>
          <span>
            <small>DATA</small>
            <strong>{formatDate(session.date)}</strong>
          </span>
          <span>
            <small>HORÁRIO</small>
            <strong>{session.time}</strong>
          </span>
          <span>
            <small>ASSENTO</small>
            <strong>{ticket.seat}</strong>
          </span>
        </div>
        <div className="ticket-preview-foot">
          <span>Abrir ingresso</span>
          <ArrowRight size={19} />
        </div>
      </div>
    </Link>
  );
}
export function Tickets() {
  const s = useStore();
  const [tab, setTab] = useState("upcoming");
  const tickets = s.tickets.filter((t) => {
    const session = s.sessions.find((x) => x.id === t.sessionId);
    return (
      session &&
      (tab === "upcoming"
        ? new Date(`${session.date}T${session.time}:00`).getTime() >= Date.now()
        : new Date(`${session.date}T${session.time}:00`).getTime() < Date.now())
    );
  });
  return (
    <>
      <Header
        title="Seus ingressos"
        subtitle="O próximo encontro com a tela grande."
      />
      <div className="padded">
        <Tabs
          options={[
            { id: "upcoming", label: "Próximos" },
            { id: "past", label: "Anteriores" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>
      {tickets.length ? (
        <>
          <div className="ticket-carousel">
            {tickets.map((t) => (
              <TicketCard ticket={t} key={t.id} />
            ))}
          </div>
          <p className="center muted">
            {tickets.length} {tickets.length === 1 ? "ingresso" : "ingressos"} ·
            deslize para navegar
          </p>
        </>
      ) : (
        <Empty
          title={
            tab === "upcoming"
              ? "A sua poltrona está esperando"
              : "Cada sessão vira uma lembrança"
          }
          text={
            tab === "upcoming"
              ? "Escolha um filme, encontre seu lugar e prepare-se para a próxima história."
              : "Seus ingressos anteriores vão aparecer por aqui."
          }
          action={
            <Link className="button primary" to="/explore?cinema=1">
              <TicketIcon size={18} />
              Encontrar uma sessão
            </Link>
          }
        />
      )}
      <div className="padded">
        <DemoNote>
          Reservas locais de demonstração, sem validade para entrada.
        </DemoNote>
        <div className="cinema-editorial">
          <Img src="/assets/batman-bg.jpg" alt="Cena cinematográfica" />
          <div>
            <span className="eyebrow">APAGUE AS LUZES. SINTA TUDO.</span>
            <h2>
              Algumas histórias
              <br />
              pedem uma tela maior.
            </h2>
            <Link to="/explore?cinema=1" className="text-link">
              Explore a programação <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export function TicketDetail() {
  const { id } = useParams();
  const s = useStore();
  const ticket = s.tickets.find((t) => t.id === id);
  const session = s.sessions.find((x) => x.id === ticket?.sessionId);
  const [qr, setQr] = useState("");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [enlarge, setEnlarge] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setQr("");
    setError("");
    if (!ticket) return;
    let live = true;
    QRCode.toDataURL(`CINE:DEMONSTRACAO:${ticket.id}`, {
      width: 420,
      margin: 4,
      errorCorrectionLevel: "M",
      color: { dark: "#08090b", light: "#ffffff" },
    })
      .then((url) => {
        if (live) setQr(url);
      })
      .catch(() => {
        if (live) setError("Não foi possível gerar o QR.");
      });
    return () => {
      live = false;
    };
  }, [ticket?.id, retry]);
  if (!ticket || !session)
    return (
      <>
        <Header title="Ingresso não encontrado" back />
        <Empty
          title="Vamos encontrar seu ingresso"
          text="Abra a área de ingressos para ver suas reservas."
          action={
            <Link to="/tickets" className="button primary">
              Meus ingressos
            </Link>
          }
        />
      </>
    );
  const movie = movieById(session.movieId)!;
  const cinema = cinemas.find((c) => c.id === session.cinemaId)!;
  const group = s.tickets.filter((t) => t.bookingId === ticket.bookingId);
  const download = async () => {
    setSaving(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 1240;
      const c = canvas.getContext("2d");
      if (!c) throw new Error();
      c.fillStyle = "#08090b";
      c.fillRect(0, 0, 800, 1240);
      const photo = new Image();
      photo.src = movie.backdrop;
      await photo.decode();
      const scale = Math.max(800 / photo.width, 330 / photo.height);
      c.save();
      c.beginPath();
      c.rect(0, 0, 800, 330);
      c.clip();
      c.drawImage(
        photo,
        (800 - photo.width * scale) / 2,
        (330 - photo.height * scale) / 2,
        photo.width * scale,
        photo.height * scale,
      );
      c.restore();
      c.fillStyle = "#ff4d52";
      c.font = "bold 28px sans-serif";
      c.fillText("CINE · INGRESSO DEMONSTRATIVO", 48, 385);
      c.fillStyle = "#ffffff";
      c.font = "bold 34px sans-serif";
      c.fillText(movie.title, 48, 440, 704);
      c.font = "24px sans-serif";
      [
        cinema.name,
        cinema.address,
        `${formatDate(session.date, { day: "numeric", month: "long", year: "numeric" })} · ${session.time}`,
        `Sala ${session.room} · ${session.language} · Assento ${ticket.seat}`,
      ].forEach((line, i) => c.fillText(line, 48, 490 + i * 40, 704));
      const qimg = new Image();
      qimg.src = qr;
      await qimg.decode();
      c.drawImage(qimg, 210, 680, 380, 380);
      c.textAlign = "center";
      c.fillStyle = "#ffffff";
      c.font = "bold 25px monospace";
      c.fillText(ticket.id, 400, 1110);
      c.font = "18px sans-serif";
      c.fillStyle = "#c5c5c9";
      c.fillText("DEMONSTRAÇÃO — NÃO É VÁLIDO PARA ENTRADA", 400, 1155);
      c.fillText(
        `Reserva ${ticket.bookingId.slice(0, 8).toUpperCase()}`,
        400,
        1190,
      );
      if (isNative) {
        await shareTicket(`${ticket.id}.png`, canvas.toDataURL("image/png"));
        return;
      }
      const a = document.createElement("a");
      a.download = `${ticket.id}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
      toast("Ingresso exportado como imagem PNG");
    } catch {
      setError(
        "A imagem não pôde ser exportada. Use “Salvar arquivo do ingresso” abaixo.",
      );
    } finally {
      setSaving(false);
    }
  };
  const saveText = async () => {
    const text = [
      `Cine — INGRESSO DEMONSTRATIVO`,
      movie.title,
      cinema.name,
      cinema.address,
      `${session.date} ${session.time}`,
      `Sala ${session.room} — Assento ${ticket.seat}`,
      `Ingresso ${ticket.id}`,
      `Reserva ${ticket.bookingId}`,
      "Não é válido para entrada real.",
    ].join("\n");
    if (isNative) {
      try {
        await shareTicket(`${ticket.id}.txt`, text, true);
      } catch {
        toast("Não foi possível compartilhar o arquivo do ingresso.");
      }
      return;
    }
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${ticket.id}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <>
      <Header title="Seu próximo encontro" back />
      <div className="padded">
        <p className="ticket-success">
          <Check size={17} />
          Reserva demonstrativa confirmada
        </p>
        <div className="digital-ticket">
          <div className="digital-ticket-hero">
            <Img src={movie.backdrop} alt={movie.title} />
            <div>
              <span className="eyebrow">CINE APRESENTA</span>
              <h1>{movie.title}</h1>
            </div>
          </div>
          <div className="digital-ticket-body">
            <h3>{cinema.name}</h3>
            <p className="muted">{cinema.area} · São Paulo</p>
            <div className="ticket-details">
              <span>
                <small>DATA</small>
                <strong>{formatDate(session.date)}</strong>
              </span>
              <span>
                <small>HORÁRIO</small>
                <strong>{session.time}</strong>
              </span>
              <span>
                <small>SALA</small>
                <strong>{session.room}</strong>
              </span>
              <span>
                <small>ASSENTO</small>
                <strong className="coral">{ticket.seat}</strong>
              </span>
            </div>
            <p className="ticket-format">
              {session.language} · {session.format}
            </p>
          </div>
          <div className="ticket-perforation" />
          <div className="ticket-qr">
            {qr ? (
              <img src={qr} alt={`QR demonstrativo do ingresso ${ticket.id}`} />
            ) : error ? (
              <button
                className="button secondary"
                onClick={() => setRetry(retry + 1)}
              >
                Tentar gerar QR novamente
              </button>
            ) : (
              <div className="qr-skeleton" role="status">
                Gerando QR…
              </div>
            )}
            <strong className="ticket-code">{ticket.id}</strong>
            <small>Reserva {ticket.bookingId.slice(0, 8).toUpperCase()}</small>
            <span className="demo-ticket-label">
              DEMONSTRAÇÃO · SEM VALIDADE PARA ENTRADA
            </span>
          </div>
        </div>
        {group.length > 1 && (
          <div className="group-tickets">
            <span>Ingressos desta reserva</span>
            <div>
              {group.map((t) => (
                <Link
                  className={`chip ${t.id === id ? "active" : ""}`}
                  to={`/ticket/${t.id}`}
                  replace
                  key={t.id}
                >
                  Assento {t.seat}
                </Link>
              ))}
            </div>
          </div>
        )}
        <div className="ticket-actions">
          <button
            className="button secondary"
            disabled={!qr}
            onClick={() => setEnlarge(true)}
          >
            <Expand size={17} />
            Ampliar QR
          </button>
          <button
            className="button primary"
            disabled={!qr || saving}
            onClick={download}
          >
            <Download size={17} />
            {saving ? "Salvando…" : "Salvar ingresso"}
          </button>
        </div>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <button className="text-button center full" onClick={saveText}>
          Salvar arquivo do ingresso (.txt)
        </button>
        <a
          className="address-link"
          target="_blank"
          rel="noreferrer"
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cinema.address)}`}
        >
          <MapPin size={18} />
          <span>
            {cinema.address}
            <small>Abrir endereço no mapa</small>
          </span>
          <ArrowRight size={18} />
        </a>
        <Link to="/tickets" className="button ghost full">
          Ver todos os ingressos
        </Link>
      </div>
      {enlarge && (
        <Sheet
          title="QR do ingresso demonstrativo"
          onClose={() => setEnlarge(false)}
        >
          <img className="enlarged-qr" src={qr} alt={`QR ${ticket.id}`} />
          <p className="center ticket-code">{ticket.id}</p>
          <DemoNote>Não é válido para entrada em nenhum cinema.</DemoNote>
        </Sheet>
      )}
    </>
  );
}
