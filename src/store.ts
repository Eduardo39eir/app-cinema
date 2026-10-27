import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { newId } from "./id";
import {
  dayOffset,
  initialChats,
  initialLists,
  initialPosts,
  makeSessions,
  movies,
  today,
} from "./data";
import type {
  Chat,
  MovieList,
  Notice,
  Post,
  Preferences,
  Review,
  Session,
  Ticket,
  User,
} from "./types";

const uid = newId;
const unique = (arr: string[]) => [...new Set(arr)];
const toggle = (arr: string[], id: string) =>
  arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
const initial = () => ({
  onboarded: false,
  profile: {
    id: "me",
    name: "Visitante",
    bio: "A vida fica melhor com bons filmes.",
    avatar: "/assets/guest.svg",
    cover: "/assets/interstellar-bg.jpg",
    favorites: [],
  } as User,
  preferences: {
    genres: [],
    privateProfile: false,
    privateLists: false,
    notifications: true,
    reducedMotion: false,
    appearance: "cinema",
  } as Preferences,
  watchlist: [] as string[],
  watched: [] as string[],
  favorites: [] as string[],
  reviews: [] as Review[],
  lists: structuredClone(initialLists),
  posts: structuredClone(initialPosts),
  chats: structuredClone(initialChats),
  sessions: makeSessions(),
  tickets: [] as Ticket[],
  following: [] as string[],
  notices: [
    {
      id: "welcome",
      title: "Sua próxima história começa aqui",
      text: "Explore o catálogo e salve os filmes que quer ver.",
      url: "/explore",
      read: false,
    },
    {
      id: "collection",
      title: "Uma lista para sentir tudo",
      text: "Conheça a seleção demonstrativa da Ana.",
      url: "/list/nights",
      read: false,
    },
  ] as Notice[],
});
type Data = ReturnType<typeof initial>;
interface Actions {
  finishOnboarding: (genres: string[], favorites: string[]) => void;
  toggleMovie: (
    kind: "watchlist" | "watched" | "favorites",
    id: string,
  ) => void;
  saveReview: (review: Omit<Review, "id">, publish: boolean) => void;
  removeReview: (id: string) => void;
  updateProfile: (profile: Partial<User>) => void;
  updatePreferences: (preferences: Partial<Preferences>) => void;
  saveList: (list: Omit<MovieList, "id" | "userId">, id?: string) => string;
  toggleListMovie: (id: string, movieId: string) => void;
  removeList: (id: string) => void;
  publishList: (id: string) => void;
  togglePost: (id: string, kind: "liked" | "saved") => void;
  comment: (id: string, text: string) => void;
  sendMessage: (id: string, text: string, movieId?: string) => void;
  follow: (id: string) => void;
  readNotice: (id?: string) => void;
  reserve: (
    sessionId: string,
    seats: string[],
    requestId: string,
  ) => { tickets: Ticket[]; error?: string };
  refreshSessions: () => void;
  reset: () => void;
}
const safeStorage = {
  getItem: (name: string) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      window.dispatchEvent(new Event("cine-storage-error"));
    }
  },
  removeItem: (name: string) => {
    try {
      localStorage.removeItem(name);
    } catch {}
  },
};
export const useStore = create<Data & Actions>()(
  persist(
    (set, get) => ({
      ...initial(),
      finishOnboarding: (genres, favorites) =>
        set({
          onboarded: true,
          preferences: { ...get().preferences, genres },
          favorites: unique(favorites),
        }),
      toggleMovie: (kind, id) => set((s) => ({ [kind]: toggle(s[kind], id) })),
      saveReview: (review, publish) =>
        set((s) => {
          const previous = s.reviews.find((r) => r.movieId === review.movieId);
          const saved = { ...review, id: previous?.id ?? uid() };
          let posts = s.posts.map((p) =>
            p.reviewId === saved.id
              ? {
                  ...p,
                  text: saved.comment,
                  rating: saved.rating,
                  spoiler: saved.spoiler,
                  date: saved.date,
                }
              : p,
          );
          if (publish && !posts.some((p) => p.reviewId === saved.id))
            posts = [
              {
                id: uid(),
                userId: "me",
                movieId: saved.movieId,
                reviewId: saved.id,
                text: saved.comment || "Mais uma história registrada.",
                rating: saved.rating,
                spoiler: saved.spoiler,
                date: saved.date,
                likes: 0,
                liked: false,
                saved: false,
                comments: [],
              },
              ...posts,
            ];
          return {
            reviews: [
              ...s.reviews.filter((r) => r.movieId !== saved.movieId),
              saved,
            ],
            watched: unique([...s.watched, saved.movieId]),
            posts,
          };
        }),
      removeReview: (id) =>
        set((s) => ({
          reviews: s.reviews.filter((r) => r.id !== id),
          posts: s.posts.filter((p) => p.reviewId !== id),
        })),
      updateProfile: (profile) =>
        set((s) => ({ profile: { ...s.profile, ...profile } })),
      updatePreferences: (preferences) =>
        set((s) => ({ preferences: { ...s.preferences, ...preferences } })),
      saveList: (list, id) => {
        const listId = id ?? uid();
        set((s) => ({
          lists: [
            ...s.lists.filter((l) => l.id !== listId),
            { ...list, id: listId, userId: "me", movies: unique(list.movies) },
          ],
        }));
        return listId;
      },
      toggleListMovie: (id, movieId) =>
        set((s) => ({
          lists: s.lists.map((l) =>
            l.id === id && l.userId === "me"
              ? { ...l, movies: toggle(l.movies, movieId) }
              : l,
          ),
        })),
      removeList: (id) =>
        set((s) => ({
          lists: s.lists.filter((l) => l.id !== id || l.userId !== "me"),
          posts: s.posts.filter((p) => p.listId !== id),
        })),
      publishList: (id) =>
        set((s) => {
          const list = s.lists.find((l) => l.id === id && l.userId === "me");
          if (
            !list ||
            !list.movies.length ||
            list.private ||
            s.preferences.privateProfile ||
            s.preferences.privateLists
          )
            return {};
          return {
            posts: [
              {
                id: uid(),
                userId: "me",
                movieId: list.movies[0],
                listId: id,
                text: list.description || list.name,
                spoiler: false,
                date: today(),
                likes: 0,
                liked: false,
                saved: false,
                comments: [],
              },
              ...s.posts,
            ],
          };
        }),
      togglePost: (id, kind) =>
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id === id
              ? {
                  ...p,
                  [kind]: !p[kind],
                  likes:
                    kind === "liked" ? p.likes + (p.liked ? -1 : 1) : p.likes,
                }
              : p,
          ),
        })),
      comment: (id, text) => {
        if (!text.trim()) return;
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id === id
              ? {
                  ...p,
                  comments: [
                    ...p.comments,
                    {
                      id: uid(),
                      userId: "me",
                      text: text.trim().slice(0, 1000),
                      date: today(),
                    },
                  ],
                }
              : p,
          ),
        }));
      },
      sendMessage: (id, text, movieId) => {
        if (!text.trim() && !movieId) return;
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === id
              ? {
                  ...c,
                  messages: [
                    ...c.messages,
                    {
                      id: uid(),
                      text: text.trim().slice(0, 2000),
                      movieId,
                      date: new Date().toISOString(),
                      mine: true,
                    },
                  ],
                }
              : c,
          ),
        }));
      },
      follow: (id) => set((s) => ({ following: toggle(s.following, id) })),
      readNotice: (id) =>
        set((s) => ({
          notices: s.notices.map((n) =>
            !id || n.id === id ? { ...n, read: true } : n,
          ),
        })),
      reserve: (sessionId, seats, requestId) => {
        const s = get();
        const existing = s.tickets.filter((t) => t.bookingId === requestId);
        if (existing.length) return { tickets: existing };
        const session = s.sessions.find((x) => x.id === sessionId);
        if (
          !session ||
          new Date(`${session.date}T${session.time}:00`).getTime() <= Date.now()
        )
          return {
            tickets: [],
            error: "Esta sessão já passou. Escolha outro horário.",
          };
        const selected = unique(seats);
        if (
          selected.length < 1 ||
          selected.length > 6 ||
          selected.some((x) => !/^([A-F])([1-8])$/.test(x))
        )
          return {
            tickets: [],
            error: "Selecione entre 1 e 6 assentos válidos.",
          };
        const occupied = [
          ...session.occupied,
          ...s.tickets
            .filter((t) => t.sessionId === sessionId)
            .map((t) => t.seat),
        ];
        if (selected.some((x) => occupied.includes(x)))
          return {
            tickets: [],
            error: "Um dos assentos já está reservado. Atualize sua seleção.",
          };
        const tickets = selected.map((seat) => ({
          id: "CINE-" + uid().slice(0, 8).toUpperCase(),
          bookingId: requestId,
          sessionId,
          seat,
          createdAt: new Date().toISOString(),
        }));
        set({
          tickets: [...s.tickets, ...tickets],
          notices: s.preferences.notifications
            ? [
                {
                  id: uid(),
                  title: "Sua sessão está marcada",
                  text: `${movies.find((m) => m.id === session.movieId)?.title} · ${selected.join(", ")}. Reserva demonstrativa.`,
                  url: `/ticket/${tickets[0].id}`,
                  read: false,
                },
                ...s.notices,
              ]
            : s.notices,
        });
        return { tickets };
      },
      refreshSessions: () =>
        set((s) => ({
          sessions: [
            ...s.sessions,
            ...makeSessions().filter(
              (n) => !s.sessions.some((o) => o.id === n.id),
            ),
          ].filter(
            (x) =>
              x.date >= dayOffset(-1) ||
              s.tickets.some((t) => t.sessionId === x.id),
          ),
        })),
      reset: () => set(initial()),
    }),
    {
      name: "cine-local-v1",
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      merge: (persisted, current) => {
        const p = persisted as Partial<Data> | undefined;
        if (
          !p ||
          !Array.isArray(p.sessions) ||
          !p.profile ||
          !p.preferences ||
          ![
            "watchlist",
            "watched",
            "favorites",
            "reviews",
            "lists",
            "posts",
            "chats",
            "tickets",
            "following",
            "notices",
          ].every((k) => Array.isArray(p[k as keyof Data]))
        )
          return current;
        return { ...current, ...p };
      },
    },
  ),
);
