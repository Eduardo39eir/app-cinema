import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

export const isNative = Capacitor.isNativePlatform();

export async function installAndroidBackHandler() {
  if (!isNative) return () => {};
  const listener = await App.addListener("backButton", () => {
    const dialogs =
      document.querySelectorAll<HTMLDialogElement>("dialog[open]");
    const dialog = dialogs[dialogs.length - 1];
    if (dialog) {
      dialog
        .querySelector<HTMLButtonElement>('button[aria-label="Fechar painel"]')
        ?.click();
    } else if (window.history.state?.idx > 0) {
      window.history.back();
    } else if (location.pathname !== "/") {
      location.replace("/");
    } else {
      void App.minimizeApp();
    }
  });
  return () => {
    void listener.remove();
  };
}

export async function shareTicket(
  filename: string,
  content: string,
  text = false,
) {
  const file = await Filesystem.writeFile({
    path: `ingressos/${filename}`,
    data: text ? content : content.split(",")[1],
    directory: Directory.Cache,
    recursive: true,
    ...(text ? { encoding: Encoding.UTF8 } : {}),
  });
  await Share.share({
    title: "Ingresso Cine",
    files: [file.uri],
    dialogTitle: "Salvar ou compartilhar ingresso",
  });
}
