export const C = {
  paper: '#FFFFFF', paper2: '#F7F7F7', card: '#FFFFFF', ink: '#3C3C3C', soft: '#777777', faint: '#AFAFAF',
  indigo: '#3A4FB8', indigoSoft: '#E6EBFF', red: '#FF4B4B', ochre: '#FFC800', ochreSoft: '#FFF5D1', green: '#58CC02',
  line: '#E5E5E5', shadow: '#000000',
  blue: '#1CB0F6', blueShade: '#1899D6', blueSoft: '#DDF4FF', blueLine: '#84D8FF',
  greenShade: '#58A700', greenSoft: '#D7FFB8', redShade: '#EA2B2B', redSoft: '#FFDFE0', orange: '#FF9600', gray: '#E5E5E5', grayShade: '#CECECE',
};
export const F = {
  display: 'Nunito_900Black', displayBold: 'Nunito_800ExtraBold', serif: 'Alegreya_800ExtraBold',
  body: 'Nunito_500Medium', bodyBold: 'Nunito_700Bold', bodyHeavy: 'Nunito_800ExtraBold',
};
export const R = { s: 12, m: 18, l: 26, pill: 999 };
export const shadow = (h = 10) => ({ shadowColor: C.shadow, shadowOpacity: 0.08, shadowRadius: h * 1.6, shadowOffset: { width: 0, height: h }, elevation: Math.round(h / 1.5) });
export const IMG = {
  pricko: require('../assets/img/pricko.png'), bakery: require('../assets/img/bakeryV.jpg'), taxi: require('../assets/img/taxi.jpg'),
  pijaca: require('../assets/img/pijaca.jpg'), kafana: require('../assets/img/kafana.jpg'), doctor: require('../assets/img/doctor.jpg'),
  book: require('../assets/img/book.jpg'), space: require('../assets/img/space.jpg'), sea: require('../assets/img/sea.jpg'), forest: require('../assets/img/forest.jpg'), bed: require('../assets/img/bedW.jpg'),
  happy: require('../assets/img/p-happy.png'), sad: require('../assets/img/p-sad.png'), think: require('../assets/img/p-think.png'), wave: require('../assets/img/p-wave.png'),
  burek: require('../assets/img/burek.png'), coffee: require('../assets/img/coffee.png'),
};
export const ICON = {
  flame: require('../assets/ui/i-flame.png'), star: require('../assets/ui/i-star.png'), heart: require('../assets/ui/i-heart.png'),
  crown: require('../assets/ui/i-crown.png'), lock: require('../assets/ui/i-lock.png'), check: require('../assets/ui/i-check.png'),
  chest: require('../assets/ui/i-chest.png'), bolt: require('../assets/ui/i-bolt.png'), speaker: require('../assets/ui/i-speaker.png'), mic: require('../assets/ui/i-mic.png'),
};
export const WORLD_IMG: Record<string, any> = { dragons: IMG.book, space: IMG.space, sea: IMG.sea, forest: IMG.forest };
