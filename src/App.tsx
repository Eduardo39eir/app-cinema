import {
  Component,
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react";
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import { Compass, Home as HomeIcon, Ticket, UserRound, Users } from "./icons";
import { Home, Explore, Onboarding } from "./Discovery";
import { MovieDetails } from "./MovieDetails";
import { Booking, Sessions, TicketDetail, Tickets } from "./Cinema";
import { ChatDetail, Chats, Community } from "./Social";
import { ListDetail, Notifications, Profile, SettingsPage } from "./Profile";
import { Empty, Toasts, toast } from "./components";
import { useStore } from "./store";
import { installAndroidBackHandler } from "./native";
import { motion } from "motion/react";
import { CineMotion, ContentMotion, useQuietMotion } from "./animations";

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main className="app-shell">
        <Empty
          title="A sessão foi interrompida"
          text="Seus dados salvos continuam aqui. Tente abrir o aplicativo novamente."
          action={
            <button
              className="button primary"
              onClick={() => location.reload()}
            >
              Tentar novamente
            </button>
          }
        />
      </main>
    ) : (
      this.props.children
    );
  }
}
const positions = new Map<string, number>();
function ScrollMemory() {
  const { key, pathname, search } = useLocation();
  const type = useNavigationType();
  const previous = useRef({ key, path: pathname + search });
  useLayoutEffect(() => {
    toast("");
    window.scrollTo({
      top: type === "POP" ? (positions.get(key) ?? 0) : 0,
      behavior: "instant",
    });
    previous.current = { key, path: pathname + search };
    const remember = () => positions.set(key, window.scrollY);
    window.addEventListener("scroll", remember, { passive: true });
    return () => {
      positions.set(key, window.scrollY);
      window.removeEventListener("scroll", remember);
    };
  }, [key]);
  return null;
}
function Shell() {
  const quiet = useQuietMotion();
  const onboarded = useStore((s) => s.onboarded);
  const preferences = useStore((s) => s.preferences);
  const { pathname } = useLocation();
  const hideNav =
    pathname.startsWith("/booking/") ||
    pathname.startsWith("/ticket/") ||
    /^\/chats\/.+/.test(pathname);
  useEffect(() => {
    document.documentElement.dataset.motion = preferences.reducedMotion
      ? "reduced"
      : "normal";
    document.documentElement.dataset.theme = preferences.appearance;
  }, [preferences]);
  useEffect(() => {
    useStore.getState().refreshSessions();
  }, []);
  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    void installAndroidBackHandler().then((remove) => {
      if (cancelled) remove();
      else cleanup = remove;
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);
  return (
    <>
      <a href="#main-content" className="skip-link">
        Pular para conteúdo
      </a>
      <div className="app-shell">
        <ScrollMemory />
        {!onboarded ? (
          <Onboarding />
        ) : (
          <>
            <motion.main
              key={pathname}
              initial={quiet ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: quiet ? 0 : 0.22 }}
              id="main-content"
              className={hideNav ? "main-content focused" : "main-content"}
            >
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/movie/:id" element={<MovieDetails />} />
                <Route path="/sessions/:id" element={<Sessions />} />
                <Route path="/booking/:sessionId" element={<Booking />} />
                <Route path="/community" element={<Community />} />
                <Route path="/chats" element={<Chats />} />
                <Route path="/chats/:id" element={<ChatDetail />} />
                <Route path="/tickets" element={<Tickets />} />
                <Route path="/ticket/:id" element={<TicketDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:id" element={<Profile />} />
                <Route path="/list/:id" element={<ListDetail />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route
                  path="*"
                  element={
                    <Empty
                      title="Esta cena ainda não existe"
                      text="Volte ao início para encontrar sua próxima história."
                      action={
                        <Link className="button primary" to="/">
                          Ir para o início
                        </Link>
                      }
                    />
                  }
                />
              </Routes>
            </motion.main>
            {!hideNav && (
              <nav className="bottom-nav" aria-label="Navegação principal">
                {[
                  { path: "/", label: "Início", icon: HomeIcon },
                  { path: "/explore", label: "Explorar", icon: Compass },
                  { path: "/community", label: "Comunidade", icon: Users },
                  { path: "/tickets", label: "Ingressos", icon: Ticket },
                  { path: "/profile", label: "Perfil", icon: UserRound },
                ].map(({ path, label, icon: Icon }) => (
                  <NavLink
                    key={path}
                    to={path}
                    end={path === "/"}
                    className={({ isActive }) => (isActive ? "active" : "")}
                  >
                    {({ isActive }) => (
                      <>
                        <span>
                          {isActive && (
                            <motion.i
                              aria-hidden="true"
                              className="nav-selection"
                              layoutId={quiet ? undefined : "cine-navigation"}
                              transition={{
                                type: "spring",
                                stiffness: 420,
                                damping: 34,
                                duration: quiet ? 0 : undefined,
                              }}
                            />
                          )}
                          <Icon
                            size={22}
                            variant={isActive ? "Bold" : "Linear"}
                          />
                        </span>
                        <small>{label}</small>
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            )}
          </>
        )}
        <Toasts />
        <ContentMotion />
      </div>
    </>
  );
}
export default function App() {
  return (
    <ErrorBoundary>
      <CineMotion>
        <BrowserRouter>
          <Shell />
        </BrowserRouter>
      </CineMotion>
    </ErrorBoundary>
  );
}
