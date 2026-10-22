export type Lang = 'sr' | 'ru' | 'en';
const S = {
  hello: { sr: 'Zdravo!', ru: 'Привет!', en: 'Hi there!' },
  homeSub: { sr: 'Šta radimo danas?', ru: 'Чем займёмся сегодня?', en: 'What shall we do today?' },
  talk: { sr: 'Razgovor', ru: 'Разговор', en: 'Conversation' },
  talkSub: { sr: 'Pričaj naglas u pravim situacijama', ru: 'Говорите вслух в живых ситуациях', en: 'Speak out loud in real situations' },
  stories: { sr: 'Priče', ru: 'Сказки', en: 'Stories' },
  storiesSub: { sr: 'Bajka u kojoj je dete junak', ru: 'Сказка, где ребёнок — герой', en: 'A tale where your child is the hero' },
  recent: { sr: 'Poslednje priče', ru: 'Последние сказки', en: 'Recent stories' },
  pickPlace: { sr: 'Gde idemo?', ru: 'Куда идём?', en: 'Where are we going?' },
  pickPlaceSub: { sr: 'Izaberi mesto i pričaj sa Pričkom', ru: 'Выберите место и поговорите с Pričko', en: 'Pick a place and talk with Pričko' },
  goal: { sr: 'Cilj', ru: 'Цель', en: 'Goal' },
  hold: { sr: 'Drži i pričaj ili dodirni', ru: 'Держите и говорите или нажмите', en: 'Hold to speak or tap' },
  tapToSend: { sr: 'Dodirni da pošalješ', ru: 'Нажмите, чтобы отправить', en: 'Tap to send' },
  listening: { sr: 'Slušam…', ru: 'Слушаю…', en: 'Listening…' },
  thinking: { sr: 'Pričko razmišlja…', ru: 'Pričko думает…', en: 'Pričko is thinking…' },
  tooShort: { sr: 'Drži dugme dok pričaš', ru: 'Держите кнопку, пока говорите', en: 'Keep holding while you speak' },
  notHeard: { sr: 'Nisam čuo, probaj ponovo', ru: 'Не расслышал, попробуйте ещё раз', en: "Didn't catch that, try again" },
  youCanSay: { sr: 'Možeš reći', ru: 'Можно сказать', en: 'You could say' },
  typeHere: { sr: 'Napiši na srpskom…', ru: 'Напишите по-сербски…', en: 'Type in Serbian…' },
  send: { sr: 'Pošalji', ru: 'Отправить', en: 'Send' },
  better: { sr: 'Bolje', ru: 'Правильнее', en: 'Better' },
  bravo: { sr: 'Bravo! Uspeo si.', ru: 'Браво! Получилось.', en: 'Bravo! You did it.' },
  again: { sr: 'Još jednom', ru: 'Ещё раз', en: 'Once more' },
  micDenied: { sr: 'Dozvoli mikrofon u podešavanjima telefona', ru: 'Разрешите микрофон в настройках телефона', en: 'Allow the microphone in phone settings' },
  busy: { sr: 'Pričko je sada zauzet. Probaj za minut.', ru: 'Pričko сейчас занят. Попробуйте через минуту.', en: 'Pričko is busy right now. Try again in a minute.' },
  limit: { sr: 'Za danas je dosta. Vidimo se sutra!', ru: 'На сегодня хватит. Увидимся завтра!', en: "That's enough for today. See you tomorrow!" },
  offline: { sr: 'Nema veze sa serverom', ru: 'Нет связи с сервером', en: 'No connection to the server' },
  newStory: { sr: 'Nova priča', ru: 'Новая сказка', en: 'New story' },
  childName: { sr: 'Ime deteta', ru: 'Имя ребёнка', en: "Child's name" },
  age: { sr: 'Uzrast', ru: 'Возраст', en: 'Age' },
  years: { sr: 'god.', ru: 'лет', en: 'y.o.' },
  girl: { sr: 'Devojčica', ru: 'Девочка', en: 'Girl' },
  boy: { sr: 'Dečak', ru: 'Мальчик', en: 'Boy' },
  world: { sr: 'Gde se dešava', ru: 'Где происходит', en: 'Where it happens' },
  likes: { sr: 'Šta voli', ru: 'Что любит', en: 'What they love' },
  likeAdd: { sr: 'Dodaj nešto svoje', ru: 'Добавить своё', en: 'Add your own' },
  write: { sr: 'Napiši priču', ru: 'Написать сказку', en: 'Write the story' },
  writing: { sr: 'Pričko piše priču…', ru: 'Pričko пишет сказку…', en: 'Pričko is writing…' },
  writingSub: { sr: 'Obično traje do pola minuta', ru: 'Обычно до полуминуты', en: 'Usually under half a minute' },
  listen: { sr: 'Slušaj', ru: 'Слушать', en: 'Listen' },
  pause: { sr: 'Pauza', ru: 'Пауза', en: 'Pause' },
  words: { sr: 'Nove reči', ru: 'Новые слова', en: 'New words' },
  noStories: { sr: 'Ovde će biti tvoje priče', ru: 'Здесь появятся ваши сказки', en: 'Your stories will appear here' },
  settings: { sr: 'Podešavanja', ru: 'Настройки', en: 'Settings' },
  appLang: { sr: 'Jezik aplikacije', ru: 'Язык приложения', en: 'App language' },
  showTr: { sr: 'Prikaži prevod', ru: 'Показывать перевод', en: 'Show translation' },
  about: { sr: 'Pričko uči srpski kroz razgovor i priče.', ru: 'Pričko учит сербскому через разговор и сказки.', en: 'Pričko teaches Serbian through talk and stories.' },
  delete: { sr: 'Obriši', ru: 'Удалить', en: 'Delete' },
  needName: { sr: 'Upiši ime', ru: 'Введите имя', en: 'Enter a name' },
  worlds: {
    dragons: { sr: 'Zmajevi', ru: 'Драконы', en: 'Dragons' }, space: { sr: 'Svemir', ru: 'Космос', en: 'Space' },
    sea: { sr: 'Pod Dunavom', ru: 'Под Дунаем', en: 'Under the Danube' }, forest: { sr: 'Čarobna šuma', ru: 'Волшебный лес', en: 'Magic forest' },
  },
  likeList: {
    sr: ['zmajevi', 'palačinke', 'mačke', 'fudbal', 'dinosaurusi', 'crtanje', 'bicikl', 'kuce'],
    ru: ['драконы', 'блинчики', 'кошки', 'футбол', 'динозавры', 'рисование', 'велосипед', 'собаки'],
    en: ['dragons', 'pancakes', 'cats', 'football', 'dinosaurs', 'drawing', 'bike', 'dogs'],
  },
} as const;
export type Key = Exclude<keyof typeof S, 'worlds' | 'likeList'>;
export function t(lang: Lang, k: Key): string { return (S[k] as Record<Lang, string>)[lang]; }
export function worldName(lang: Lang, w: keyof typeof S.worlds) { return S.worlds[w][lang]; }
export function likeList(lang: Lang) { return S.likeList[lang] as readonly string[]; }
export function defaultLang(): Lang {
  try {
    const l = Intl.DateTimeFormat().resolvedOptions().locale.slice(0, 2).toLowerCase();
    if (['ru', 'uk', 'be', 'kk'].includes(l)) return 'ru';
    if (['sr', 'hr', 'bs', 'me', 'sl', 'mk'].includes(l)) return 'sr';
    return 'en';
  } catch { return 'ru'; }
}
