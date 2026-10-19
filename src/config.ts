/**
 * Feedback delivery via Formspree.
 * Only the feedback text is sent — never image files.
 */
export const FEEDBACK_FORMSPREE_ENDPOINT = 'https://formspree.io/f/xdeaonwn';

/**
 * Optional support / donate link (PayPal.Me).
 */
export const DONATE_URL = 'https://www.paypal.me/SergejZarev';

/**
 * Legal details (Impressum / Datenschutz)
 */
export const LEGAL = {
  name: 'Sergej Zarev',
  addressLines: ['Eggersweide 18', '22159 Hamburg', 'Deutschland'],
  phone: '',
  email: 'sergej.zarev@gmail.com',
  siteUrl: 'https://duplicate-image-finder-two.vercel.app/',
  hostingName: 'Vercel Inc.',
  hostingAddress: '340 S Lemon Ave #4133, Walnut, CA 91789, USA',
  donateProvider: 'PayPal (paypal.me/SergejZarev)',
  feedbackProvider: 'Formspree',
};
