import { useMemo } from "react";

const translations = {
  en: {
    yourName: "Your name",
    joinRoom: "Join room",
    createRoom: "Create room",
    copied: "Copied!",
    copyLink: "Copy link",
    newName: "New name",
    save: "Save",
    cancel: "Cancel",
    changeName: "Change name",
    adminToggle: "Admin",
    spectator: "Spectator",
    leaveRoom: "Leave room",
    yourVote: "Your vote",
    result: "Result",
    noConsensus: "No consensus",
    points: "pts",
    person: (count) => (count === 1 ? "person" : "people"),
    participants: "Participants",
    admin: "admin",
    spectatorBadge: "spectator",
    kick: "Kick",
    revealCards: "Reveal cards",
    newRound: "New round",
    enterYourName: "Enter your name",
    enterRoomCode: "Enter room code",
    kickedByAdmin: "You have been removed from the room by the admin",
    qrCode: "QR",
    scanToJoin: "Scan to join",
  },
  pl: {
    yourName: "Twoje imię",
    joinRoom: "Dołącz do pokoju",
    createRoom: "Stwórz pokój",
    copied: "Skopiowano!",
    copyLink: "Kopiuj link",
    newName: "Nowe imię",
    save: "Zapisz",
    cancel: "Anuluj",
    changeName: "Zmień imię",
    adminToggle: "Admin",
    spectator: "Obserwator",
    leaveRoom: "Wyjdź z pokoju",
    yourVote: "Twój głos",
    result: "Wynik",
    noConsensus: "Brak zgody",
    points: "pkt",
    person: (count) => {
      if (count === 1) return "osoba";
      if (count >= 2 && count <= 4) return "osoby";
      return "osób";
    },
    participants: "Uczestnicy",
    admin: "admin",
    spectatorBadge: "obserwator",
    kick: "Wyrzuć",
    revealCards: "Odkryj karty",
    newRound: "Nowa runda",
    enterYourName: "Podaj swoje imię",
    enterRoomCode: "Podaj kod pokoju",
    kickedByAdmin: "Zostałeś usunięty z pokoju przez admina",
    qrCode: "QR",
    scanToJoin: "Zeskanuj, aby dołączyć",
  },
};

function detectLanguage() {
  const lang = navigator.language || "";
  return lang.startsWith("pl") ? "pl" : "en";
}

const currentLang = detectLanguage();

export function useTranslation() {
  const t = useMemo(() => {
    const dict = translations[currentLang];
    return (key, ...args) => {
      const val = dict[key];
      if (typeof val === "function") return val(...args);
      return val ?? key;
    };
  }, []);

  return { t };
}
