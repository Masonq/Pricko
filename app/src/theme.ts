export const C = {
  paper: '#FFF4E0', paper2: '#F8E4C1', card: '#FFFBF3', ink: '#2B2420', soft: '#6A5C52', faint: '#A69686',
  indigo: '#2D3C78', indigoSoft: '#E4E7F4', red: '#B8322A', ochre: '#E2A23A', ochreSoft: '#FBEBC9', green: '#5E7F3C',
  line: 'rgba(43,36,32,0.10)', shadow: '#3A2414',
};
export const F = {
  display: 'Alegreya_800ExtraBold', displayBold: 'Alegreya_700Bold',
  body: 'Nunito_500Medium', bodyBold: 'Nunito_700Bold', bodyHeavy: 'Nunito_800ExtraBold',
};
export const R = { s: 12, m: 18, l: 26, pill: 999 };
export const shadow = (h = 10) => ({ shadowColor: C.shadow, shadowOpacity: 0.18, shadowRadius: h * 1.6, shadowOffset: { width: 0, height: h }, elevation: Math.round(h / 1.5) });
export const IMG = {
  pricko: require('../assets/img/pricko.png'), bakery: require('../assets/img/bakeryV.jpg'), taxi: require('../assets/img/taxi.jpg'),
  pijaca: require('../assets/img/pijaca.jpg'), kafana: require('../assets/img/kafana.jpg'), doctor: require('../assets/img/doctor.jpg'),
  book: require('../assets/img/book.jpg'), space: require('../assets/img/space.jpg'), bed: require('../assets/img/bedW.jpg'),
  burek: require('../assets/img/burek.png'), coffee: require('../assets/img/coffee.png'),
};
