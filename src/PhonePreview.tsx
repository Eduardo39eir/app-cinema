import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import App from "./App";
import { Battery, Wifi } from "./icons";
import { useStore } from "./store";
import { isNative } from "./native";
import "./phone-preview.css";

const desktop = "(min-width: 440px) and (hover: hover) and (pointer: fine)";
const embedded = window.self !== window.top;
const forcePreview =
  new URLSearchParams(location.search).get("preview") === "iphone";

function appUrl() {
  const url = new URL(location.href);
  url.searchParams.delete("preview");
  return url.pathname + url.search + url.hash;
}

function PhonePreview() {
  const stage = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.8);
  const [time, setTime] = useState(() => new Date());
  const [src, setSrc] = useState(appUrl);
  useEffect(() => {
    const update = () => setSrc(appUrl());
    window.addEventListener("hashchange", update);
    window.addEventListener("popstate", update);
    return () => {
      window.removeEventListener("hashchange", update);
      window.removeEventListener("popstate", update);
    };
  }, []);
  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setScale(
        Math.min(
          1,
          (entry.contentRect.width - 32) / 414,
          (entry.contentRect.height - 24) / 868,
        ),
      );
    });
    observer.observe(stage.current!);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  return (
    <main className="phone-preview">
      <header className="preview-heading">
        <span className="preview-wordmark">
          cine<span>•</span>
        </span>
        <span className="preview-caption">PRÉVIA NO CELULAR</span>
      </header>
      <div className="phone-stage" ref={stage}>
        <div
          className="phone-space"
          style={{ width: 414 * scale, height: 868 * scale }}
        >
          <div
            className="iphone"
            style={{ "--phone-scale": scale } as CSSProperties}
          >
            <div className="phone-side phone-mute" aria-hidden="true" />
            <div className="phone-side phone-volume" aria-hidden="true" />
            <div className="phone-side phone-power" aria-hidden="true" />
            <div className="iphone-screen">
              <div className="iphone-status" aria-hidden="true">
                <span>
                  {time.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <div className="dynamic-island">
                  <i />
                </div>
                <div className="phone-indicators">
                  <span className="signal-bars">
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                  <Wifi size={17} />
                  <Battery size={23} variant="Bold" />
                </div>
              </div>
              <iframe
                title="Cine — aplicativo na tela do iPhone"
                src={src}
                className="phone-app"
                allow="fullscreen"
              />
              <div className="iphone-home" aria-hidden="true">
                <span />
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className="preview-footer">
        <span className="preview-dot" /> iPhone <span>390 × 844</span>
        <p>Use o mouse para navegar e rolar dentro da tela.</p>
      </footer>
    </main>
  );
}

export default function ResponsiveApp() {
  const [showPhone, setShowPhone] = useState(
    () =>
      !isNative && !embedded && (forcePreview || matchMedia(desktop).matches),
  );
  useEffect(() => {
    if (isNative || embedded || forcePreview) return;
    const query = matchMedia(desktop);
    const update = () => {
      void useStore.persist.rehydrate();
      setShowPhone(query.matches);
    };
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return showPhone ? <PhonePreview /> : <App />;
}
