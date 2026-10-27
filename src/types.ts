export interface Cast {
  name: string;
  role: string;
  photo?: string;
}
export interface Movie {
  id: string;
  title: string;
  original: string;
  year: number;
  duration: number;
  certificate: string;
  genres: string[];
  rating: number;
  synopsis: string;
  director: string;
  cast: Cast[];
  poster: string;
  backdrop: string;
  gallery: string[];
  color: string;
  trailer?: string;
  cinema: boolean;
  type: "Filme" | "Curta";
}
export interface User {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  cover: string;
  favorites: string[];
}
export interface Review {
  id: string;
  movieId: string;
  rating: number;
  comment: string;
  date: string;
  spoiler: boolean;
}
export interface MovieList {
  id: string;
  name: string;
  description: string;
  movies: string[];
  cover?: string;
  private: boolean;
  userId: string;
}
export interface Cinema {
  id: string;
  name: string;
  address: string;
  area: string;
}
export interface Session {
  id: string;
  movieId: string;
  cinemaId: string;
  date: string;
  time: string;
  language: string;
  format: string;
  room: string;
  price: number;
  occupied: string[];
}
export interface Ticket {
  id: string;
  bookingId: string;
  sessionId: string;
  seat: string;
  createdAt: string;
}
export interface Comment {
  id: string;
  userId: string;
  text: string;
  date: string;
}
export interface Post {
  id: string;
  userId: string;
  movieId: string;
  listId?: string;
  reviewId?: string;
  text: string;
  rating?: number;
  spoiler: boolean;
  date: string;
  likes: number;
  liked: boolean;
  saved: boolean;
  comments: Comment[];
}
export interface Message {
  id: string;
  text: string;
  movieId?: string;
  date: string;
  mine: boolean;
}
export interface Chat {
  id: string;
  title: string;
  userId: string;
  messages: Message[];
}
export interface Notice {
  id: string;
  title: string;
  text: string;
  url: string;
  read: boolean;
}
export interface Preferences {
  genres: string[];
  privateProfile: boolean;
  privateLists: boolean;
  notifications: boolean;
  reducedMotion: boolean;
  appearance: "cinema" | "contrast";
}
