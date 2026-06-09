import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { createClient } from '@supabase/supabase-js';

// ── Supabase 설정 ──────────────────────────────────────────
const SUPABASE_URL = 'https://fwlleigtngjklisivobo.supabase.co'; // 공백없이
const SUPABASE_KEY = 'sb_publishable_IxQO0aPsYJlxvRQVE4xjAw_W7ZGrJVz';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
// ──────────────────────────────────────────────────────────

const ACCENT  = '#00C2FF';
const GOOD    = '#00FF88';
const WARN    = '#FFB020';

// ── 테마 색상 ──────────────────────────────────────────────
const DARK_THEME = {
  bg:        '#0D0D0D',
  card:      '#1A1A1A',
  border:    '#2A2A2A',
  text:      '#FFFFFF',
  subText:   '#9A9A9A',
  mutedText: '#666666',
  inputBg:   '#0D0D0D',
  navBg:     '#111111',
  navBorder: '#1A1A1A',
  pillBg:    '#1A1A1A',
  noticeBg:  '#111111',
  modalBg:   '#1A1A1A',
  rowBorder: '#242424',
  logoBg:    '#FFFFFF',
  livePillBg:'#111111',
   goodColor: '#00FF88',
   feeColor:  '#00C2FF',

  // UI sync colors
  amountColor: '#00FF88',
  badgeBg: '#00C2FF',
  badgeText: '#000000',
  badgeBorder: '#00C2FF',
  swapColor: '#00C2FF',
  activePillBg: '#00C2FF',
  activePillBorder: '#00C2FF',
  activePillText: '#000000',
};

const LIGHT_THEME = {
  bg:        '#EDEEF2',
  card:      '#FFFFFF',
  border:    '#D8DCE5',
  text:      '#0D0D0D',
  subText:   '#444444',
  mutedText: '#888888',
  inputBg:   '#F5F6FA',
  navBg:     '#FFFFFF',
  navBorder: '#D8DCE5',
  pillBg:    '#F0F2F7',
  noticeBg:  '#FFF4E0',
  modalBg:   '#FFFFFF',
  rowBorder: '#EBEBF0',
  logoBg:    '#F5F6FA',
  livePillBg:'#F0F2F7',
  accentText: '#0090CC',
  goodColor: '#0A7A45',
  feeColor:  '#0055AA',

  // UI sync colors
  amountColor: '#0055AA',
  badgeBg: '#E8F2FF',
  badgeText: '#0055AA',
  badgeBorder: '#B8D7F5',
  swapColor: '#64748B',
  activePillBg: '#E8F2FF',
  activePillBorder: '#B8D7F5',
  activePillText: '#0055AA',
};

const DATA_REVIEW_DATE = '2026-06-09';

const FX_ENDPOINT = 'https://open.er-api.com/v6/latest/USD';
const COINGECKO_ENDPOINT = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,ripple,solana,tether,usd-coin&vs_currencies=usd';

// USDT/USDC는 항상 $1 — 별도 가격 조회 불필요
const STABLE_COINS = ['USDT', 'USDC'];
const CRYPTO_FX_CODES = ['BTC', 'ETH', 'XRP', 'SOL', 'USDT', 'USDC'];
const COINGECKO_ID_MAP = {
  BTC: 'bitcoin', ETH: 'ethereum', XRP: 'ripple',
  SOL: 'solana', USDT: 'tether', USDC: 'usd-coin',
};

// ── Corridor Tier 모델 (Gemini 역추정 기반, 2026-06-09) ──────
// 각 통화의 리스크/유동성 등급
const CURRENCY_TIER = {
  // Tier G: 기축통화 (최저 마진)
  USD: 'G', EUR: 'G', GBP: 'G',
  // Tier A: 초고용량 수신국 (박리다매)
  INR: 'A', MXN: 'A', PHP: 'A',
  // Tier B+: 주요 금융 선진국
  CAD: 'B+', AUD: 'B+', JPY: 'B+', CHF: 'B+', NZD: 'B+',
  // Tier B: 신흥 허브
  KRW: 'B', SGD: 'B', HKD: 'B', PLN: 'B', SEK: 'B', NOK: 'B',
  // Tier C: 대량 수신 동남아/중동
  THB: 'C', VND: 'C', IDR: 'C', MYR: 'C', SAR: 'C', AED: 'C',
  // Tier D: 고위험/폐쇄형
  BRL: 'D', CNY: 'D', TRY: 'D', ZAR: 'D',
  // Tier E: 초고위험
  ARS: 'E', CLP: 'E', COP: 'E', PEN: 'E',
};

// Tier별 기본 마진 범위
const TIER_MARGIN = {
  'G':  { min: 0.001, mid: 0.003, max: 0.004 },
  'A':  { min: 0.002, mid: 0.005, max: 0.006 },
  'B+': { min: 0.004, mid: 0.006, max: 0.008 },
  'B':  { min: 0.006, mid: 0.009, max: 0.012 },
  'C':  { min: 0.010, mid: 0.015, max: 0.018 },
  'D':  { min: 0.015, mid: 0.022, max: 0.030 },
  'E':  { min: 0.030, mid: 0.040, max: 0.050 },
};

// 방향성 멀티플라이어: 저유동성→고유동성 역송금 페널티
const TIER_ORDER = { 'G': 0, 'A': 1, 'B+': 2, 'B': 3, 'C': 4, 'D': 5, 'E': 6 };
const getDirectionMultiplier = (from, to) => {
  const fromTier = CURRENCY_TIER[from] || 'B';
  const toTier   = CURRENCY_TIER[to]   || 'B';
  const fromOrder = TIER_ORDER[fromTier] ?? 3;
  const toOrder   = TIER_ORDER[toTier]   ?? 3;
  // 역송금(고위험→저위험)이면 페널티
  if (fromOrder > toOrder) return 1.5;
  return 1.0;
};

// Corridor 기반 Wise 수수료 조회 (2026-06-09 실측)
const WISE_CORRIDOR_FEE = {
  'USD-EUR': 5.47,  'USD-JPY': 7.26,  'USD-CNY': 13.49,
  'USD-CAD': 5.75,  'USD-AUD': 5.53,  'USD-INR': 6.85,
  'USD-MXN': 7.67,  'USD-BRL': 11.07, 'USD-KRW': 9.42,
  'EUR-JPY': 7.14,  'EUR-BRL': 10.95, 'EUR-CAD': 5.58,
  'EUR-AUD': 5.36,  'EUR-INR': 6.68,  'EUR-CNY': 13.00,
  'EUR-MXN': 7.52,  'EUR-KRW': 9.21,
};

const REMITLY_CORRIDOR_FEE = {
  'USD-MXN': {
    cash: { min: 3.99, max: 3.99 },
    bank: { min: 1.99, max: 1.99 },
    wallet: { min: 1.99, max: 1.99 },
    card: { min: 1.99, max: 1.99 },
  },
  'USD-BRL': {
    pix: { min: 0, max: 0 },
  },
};

// Wise 수수료 조회: 실측 우선, 없으면 Tier 기반 추정
const getWiseFee = (fromCurrency, toCurrency, amountNum) => {
  const key = `${fromCurrency}-${toCurrency}`;
  const reverseKey = `${toCurrency}-${fromCurrency}`;
  const amountRatio = Math.max(Number(amountNum) || 0, 1) / 1000;
  const amountScale = Math.max(0.35, Math.pow(amountRatio, 0.88));

  if (WISE_CORRIDOR_FEE[key]) {
    return { feeUsd: WISE_CORRIDOR_FEE[key] * amountScale, isVerified: true };
  }

  if (WISE_CORRIDOR_FEE[reverseKey]) {
    return { feeUsd: WISE_CORRIDOR_FEE[reverseKey] * 1.4 * amountScale, isVerified: false };
  }

  const toTier = CURRENCY_TIER[toCurrency] || 'B';
  const tierFeeMap = { 'G': 5.5, 'A': 6.5, 'B+': 6.0, 'B': 8.0, 'C': 9.0, 'D': 11.0, 'E': 14.0 };
  const feeUsd = (tierFeeMap[toTier] || 8.0) * getDirectionMultiplier(fromCurrency, toCurrency) * amountScale;
  return { feeUsd, isVerified: false };
};

// Corridor Tier 기반 마진 조회 (송금사별 multiplier 적용)
const getCorridorMarkup = (fromCurrency, toCurrency, providerMultiplier = 1.0) => {
  const toTier = CURRENCY_TIER[toCurrency] || 'B';
  const base = TIER_MARGIN[toTier] || TIER_MARGIN['B'];
  const dirMult = getDirectionMultiplier(fromCurrency, toCurrency);
  return {
    min: base.min * providerMultiplier * dirMult,
    mid: base.mid * providerMultiplier * dirMult,
    max: base.max * providerMultiplier * dirMult,
  };
};

// 정확도 등급
const ACCURACY = {
  LIVE_API:       { label: 'Live API',        color: '#00FF88' },
  LIVE_QUOTE:     { label: 'Live Quote',      color: '#00FF88' },
  OFFICIAL_SNAPSHOT: { label: 'Official Snapshot', color: '#00FF88' },
  SNAPSHOT_BASED: { label: 'Snapshot Based', color: '#FFB020' },
  INFERRED_MODEL: { label: 'Inferred Model', color: '#FFB020' },
  ESTIMATED_RANGE: { label: 'Estimated Range', color: '#777777' },
  REVIEWED:       { label: 'Reviewed',        color: '#FFB020' },
  REVIEWED_QUOTE: { label: 'Reviewed Quote',  color: '#FFB020' },
  UNSUPPORTED_ROUTE: { label: 'Not Supported', color: '#777777' },
  RANGE_ESTIMATE: { label: 'Estimated Range', color: '#777777' },
  COMPLEX_RANGE:  { label: 'Complex Range',   color: '#777777' },
  LOW_CONFIDENCE: { label: 'Low Confidence',  color: '#FF6B6B' },
  ESTIMATE:       { label: 'Estimate',        color: '#777777' },
};

// 송금사별 가격 계산 모델
const PRICING_MODELS = {
  WISE_FEE_THEN_MIDMARKET: 'WISE_FEE_THEN_MIDMARKET',
  REVOLUT_INTERBANK_WITH_PLAN: 'REVOLUT_INTERBANK_WITH_PLAN',
  MARKUP_IN_RATE: 'MARKUP_IN_RATE',
  COMPLEX_RANGE: 'COMPLEX_RANGE',
};

const PAYMENT_METHOD_LABELS = {
  bank: 'Bank transfer',
  ach: 'ACH bank account',
  debit: 'Debit card',
  credit: 'Credit card',
  balance: 'Wallet balance',
  pyusd: 'PYUSD',
};

const DELIVERY_METHOD_LABELS = {
  bank: 'Bank deposit',
  cash: 'Cash pickup',
  wallet: 'Mobile wallet',
  card: 'Card deposit',
};

const STANDARD_PROVIDER_SPREAD_MIN = 0.0022;
const STANDARD_PROVIDER_SPREAD_MID = 0.0025;
const STANDARD_PROVIDER_SPREAD_MAX = 0.0028;

const CORRIDOR_FEE_WEIGHT = {
  A: 0.85,
  B: 1.00,
  C: 1.15,
  D: 1.35,
  E: 1.60,
};

const getRemitlyFee = (item, fromCurrency, toCurrency) => {
  const key = `${fromCurrency}-${toCurrency}`;
  const routeFees = REMITLY_CORRIDOR_FEE[key];
  if (!routeFees) return null;

  if (key === 'USD-BRL' && item.name?.includes('Economy') && routeFees.pix) {
    return routeFees.pix;
  }

  const method = item.delivery_method === 'cash'
    ? 'cash'
    : item.delivery_method === 'wallet'
      ? 'wallet'
      : item.delivery_method === 'pix'
        ? 'pix'
        : item.delivery_method === 'card' || item.payment_method === 'debit'
          ? 'card'
          : 'bank';

  return routeFees[method] || routeFees.bank || null;
};


const CORRIDOR_TIER_OVERRIDES = {
  'USD-MXN': 'A', 'USD-INR': 'A', 'GBP-EUR': 'A', 'EUR-GBP': 'A',
  'USD-KRW': 'B', 'USD-JPY': 'B', 'EUR-KRW': 'B', 'EUR-JPY': 'B',
  'USD-PHP': 'C', 'USD-THB': 'C', 'EUR-MXN': 'C',
  'USD-BRL': 'D', 'EUR-BRL': 'D', 'USD-CNY': 'D',
  'BRL-KRW': 'E', 'KRW-BRL': 'E', 'BRL-PHP': 'E',
};

const AMOUNT_BAND_MODIFIERS = {
  FEE_FIRST_TRANSPARENT: { MICRO: 1.15, SMALL: 1.05, MEDIUM: 1.00, LARGE: 0.95, XLARGE: 0.95 },
  SLIDING_SPREAD: { MICRO: 1.80, SMALL: 1.50, MEDIUM: 1.00, LARGE: 0.55, XLARGE: 0.35 },
  PLAN_BASED_INTERBANK: { MICRO: 1.20, SMALL: 1.10, MEDIUM: 1.00, LARGE: 0.85, XLARGE: 0.75 },
  SPEED_PAYMENT_BASED: { MICRO: 1.50, SMALL: 1.25, MEDIUM: 1.00, LARGE: 0.90, XLARGE: 0.85 },
  CASH_PICKUP_VARIABLE: { MICRO: 1.60, SMALL: 1.35, MEDIUM: 1.10, LARGE: 1.00, XLARGE: 0.95 },
};

const PROVIDER_FEE_MODELS = {
  Wise: {
    type: 'FEE_FIRST_TRANSPARENT',
    fixedFeeUsd: 0,
    percentFee: 0,
    feeWeight: 1.00,
    applyFeeWeight: false,
    applyCommonSpread: false,
    amountFeeMultiplier: { MICRO: 1.18, SMALL: 1.08, MEDIUM: 1.00, LARGE: 0.94, XLARGE: 0.88 },
  },
  Revolut: {
    type: 'PLAN_BASED_INTERBANK',
    fixedFeeUsd: 0,
    percentFee: 0,
    feeWeight: 0.85,
    fairUsageThresholdUsd: { standard: 1000, plus: 3000, premium: Infinity, metal: Infinity, ultra: Infinity },
    fairUsageFee: { standard: 0.010, plus: 0.005, premium: 0, metal: 0, ultra: 0 },
    weekendFee: { standard: 0.010, plus: 0.005, premium: 0, metal: 0, ultra: 0 },
  },
  Remitly: {
    type: 'SPEED_PAYMENT_BASED',
    fixedFeeUsd: 0,
    fixedFeeMinUsd: 0,
    fixedFeeMaxUsd: 4.99,
    percentFee: 0,
    feeWeight: 2.00,
  },
  OFX: {
    type: 'SLIDING_SPREAD',
    fixedFeeUsd: 0,
    percentFee: 0,
    feeWeight: 1.00,
    applyFeeWeight: false,
  },
  XE: {
    type: 'SLIDING_SPREAD',
    fixedFeeUsd: 0,
    percentFee: 0,
    feeWeight: 1.50,
  },
};

const PAYMENT_METHOD_MODIFIERS = {
  bank: { marginModifier: 1.00, fixedFeeAddUsd: 0 },
  ach: { marginModifier: 1.00, fixedFeeAddUsd: 0 },
  debit: { marginModifier: 1.15, fixedFeeAddUsd: 2.99 },
  credit: { marginModifier: 1.35, fixedFeeAddUsd: 5.99 },
  balance: { marginModifier: 0.95, fixedFeeAddUsd: 0 },
  pix: { marginModifier: 1.00, fixedFeeAddUsd: 0 },
};

const RECEIVE_METHOD_MODIFIERS = {
  bank: { marginModifier: 1.00, fixedFeeAddUsd: 0 },
  cash: { marginModifier: 1.35, fixedFeeAddUsd: 3.99 },
  wallet: { marginModifier: 1.10, fixedFeeAddUsd: 1.00 },
  pix: { marginModifier: 0.95, fixedFeeAddUsd: 0 },
  card: { marginModifier: 1.20, fixedFeeAddUsd: 1.99 },
};

const OFFICIAL_SNAPSHOTS = [
  {
    provider_brand: 'Wise',
    fromCurrency: 'USD',
    toCurrency: 'BRL',
    amount: 1000,
    payment_method: 'ach',
    delivery_method: 'bank',
    officialReceiveAmount: 5135.51,
    officialFee: 11.07,
    checkedAt: '2026-06-08',
  },
  {
    provider_brand: 'Revolut',
    fromCurrency: 'JPY',
    toCurrency: 'EUR',
    amount: 100000,
    payment_method: 'balance',
    delivery_method: 'bank',
    officialReceiveAmount: 535.46,
    officialFee: 878,
    providerRate: 185.115,
    checkedAt: '2026-06-09',
  },
];

// ── FAQ 데이터 ─────────────────────────────────────────────
const FAQ_DATA = [
  {
    q: 'Does TransferIQ send money or execute transfers?',
    a: 'No. TransferIQ is a comparison and estimation tool only. It does not move money, hold funds, or execute any transaction. When you tap "Check Official Quote" or "View Route", it opens the official provider or exchange where you complete the transfer yourself.',
  },
  {
    q: 'Are these the exact amounts I will receive?',
    a: 'No. Remittance figures are indicative. Wise and similar reviewed quotes may use official snapshot data, while many providers are shown as low-to-high ranges because they do not provide free public live quote APIs. Always confirm the final quote on the provider website or app before sending.',
  },
  {
    q: 'Why can TransferIQ differ from Wise, Remitly, Western Union or MoneyGram?',
    a: 'Remittance companies price by corridor, amount, payment method, delivery method, promotions, account status, weekend rules and sometimes customer profile. TransferIQ separates calculation models instead of forcing every provider into one formula, but final provider screens can still differ.',
  },
  {
    q: 'What do the accuracy labels mean?',
    a: 'Live API = fetched in real time. Official Snapshot = a manually checked official provider quote for a specific corridor and date. Reviewed Quote = manually reviewed provider logic. Estimated Range = low-to-high estimate. Complex Range or Low Confidence = provider pricing depends heavily on method, corridor or promotion.',
  },
  {
    q: 'Why is Wise treated differently?',
    a: 'Wise is modeled as fee-then-mid-market: recipient amount = (send amount - Wise fee) × rate. If an official Wise snapshot rate exists for the selected corridor, TransferIQ uses that snapshot rate first; otherwise it falls back to live market FX.',
  },
  {
    q: 'Why is Revolut treated differently?',
    a: 'Revolut uses interbank-style FX, but fees depend on plan, weekend timing and fair-usage limits. TransferIQ models the Standard plan by default and applies a weekend adjustment when relevant.',
  },
  {
    q: 'Why are Remitly Economy and Express separate?',
    a: 'Remitly often prices slower bank-funded transfers and faster card-funded transfers differently. Economy is usually cheaper and slower; Express is faster but usually has worse fees or spread.',
  },
  {
    q: 'Why are cash pickup routes separated?',
    a: 'Cash pickup through providers like Western Union, MoneyGram and WorldRemit can be materially more expensive than bank deposit because the delivery method changes both fee and FX spread.',
  },
  {
    q: 'Why does a provider sometimes show 0 received?',
    a: '0 received means TransferIQ does not currently see a supported payout route for that provider and destination currency. For example, if a provider does not list BRL in its converter or supported corridors, the app marks that route as not supported instead of estimating a fake payout.',
  },
  {
    q: 'How often is the data updated?',
    a: 'FX rates and crypto prices update automatically when the app loads. Provider logic and fee ranges are reviewed manually and carry a review date shown in the Sources tab.',
  },
  {
    q: 'Why is a crypto route sometimes cheaper than a bank transfer?',
    a: 'Crypto withdrawal fees on some networks can be very low, so moving stablecoins between exchanges can look cheaper than traditional remittance. This is shown for fee comparison only and is not a recommendation to use crypto.',
  },
  {
    q: 'Are rankings reliable?',
    a: 'Rankings are indicative. For remittance providers, ranking is based on the midpoint of each provider model. A final official quote can move the order, especially for estimated and low-confidence providers.',
  },
  {
    q: 'Are the provider links safe?',
    a: 'The buttons open official provider or exchange websites. Some are referral links that may give TransferIQ a credit at no extra cost to you. You can always go directly to the provider instead.',
  },
  {
    q: 'Is my data collected?',
    a: 'TransferIQ does not require an account and does not collect personal financial data. Anonymous tap events may be recorded to improve the app. See the Privacy Policy in Settings.',
  },
];

const LOGOS = {
  wise:         require('./assets/logos/wise.png'),
  remitly:      require('./assets/logos/remitly.png'),
  revolut:      require('./assets/logos/revolut.png'),
  ofx:          require('./assets/logos/ofx.png'),
  xe:           require('./assets/logos/xe.png'),
  instarem:     require('./assets/logos/instarem.png'),
  worldremit:   require('./assets/logos/worldremit.png'),
  xoom:         require('./assets/logos/xoom.png'),
  moneygram:    require('./assets/logos/moneygram.png'),
  westernunion: require('./assets/logos/westernunion.png'),
  paypal:       require('./assets/logos/paypal.png'),
  binance:      require('./assets/logos/binance.png'),
  bybit:        require('./assets/logos/bybit.png'),
  okx:          require('./assets/logos/okx.png'),
  usdt:         require('./assets/logos/usdt.png'),
  usdc:         require('./assets/logos/usdc.png'),
  btc:          require('./assets/logos/btc.png'),
  eth:          require('./assets/logos/eth.png'),
  xrp:          require('./assets/logos/xrp.png'),
  sol:          require('./assets/logos/sol.png'),
};

const LOGO_MAP = {
  'Wise': LOGOS.wise, 'Remitly': LOGOS.remitly, 'Revolut': LOGOS.revolut,
  'OFX': LOGOS.ofx, 'XE': LOGOS.xe, 'Instarem': LOGOS.instarem,
  'WorldRemit': LOGOS.worldremit, 'Xoom': LOGOS.xoom, 'MoneyGram': LOGOS.moneygram,
  'Western Union': LOGOS.westernunion, 'PayPal': LOGOS.paypal,
  'Binance': LOGOS.binance, 'Bybit': LOGOS.bybit, 'OKX': LOGOS.okx,
};

const COIN_LOGO_MAP = {
  USDT: LOGOS.usdt,
  USDC: LOGOS.usdc,
  BTC:  LOGOS.btc,
  ETH:  LOGOS.eth,
  XRP:  LOGOS.xrp,
  SOL:  LOGOS.sol,
};

const CRYPTO_ASSETS = {
  USDT: { id: 'tether',   name: 'Tether',   flag: '₮', decimals: 2 },
  USDC: { id: 'usd-coin', name: 'USD Coin', flag: '$', decimals: 2 },
};

const CRYPTO_CODES = Object.keys(CRYPTO_ASSETS);

const CURRENCIES = [
  { code: 'USD',  name: 'US Dollar',          flag: '🇺🇸', decimals: 2,  isCrypto: false },
  { code: 'BRL',  name: 'Brazilian Real',      flag: '🇧🇷', decimals: 2,  isCrypto: false },
  { code: 'KRW',  name: 'South Korean Won',    flag: '🇰🇷', decimals: 0,  isCrypto: false },
  { code: 'EUR',  name: 'Euro',                flag: '🇪🇺', decimals: 2,  isCrypto: false },
  { code: 'GBP',  name: 'British Pound',       flag: '🇬🇧', decimals: 2,  isCrypto: false },
  { code: 'JPY',  name: 'Japanese Yen',        flag: '🇯🇵', decimals: 0,  isCrypto: false },
  { code: 'CNY',  name: 'Chinese Yuan',        flag: '🇨🇳', decimals: 2,  isCrypto: false },
  { code: 'ARS',  name: 'Argentine Peso',      flag: '🇦🇷', decimals: 2,  isCrypto: false },
  { code: 'CLP',  name: 'Chilean Peso',        flag: '🇨🇱', decimals: 0,  isCrypto: false },
  { code: 'COP',  name: 'Colombian Peso',      flag: '🇨🇴', decimals: 0,  isCrypto: false },
  { code: 'MXN',  name: 'Mexican Peso',        flag: '🇲🇽', decimals: 2,  isCrypto: false },
  { code: 'PEN',  name: 'Peruvian Sol',        flag: '🇵🇪', decimals: 2,  isCrypto: false },
  { code: 'CAD',  name: 'Canadian Dollar',     flag: '🇨🇦', decimals: 2,  isCrypto: false },
  { code: 'AUD',  name: 'Australian Dollar',   flag: '🇦🇺', decimals: 2,  isCrypto: false },
  { code: 'NZD',  name: 'New Zealand Dollar',  flag: '🇳🇿', decimals: 2,  isCrypto: false },
  { code: 'CHF',  name: 'Swiss Franc',         flag: '🇨🇭', decimals: 2,  isCrypto: false },
  { code: 'SGD',  name: 'Singapore Dollar',    flag: '🇸🇬', decimals: 2,  isCrypto: false },
  { code: 'HKD',  name: 'Hong Kong Dollar',    flag: '🇭🇰', decimals: 2,  isCrypto: false },
  { code: 'THB',  name: 'Thai Baht',           flag: '🇹🇭', decimals: 2,  isCrypto: false },
  { code: 'VND',  name: 'Vietnamese Dong',     flag: '🇻🇳', decimals: 0,  isCrypto: false },
  { code: 'PHP',  name: 'Philippine Peso',     flag: '🇵🇭', decimals: 2,  isCrypto: false },
  { code: 'INR',  name: 'Indian Rupee',        flag: '🇮🇳', decimals: 2,  isCrypto: false },
  { code: 'IDR',  name: 'Indonesian Rupiah',   flag: '🇮🇩', decimals: 0,  isCrypto: false },
  { code: 'MYR',  name: 'Malaysian Ringgit',   flag: '🇲🇾', decimals: 2,  isCrypto: false },
  { code: 'AED',  name: 'UAE Dirham',          flag: '🇦🇪', decimals: 2,  isCrypto: false },
  { code: 'SAR',  name: 'Saudi Riyal',         flag: '🇸🇦', decimals: 2,  isCrypto: false },
  { code: 'TRY',  name: 'Turkish Lira',        flag: '🇹🇷', decimals: 2,  isCrypto: false },
  { code: 'ZAR',  name: 'South African Rand',  flag: '🇿🇦', decimals: 2,  isCrypto: false },
  { code: 'PLN',  name: 'Polish Zloty',        flag: '🇵🇱', decimals: 2,  isCrypto: false },
  { code: 'SEK',  name: 'Swedish Krona',       flag: '🇸🇪', decimals: 2,  isCrypto: false },
  { code: 'NOK',  name: 'Norwegian Krone',     flag: '🇳🇴', decimals: 2,  isCrypto: false },
  { code: 'USDT', name: 'Tether',   flag: '₮', decimals: 2, isCrypto: true },
  { code: 'USDC', name: 'USD Coin', flag: '$', decimals: 2, isCrypto: true },
  { code: 'BTC',  name: 'Bitcoin',  flag: '₿', decimals: 6, isCrypto: true },
  { code: 'ETH',  name: 'Ethereum', flag: 'Ξ', decimals: 6, isCrypto: true },
  { code: 'XRP',  name: 'XRP',      flag: '✕', decimals: 4, isCrypto: true },
  { code: 'SOL',  name: 'Solana',   flag: '◎', decimals: 4, isCrypto: true },
];

const PROVIDER_UNSUPPORTED_TO_CURRENCIES = {
  Instarem: ['BRL'],
};

// ── Fallback 송금사 데이터 ─────────────────────────────────
// pricing_model 기준으로 업체별 계산법을 분리한다.
// official_rate는 특정 corridor 스냅샷이 있을 때만 우선 사용된다.
const FALLBACK_REMIT = [
  {
    name: 'Wise',
    provider_brand: 'Wise',
    type: 'Bank transfer',
    pricing_model: PRICING_MODELS.WISE_FEE_THEN_MIDMARKET,
    fixed_fee_usd: 0,
    percent_fee: 0.0000,
    fx_markup_min: 0.000,
    fx_markup_mid: 0.000,
    fx_markup_max: 0.000,
    fee_variance: 0.02,
    payment_method: 'ach',
    delivery_method: 'bank',
    speed: 'Seconds–2 days',
    availability: 'Upfront fee deducted first, then mid-market rate',
    url: 'https://wise.com/invite/arhc/joogonk',
    accuracy_level: 'REVIEWED_QUOTE',
    quote_type: 'reviewed_model',
    confidence_level: 'HIGH',
    fee_note: 'Official-style fee first · mid-market rate',
  },
  {
    name: 'Revolut Standard',
    provider_brand: 'Revolut',
    type: 'App transfer',
    pricing_model: PRICING_MODELS.REVOLUT_INTERBANK_WITH_PLAN,
    fixed_fee_usd: 0,
    percent_fee: 0.000,
    fx_markup_min: 0.000,
    fx_markup_mid: 0.000,
    fx_markup_max: 0.003,
    weekend_fee_standard: 0.010,
    weekend_fee_plus: 0.005,
    weekend_fee_premium: 0.000,
    plan_type: 'standard',
    fee_variance: 0.08,
    payment_method: 'balance',
    delivery_method: 'bank',
    speed: 'Instant–2 days',
    availability: 'Standard plan model · weekend/fair-usage can change cost',
    url: 'https://revolut.com/referral/?referral-code=joogon_br_9jj5&geo-redirect',
    accuracy_level: 'REVIEWED_QUOTE',
    quote_type: 'reviewed_model',
    confidence_level: 'MEDIUM',
    fee_note: 'Standard plan · weekend modeled',
  },
  {
    name: 'Remitly Economy',
    provider_brand: 'Remitly',
    type: 'Bank transfer',
    pricing_model: PRICING_MODELS.MARKUP_IN_RATE,
    fixed_fee_usd: 0,
    fixed_fee_min_usd: 0,
    fixed_fee_max_usd: 1.99,
    percent_fee: 0.000,
    fx_markup_min: 0.000,
    fx_markup_mid: 0.000,
    fx_markup_max: 0.000,
    fee_variance: 0.20,
    payment_method: 'bank',
    delivery_method: 'bank',
    speed: '3–5 business days',
    availability: 'Official corridor fee when available; promo excluded',
    url: 'https://www.remitly.com',
    accuracy_level: 'RANGE_ESTIMATE',
    quote_type: 'estimated_range',
    confidence_level: 'MEDIUM',
    fee_note: 'Official corridor fee where public · promo excluded',
  },
  {
    name: 'Remitly Express',
    provider_brand: 'Remitly',
    type: 'Card / fast transfer',
    pricing_model: PRICING_MODELS.MARKUP_IN_RATE,
    fixed_fee_usd: 3.99,
    fixed_fee_min_usd: 3.99,
    fixed_fee_max_usd: 9.99,
    percent_fee: 0.000,
    fx_markup_min: 0.000,
    fx_markup_mid: 0.000,
    fx_markup_max: 0.000,
    fee_variance: 0.25,
    payment_method: 'debit',
    delivery_method: 'bank',
    speed: 'Minutes',
    availability: 'Faster route, usually higher cost',
    url: 'https://www.remitly.com',
    accuracy_level: 'RANGE_ESTIMATE',
    quote_type: 'estimated_range',
    confidence_level: 'MEDIUM',
    fee_note: 'Express range · card cost varies',
  },
  {
    name: 'OFX Large Transfer',
    provider_brand: 'OFX',
    type: 'Large bank transfer',
    pricing_model: PRICING_MODELS.MARKUP_IN_RATE,
    fixed_fee_usd: 0,
    fixed_fee_min_usd: 0,
    fixed_fee_max_usd: 0,
    percent_fee: 0.000,
    fx_markup_min: 0.000,
    fx_markup_mid: 0.000,
    fx_markup_max: 0.000,
    fee_variance: 0.10,
    payment_method: 'bank',
    delivery_method: 'bank',
    speed: '1–3 days',
    availability: 'No OFX US transfer fee; rate margin varies by amount',
    url: 'https://www.ofx.com',
    accuracy_level: 'RANGE_ESTIMATE',
    quote_type: 'estimated_range',
    confidence_level: 'MEDIUM',
    fee_note: 'No transfer fee · login rate margin required',
  },
  {
    name: 'XE Money Transfer',
    provider_brand: 'XE',
    type: 'Bank transfer',
    pricing_model: PRICING_MODELS.MARKUP_IN_RATE,
    fixed_fee_usd: 0,
    fixed_fee_min_usd: 0,
    fixed_fee_max_usd: 4.99,
    percent_fee: 0.000,
    fx_markup_min: 0.000,
    fx_markup_mid: 0.000,
    fx_markup_max: 0.000,
    fee_variance: 0.12,
    payment_method: 'bank',
    delivery_method: 'bank',
    speed: '1–3 days',
    availability: 'Send fee may apply; exact fee shown before confirmation',
    url: 'https://www.xe.com/send-money',
    accuracy_level: 'RANGE_ESTIMATE',
    quote_type: 'estimated_range',
    confidence_level: 'MEDIUM',
    fee_note: 'Send fee varies by method/currency/destination',
  },
  {
    name: 'Instarem Bank Transfer',
    provider_brand: 'Instarem',
    type: 'Bank transfer',
    pricing_model: PRICING_MODELS.MARKUP_IN_RATE,
    fixed_fee_usd: 0,
    percent_fee: 0.0025,
    fx_markup_min: 0.003,
    fx_markup_mid: 0.006,
    fx_markup_max: 0.012,
    fee_variance: 0.20,
    payment_method: 'bank',
    delivery_method: 'bank',
    speed: '1–2 days',
    availability: 'Low margin + transfer fee model',
    url: 'https://www.instarem.com',
    accuracy_level: 'RANGE_ESTIMATE',
    quote_type: 'estimated_range',
    confidence_level: 'MEDIUM',
    fee_note: 'Fee + FX markup range',
  },
  {
    name: 'WorldRemit Bank Deposit',
    provider_brand: 'WorldRemit',
    type: 'Bank deposit',
    pricing_model: PRICING_MODELS.COMPLEX_RANGE,
    fixed_fee_usd: 1.99,
    fixed_fee_min_usd: 0,
    fixed_fee_max_usd: 7.99,
    percent_fee: 0.000,
    fx_markup_min: 0.008,
    fx_markup_mid: 0.018,
    fx_markup_max: 0.030,
    fee_variance: 0.30,
    payment_method: 'bank',
    delivery_method: 'bank',
    speed: 'Minutes–2 days',
    availability: 'Delivery method affects price',
    url: 'https://www.worldremit.com',
    accuracy_level: 'COMPLEX_RANGE',
    quote_type: 'estimated_range',
    confidence_level: 'LOW',
    fee_note: 'Bank deposit estimate',
  },
  {
    name: 'WorldRemit Cash Pickup',
    provider_brand: 'WorldRemit',
    type: 'Cash pickup',
    pricing_model: PRICING_MODELS.COMPLEX_RANGE,
    fixed_fee_usd: 3.99,
    fixed_fee_min_usd: 0,
    fixed_fee_max_usd: 10.99,
    percent_fee: 0.000,
    fx_markup_min: 0.015,
    fx_markup_mid: 0.030,
    fx_markup_max: 0.050,
    fee_variance: 0.35,
    payment_method: 'debit',
    delivery_method: 'cash',
    speed: 'Minutes–2 days',
    availability: 'Cash pickup can cost more',
    url: 'https://www.worldremit.com',
    accuracy_level: 'LOW_CONFIDENCE',
    quote_type: 'estimated_range',
    confidence_level: 'LOW',
    fee_note: 'Cash pickup varies heavily',
  },
  {
    name: 'MoneyGram Online Bank',
    provider_brand: 'MoneyGram',
    type: 'Online bank transfer',
    pricing_model: PRICING_MODELS.COMPLEX_RANGE,
    fixed_fee_usd: 1.99,
    fixed_fee_min_usd: 0,
    fixed_fee_max_usd: 12,
    percent_fee: 0.000,
    fx_markup_min: 0.010,
    fx_markup_mid: 0.020,
    fx_markup_max: 0.035,
    fee_variance: 0.30,
    payment_method: 'bank',
    delivery_method: 'bank',
    speed: 'Minutes–2 days',
    availability: 'Online bank route estimate',
    url: 'https://www.moneygram.com',
    accuracy_level: 'COMPLEX_RANGE',
    quote_type: 'estimated_range',
    confidence_level: 'LOW',
    fee_note: 'Online/bank estimate',
  },
  {
    name: 'MoneyGram Cash Pickup',
    provider_brand: 'MoneyGram',
    type: 'Cash pickup',
    pricing_model: PRICING_MODELS.COMPLEX_RANGE,
    fixed_fee_usd: 4.99,
    fixed_fee_min_usd: 0,
    fixed_fee_max_usd: 12,
    percent_fee: 0.000,
    fx_markup_min: 0.025,
    fx_markup_mid: 0.040,
    fx_markup_max: 0.060,
    fee_variance: 0.40,
    payment_method: 'debit',
    delivery_method: 'cash',
    speed: 'Minutes',
    availability: 'Cash pickup and card routes can be costly',
    url: 'https://www.moneygram.com',
    accuracy_level: 'LOW_CONFIDENCE',
    quote_type: 'estimated_range',
    confidence_level: 'LOW',
    fee_note: 'Cash/card estimate',
  },
  {
    name: 'Western Union Bank Deposit',
    provider_brand: 'Western Union',
    type: 'Bank deposit',
    pricing_model: PRICING_MODELS.COMPLEX_RANGE,
    fixed_fee_usd: 2.99,
    fixed_fee_min_usd: 0,
    fixed_fee_max_usd: 15,
    percent_fee: 0.000,
    fx_markup_min: 0.008,
    fx_markup_mid: 0.018,
    fx_markup_max: 0.035,
    fee_variance: 0.30,
    payment_method: 'bank',
    delivery_method: 'bank',
    speed: 'Minutes–3 days',
    availability: 'Online bank deposit estimate',
    url: 'https://www.westernunion.com',
    accuracy_level: 'COMPLEX_RANGE',
    quote_type: 'estimated_range',
    confidence_level: 'LOW',
    fee_note: 'Bank deposit estimate',
  },
  {
    name: 'Western Union Cash Pickup',
    provider_brand: 'Western Union',
    type: 'Cash pickup',
    pricing_model: PRICING_MODELS.COMPLEX_RANGE,
    fixed_fee_usd: 5.99,
    fixed_fee_min_usd: 0,
    fixed_fee_max_usd: 15,
    percent_fee: 0.000,
    fx_markup_min: 0.025,
    fx_markup_mid: 0.045,
    fx_markup_max: 0.070,
    fee_variance: 0.45,
    payment_method: 'debit',
    delivery_method: 'cash',
    speed: 'Minutes',
    availability: 'Very broad cash network, high variability',
    url: 'https://www.westernunion.com',
    accuracy_level: 'LOW_CONFIDENCE',
    quote_type: 'estimated_range',
    confidence_level: 'LOW',
    fee_note: 'Cash pickup varies heavily',
  },
  {
    name: 'Xoom Bank Deposit',
    provider_brand: 'Xoom',
    type: 'PayPal network',
    pricing_model: PRICING_MODELS.COMPLEX_RANGE,
    fixed_fee_usd: 2.99,
    fixed_fee_min_usd: 0,
    fixed_fee_max_usd: 9.99,
    percent_fee: 0.000,
    fx_markup_min: 0.018,
    fx_markup_mid: 0.032,
    fx_markup_max: 0.060,
    fee_variance: 0.35,
    payment_method: 'bank',
    delivery_method: 'bank',
    speed: 'Minutes–same day',
    availability: 'PayPal network, high FX spread',
    url: 'https://www.xoom.com',
    accuracy_level: 'LOW_CONFIDENCE',
    quote_type: 'estimated_range',
    confidence_level: 'LOW',
    fee_note: 'Payment method varies',
  },
  {
    name: 'PayPal Wallet FX',
    provider_brand: 'PayPal',
    type: 'Wallet transfer',
    pricing_model: PRICING_MODELS.COMPLEX_RANGE,
    fixed_fee_usd: 0,
    percent_fee: 0.000,
    fx_markup_min: 0.030,
    fx_markup_mid: 0.040,
    fx_markup_max: 0.060,
    fee_variance: 0.25,
    payment_method: 'balance',
    delivery_method: 'wallet',
    speed: 'Instant',
    availability: 'Convenient but usually expensive',
    url: 'https://www.paypal.com/us/digital-wallet/send-receive-money/send-money',
    accuracy_level: 'LOW_CONFIDENCE',
    quote_type: 'estimated_range',
    confidence_level: 'LOW',
    fee_note: 'High FX spread estimate',
  },
];

// 2026-06-08 리서치 기준 — USDT/USDC만 (스테이블코인 = $1 고정, 가격 조회 불필요)
const FALLBACK_CRYPTO = [
  { exchange: 'Binance', coin: 'USDT', network: 'TRC20', withdraw_fee: 1.0,  trading_fee: 0.001, url: 'https://www.binance.com/register?ref=TRANSFERIQ' },
  { exchange: 'Binance', coin: 'USDT', network: 'BEP20', withdraw_fee: 0.29, trading_fee: 0.001, url: 'https://www.binance.com/register?ref=TRANSFERIQ' },
  { exchange: 'Binance', coin: 'USDT', network: 'ERC20', withdraw_fee: 1.6,  trading_fee: 0.001, url: 'https://www.binance.com/register?ref=TRANSFERIQ' },
  { exchange: 'Bybit',   coin: 'USDT', network: 'TRC20', withdraw_fee: 1.0,  trading_fee: 0.001, url: 'https://www.bybit.com/invite?ref=5RXZG4Y' },
  { exchange: 'Bybit',   coin: 'USDT', network: 'BEP20', withdraw_fee: 0.5,  trading_fee: 0.001, url: 'https://www.bybit.com/invite?ref=5RXZG4Y' },
  { exchange: 'Bybit',   coin: 'USDT', network: 'ERC20', withdraw_fee: 3.0,  trading_fee: 0.001, url: 'https://www.bybit.com/invite?ref=5RXZG4Y' },
  { exchange: 'OKX',     coin: 'USDT', network: 'TRC20', withdraw_fee: 1.5,  trading_fee: 0.001, url: 'https://okx.com/join/68669712' },
  { exchange: 'OKX',     coin: 'USDT', network: 'BEP20', withdraw_fee: 0.8,  trading_fee: 0.001, url: 'https://okx.com/join/68669712' },
  { exchange: 'OKX',     coin: 'USDT', network: 'ERC20', withdraw_fee: 1.5,  trading_fee: 0.001, url: 'https://okx.com/join/68669712' },
  { exchange: 'Binance', coin: 'USDC', network: 'BEP20', withdraw_fee: 0.29, trading_fee: 0.001, url: 'https://www.binance.com/register?ref=TRANSFERIQ' },
  { exchange: 'Binance', coin: 'USDC', network: 'ERC20', withdraw_fee: 1.6,  trading_fee: 0.001, url: 'https://www.binance.com/register?ref=TRANSFERIQ' },
];

const COIN_FILTERS = ['ALL', 'USDT', 'USDC'];

const APP_VERSION = '1.2.0';

// ── 클릭 추적 ──────────────────────────────────────────────
const trackClick = async ({ providerName, providerType, coin, network, fromCurrency, toCurrency, amount, rank }) => {
  try {
    await supabase.from('click_events').insert({
      provider_name: providerName, provider_type: providerType,
      coin: coin || null, network: network || null,
      from_currency: fromCurrency, to_currency: toCurrency,
      amount, rank, app_version: APP_VERSION,
    });
  } catch (e) { console.log('Track error:', e); }
};

// ── 포맷/계산 유틸 ─────────────────────────────────────────
const formatMoney = (value, currency, decimalsOverride) => {
  const meta = CURRENCIES.find((c) => c.code === currency);
  const decimals = decimalsOverride ?? (meta?.isCrypto ? meta.decimals : 4);
  if (!Number.isFinite(value)) return `— ${currency}`;
  return `${value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} ${currency}`;
};

const formatPercent = (value) => `${((Number(value) || 0) * 100).toFixed(2)}%`;

const clampPositive = (value) => Math.max(Number(value) || 0, 0);

const clampRate = (value) => Math.min(Math.max(Number(value) || 0, 0), 0.25);

const cleanNumberInput = (value) => {
  const cleaned = String(value).replace(/,/g, '').replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  const integerPart = parts[0] || '';
  const decimalPart = parts.length > 1 ? parts.slice(1).join('') : null;
  const formattedInteger = integerPart ? Number(integerPart).toLocaleString('en-US') : '';
  return decimalPart === null ? formattedInteger : `${formattedInteger}.${decimalPart}`;
};

const parseAmountInput = (value) => parseFloat(String(value).replace(/,/g, '')) || 0;

const formatMoneyRange = (lowValue, highValue, currency, decimalsOverride) => {
  const low = Math.min(lowValue, highValue);
  const high = Math.max(lowValue, highValue);
  if (!Number.isFinite(low) || !Number.isFinite(high)) return `??${currency}`;
  if (Math.abs(high - low) < 0.00005) return formatMoney(low, currency, decimalsOverride);
  return `${formatMoney(low, currency, decimalsOverride)} – ${formatMoney(high, currency, decimalsOverride)}`;
};

const getProviderBrand = (item) => {
  if (item.provider_brand) return item.provider_brand;
  const name = item.name || item.exchange || '';
  if (name.includes('Western Union')) return 'Western Union';
  if (name.includes('MoneyGram')) return 'MoneyGram';
  if (name.includes('WorldRemit')) return 'WorldRemit';
  if (name.includes('Remitly')) return 'Remitly';
  if (name.includes('Revolut')) return 'Revolut';
  if (name.includes('Instarem')) return 'Instarem';
  if (name.includes('Xoom')) return 'Xoom';
  if (name.includes('PayPal')) return 'PayPal';
  if (name.includes('Wise')) return 'Wise';
  if (name.includes('OFX')) return 'OFX';
  if (name.includes('XE')) return 'XE';
  return name;
};

const getProviderLogo = (item) => {
  const brand = getProviderBrand(item);
  return LOGO_MAP[item.name] || LOGO_MAP[brand] || LOGOS.wise;
};

const getRemitAccuracyKey = (item) => {
  const level = item.accuracy_level || 'RANGE_ESTIMATE';
  if (level === 'REVIEWED') return 'REVIEWED_QUOTE';
  if (level === 'ESTIMATE') return 'RANGE_ESTIMATE';
  return level;
};

const getFeeFrom = (item, amountNum, fromCurrency, usdToCurrency) => {
  const explicitMid = Number(item.fee_mid_usd);
  const fixedUsd = Number.isFinite(explicitMid) ? explicitMid : (Number(item.fixed_fee_usd) || 0);
  const fixedFeeFrom = fixedUsd * usdToCurrency(fromCurrency);
  const percentFeeFrom = amountNum * (Number(item.percent_fee) || 0);
  const mid = fixedFeeFrom + percentFeeFrom;

  const minUsd = Number(item.fee_min_usd);
  const maxUsd = Number(item.fee_max_usd);
  const min = Number.isFinite(minUsd)
    ? minUsd * usdToCurrency(fromCurrency)
    : Math.max(mid * (1 - getFeeVariance(item)), 0);
  const max = Number.isFinite(maxUsd)
    ? maxUsd * usdToCurrency(fromCurrency)
    : Math.max(mid * (1 + getFeeVariance(item)), 0);

  return { min, mid, max, fixedFeeFrom, percentFeeFrom };
};

const getFeeVariance = (item) => {
  if (Number.isFinite(Number(item.fee_variance))) return Math.max(Number(item.fee_variance), 0);
  const accuracy = getRemitAccuracyKey(item);
  if (['LIVE_QUOTE', 'OFFICIAL_SNAPSHOT', 'REVIEWED_QUOTE', 'REVIEWED'].includes(accuracy)) return 0.03;
  if (accuracy === 'LOW_CONFIDENCE') return 0.40;
  if (accuracy === 'COMPLEX_RANGE') return 0.30;
  return 0.20;
};

const getAmountMarkupMultiplier = (amountNum) => {
  if (amountNum >= 10000) return 0.75;
  if (amountNum >= 5000) return 0.85;
  if (amountNum <= 250) return 1.20;
    return 1.00;
};

const getMarkupProfile = (item, amountNum = 0) => {
  const amountMultiplier = getAmountMarkupMultiplier(amountNum);
  const midRaw = Number(item.fx_markup_mid ?? item.fx_markup ?? 0);
  const mid = clampRate(midRaw * amountMultiplier);

  const accuracy = getRemitAccuracyKey(item);
  const isHighConfidence = ['LIVE_QUOTE', 'OFFICIAL_SNAPSHOT', 'REVIEWED_QUOTE', 'REVIEWED'].includes(accuracy);

  const fallbackMin = isHighConfidence ? Math.max(mid - 0.001, 0) : Math.max(mid * 0.65, 0);
  const fallbackMax = isHighConfidence ? mid + 0.001 : Math.max(mid * 1.65, mid + 0.004);

  return {
    min: clampRate((item.fx_markup_min ?? fallbackMin) * amountMultiplier),
    mid,
    max: clampRate((item.fx_markup_max ?? fallbackMax) * amountMultiplier),
  };
};

const getProviderRate = ({ item, midRate }) => ({
  rate: midRate,
  rateSource: 'live_mid_market',
  rateLabel: 'Live mid-market rate (ExchangeRate-API)',
});

const calculateWiseQuote = ({ item, amountNum, midRate, fromCurrency, toCurrency, usdToCurrency }) => {
  // Corridor별 실측 수수료 우선, 없으면 Tier 기반 추정
  const { feeUsd, isVerified } = getWiseFee(fromCurrency, toCurrency, amountNum);
  const feeFrom = feeUsd * usdToCurrency(fromCurrency);
  const fee = { min: feeFrom * 0.95, mid: feeFrom, max: feeFrom * 1.05 };

  const receivedMid  = Math.max(amountNum - fee.mid, 0) * midRate;
  const receivedLow  = Math.max(amountNum - fee.max, 0) * midRate;
  const receivedHigh = Math.max(amountNum - fee.min, 0) * midRate;

  return {
    pricingModel: PRICING_MODELS.WISE_FEE_THEN_MIDMARKET,
    receivedLow, receivedMid, receivedHigh,
    serviceFeeMin: fee.min,
    serviceFeeFrom: fee.mid,
    serviceFeeMax: fee.max,
    totalCostFrom: fee.mid,
    totalCostRate: amountNum > 0 ? fee.mid / amountNum : 0,
    effectiveRate: midRate,
    markupMin: 0, markupMid: 0, markupMax: 0,
    rateSource: 'live_mid_market',
    rateLabel: isVerified ? 'Corridor verified fee · live mid-market rate' : 'Tier-inferred fee · live mid-market rate',
    modelNote: isVerified ? 'Fee verified · mid-market rate' : 'Fee inferred from corridor tier',
    isVerified,
  };
};

const calculateRevolutQuote = ({ item, amountNum, midRate, isWeekend, fromCurrency, usdToCurrency }) => {
  const fee = getFeeFrom(item, amountNum, fromCurrency, usdToCurrency);

  const plan = item.plan_type || 'standard';
  let weekendFee = 0;
  if (isWeekend) {
    if (plan === 'premium' || plan === 'metal' || plan === 'ultra') weekendFee = Number(item.weekend_fee_premium ?? 0);
    else if (plan === 'plus') weekendFee = Number(item.weekend_fee_plus ?? 0.005);
    else weekendFee = Number(item.weekend_fee_standard ?? 0.010);
  }

  const spreadMin = 0;
  const spreadMid = clampRate(weekendFee);
  const spreadMax = clampRate(weekendFee + Number(item.fx_markup_max ?? 0.003));

  const receivedHigh = Math.max(amountNum - fee.min, 0) * midRate * (1 - spreadMin);
  const receivedMid = Math.max(amountNum - fee.mid, 0) * midRate * (1 - spreadMid);
  const receivedLow = Math.max(amountNum - fee.max, 0) * midRate * (1 - spreadMax);

  const totalCostFrom = fee.mid + (amountNum * spreadMid);

  return {
    pricingModel: PRICING_MODELS.REVOLUT_INTERBANK_WITH_PLAN,
    receivedLow,
    receivedMid,
    receivedHigh,
    serviceFeeMin: fee.min,
    serviceFeeFrom: fee.mid,
    serviceFeeMax: fee.max,
    totalCostFrom,
    totalCostRate: amountNum > 0 ? totalCostFrom / amountNum : 0,
    effectiveRate: midRate * (1 - spreadMid),
    markupMin: spreadMin,
    markupMid: spreadMid,
    markupMax: spreadMax,
    rateSource: 'interbank_model',
    rateLabel: isWeekend ? `${plan} plan · weekend adjustment` : `${plan} plan · weekday model`,
    modelNote: isWeekend ? 'Weekend FX adjustment applied' : 'Weekday interbank-style model',
  };
};

const calculateMarkupQuote = ({ item, amountNum, midRate, fromCurrency, toCurrency, usdToCurrency }) => {
  const fee = getFeeFrom(item, amountNum, fromCurrency, usdToCurrency);

  // Corridor Tier 기반 마진 — 송금사별 multiplier 적용
  const providerMultiplierMap = {
    'Remitly': 2.0, 'OFX': 1.0, 'XE': 1.5,
    'Instarem': 0.9, 'WorldRemit': 2.2, 'MoneyGram': 3.0,
    'Western Union': 3.5, 'Xoom': 3.0, 'PayPal': 4.5,
  };
  const provMult = providerMultiplierMap[item.provider_brand] || 1.5;
  const corridorMarkup = toCurrency ? getCorridorMarkup(fromCurrency, toCurrency, provMult) : null;

  // item에 명시된 마진이 있으면 우선, 없으면 corridor tier 사용
  const itemHasMarkup = item.fx_markup_mid > 0;
  const markup = itemHasMarkup
    ? getMarkupProfile(item, amountNum)
    : (corridorMarkup || getMarkupProfile(item, amountNum));

  const receivedHigh = Math.max(amountNum - fee.min, 0) * midRate * (1 - markup.min);
  const receivedMid  = Math.max(amountNum - fee.mid, 0) * midRate * (1 - markup.mid);
  const receivedLow  = Math.max(amountNum - fee.max, 0) * midRate * (1 - markup.max);
  const totalCostFrom = fee.mid + (amountNum * markup.mid);

  return {
    pricingModel: PRICING_MODELS.MARKUP_IN_RATE,
    receivedLow, receivedMid, receivedHigh,
    serviceFeeMin: fee.min,
    serviceFeeFrom: fee.mid,
    serviceFeeMax: fee.max,
    totalCostFrom,
    totalCostRate: amountNum > 0 ? totalCostFrom / amountNum : 0,
    effectiveRate: midRate * (1 - markup.mid),
    markupMin: markup.min,
    markupMid: markup.mid,
    markupMax: markup.max,
    rateSource: 'markup_model',
    rateLabel: `Mid-market minus ${formatPercent(markup.mid)} spread`,
    modelNote: itemHasMarkup ? 'Provider markup model' : 'Corridor tier inferred markup',
  };
};

const calculateComplexRangeQuote = ({ item, amountNum, midRate, fromCurrency, toCurrency, usdToCurrency }) => {
  const base = calculateMarkupQuote({ item, amountNum, midRate, fromCurrency, toCurrency, usdToCurrency });

  const deliveryMethod = item.delivery_method || 'bank';
  const paymentMethod = item.payment_method || 'bank';

  let complexityPenalty = 0;
  if (deliveryMethod === 'cash') complexityPenalty += 0.008;
  if (paymentMethod === 'credit') complexityPenalty += 0.008;
  if (paymentMethod === 'debit') complexityPenalty += 0.004;
  if (getRemitAccuracyKey(item) === 'LOW_CONFIDENCE') complexityPenalty += 0.006;

  const adjustedLow = Math.max(base.receivedLow - (amountNum * midRate * complexityPenalty), 0);
  const adjustedMid = Math.max(base.receivedMid - (amountNum * midRate * complexityPenalty * 0.5), 0);
  const adjustedHigh = base.receivedHigh;

  const adjustedTotalCost = base.totalCostFrom + (amountNum * complexityPenalty);

  return {
    ...base,
    pricingModel: PRICING_MODELS.COMPLEX_RANGE,
    receivedLow: adjustedLow,
    receivedMid: adjustedMid,
    receivedHigh: adjustedHigh,
    totalCostFrom: adjustedTotalCost,
    totalCostRate: amountNum > 0 ? adjustedTotalCost / amountNum : 0,
    markupMid: clampRate(base.markupMid + complexityPenalty * 0.5),
    markupMax: clampRate(base.markupMax + complexityPenalty),
    rateSource: 'complex_range_model',
    rateLabel: 'Complex provider range',
    modelNote: 'Pricing depends on corridor, payment method, delivery method and promotion',
  };
};

const getTransferAmountBand = (amountUsdEquivalent) => {
  if (amountUsdEquivalent < 100) return 'MICRO';
  if (amountUsdEquivalent < 500) return 'SMALL';
  if (amountUsdEquivalent < 3000) return 'MEDIUM';
  if (amountUsdEquivalent < 10000) return 'LARGE';
  return 'XLARGE';
};

const getTransferCorridorTier = (fromCurrency, toCurrency) => {
  const direct = `${fromCurrency}-${toCurrency}`;
  const reverse = `${toCurrency}-${fromCurrency}`;
  if (CORRIDOR_TIER_OVERRIDES[direct]) return CORRIDOR_TIER_OVERRIDES[direct];
  if (CORRIDOR_TIER_OVERRIDES[reverse]) return CORRIDOR_TIER_OVERRIDES[reverse];

  const toTier = CURRENCY_TIER[toCurrency] || 'B';
  if (['G', 'A'].includes(toTier)) return 'A';
  if (['B+', 'B'].includes(toTier)) return 'B';
  if (toTier === 'C') return 'C';
  if (toTier === 'D') return 'D';
  return 'E';
};

const getTransferProviderType = (item) => {
  const configured = PROVIDER_FEE_MODELS[item.provider_brand];
  if (configured?.type) return configured.type;
  if (item.provider_type) return item.provider_type;
  const brand = item.provider_brand;
  if (brand === 'Wise' || brand === 'Instarem') return 'FEE_FIRST_TRANSPARENT';
  if (brand === 'OFX' || brand === 'XE') return 'SLIDING_SPREAD';
  if (brand === 'Revolut') return 'PLAN_BASED_INTERBANK';
  if (brand === 'Remitly' || brand === 'Xoom' || brand === 'PayPal') return 'SPEED_PAYMENT_BASED';
  if (brand === 'Western Union' || brand === 'MoneyGram' || item.delivery_method === 'cash') return 'CASH_PICKUP_VARIABLE';
  return 'SPEED_PAYMENT_BASED';
};

const isTransferRouteSupported = (item, fromCurrency, toCurrency) => {
  const unsupportedTo = [
    ...(PROVIDER_UNSUPPORTED_TO_CURRENCIES[item.provider_brand] || []),
    ...(item.unsupported_to_currencies || []),
  ];

  if (unsupportedTo.includes(toCurrency)) return false;

  if (Array.isArray(item.supported_to_currencies) && item.supported_to_currencies.length > 0) {
    return item.supported_to_currencies.includes(toCurrency);
  }

  if (Array.isArray(item.supported_from_currencies) && item.supported_from_currencies.length > 0) {
    return item.supported_from_currencies.includes(fromCurrency);
  }

  return true;
};

const calculateUnsupportedRouteQuote = (item, fromCurrency, toCurrency) => ({
  pricingModel: getTransferProviderType(item),
  amountBand: 'UNSUPPORTED',
  corridorTier: getTransferCorridorTier(fromCurrency, toCurrency),
  receivedLow: 0,
  receivedMid: 0,
  receivedHigh: 0,
  serviceFeeMin: 0,
  serviceFeeFrom: 0,
  serviceFeeMax: 0,
  totalCostFrom: 0,
  totalCostRate: 0,
  effectiveRate: 0,
  markupMin: 0,
  markupMid: 0,
  markupMax: 0,
  accuracyLevel: 'UNSUPPORTED_ROUTE',
  rateSource: 'provider_availability_override',
  rateLabel: 'Not Supported',
  modelNote: `${item.provider_brand} does not currently support ${toCurrency} for this route`,
  isSupported: false,
});

const findTransferSnapshot = (item, amountNum, fromCurrency, toCurrency) => {
  const routeSnapshots = OFFICIAL_SNAPSHOTS.filter((snapshot) =>
    snapshot.provider_brand === item.provider_brand &&
    snapshot.fromCurrency === fromCurrency &&
    snapshot.toCurrency === toCurrency &&
    snapshot.payment_method === item.payment_method &&
    snapshot.delivery_method === item.delivery_method
  );
  if (!routeSnapshots.length) return null;

  const exact = routeSnapshots.find((snapshot) => Math.abs(snapshot.amount - amountNum) < 0.01);
  if (exact) return { ...exact, matchType: 'exact', amountRatio: 1 };

  return routeSnapshots
    .map((snapshot) => ({
      ...snapshot,
      diffRatio: Math.abs(amountNum - snapshot.amount) / snapshot.amount,
      amountRatio: amountNum / snapshot.amount,
    }))
    .filter((snapshot) => snapshot.diffRatio <= 0.20)
    .sort((a, b) => a.diffRatio - b.diffRatio)[0] || null;
};

const calculateTransferSnapshotQuote = ({ snapshot, item, amountNum, midRate, amountUsdEquivalent }) => {
  const isNearby = snapshot.matchType !== 'exact';
  const ratio = isNearby ? snapshot.amountRatio : 1;
  const feeMid = snapshot.officialFee * ratio;
  const providerType = getTransferProviderType(item);
  const amountBand = getTransferAmountBand(amountUsdEquivalent);
  const feeBuffer = isNearby ? 0.06 : 0.02;
  const providerModel = PROVIDER_FEE_MODELS[item.provider_brand] || {};
  const marginMin = providerModel.applyCommonSpread === false ? 0 : STANDARD_PROVIDER_SPREAD_MIN;
  const marginMid = providerModel.applyCommonSpread === false ? 0 : STANDARD_PROVIDER_SPREAD_MID;
  const marginMax = providerModel.applyCommonSpread === false ? 0 : STANDARD_PROVIDER_SPREAD_MAX;
  const feeMin = Math.max(feeMid * (1 - feeBuffer), 0);
  const feeMax = Math.max(feeMid * (1 + feeBuffer), 0);
  const receivedHigh = Math.max(amountNum - feeMin, 0) * midRate * (1 - marginMin);
  const receivedLow = Math.max(amountNum - feeMax, 0) * midRate * (1 - marginMax);
  const receivedMid = Math.max(amountNum - feeMid, 0) * midRate * (1 - marginMid);
  const totalCostFrom = feeMid + (amountNum * marginMid);

  return {
    pricingModel: providerType,
    amountBand,
    receivedLow,
    receivedMid,
    receivedHigh,
    serviceFeeMin: feeMin,
    serviceFeeFrom: feeMid,
    serviceFeeMax: feeMax,
    totalCostFrom,
    totalCostRate: amountNum > 0 ? totalCostFrom / amountNum : 0,
    effectiveRate: midRate * (1 - marginMid),
    markupMin: marginMin,
    markupMid: marginMid,
    markupMax: marginMax,
    accuracyLevel: isNearby ? 'SNAPSHOT_BASED' : 'OFFICIAL_SNAPSHOT',
    rateSource: isNearby ? 'nearby_official_snapshot' : 'official_snapshot',
    rateLabel: isNearby
      ? `Snapshot Based - checked ${snapshot.checkedAt}`
      : `Official Snapshot - checked ${snapshot.checkedAt}`,
    modelNote: isNearby
      ? (providerModel.applyCommonSpread === false ? 'Nearby official fee + mid-market rate' : 'Nearby official fee + common 0.22%-0.28% spread')
      : (providerModel.applyCommonSpread === false ? 'Official fee + mid-market rate' : 'Official fee + common 0.22%-0.28% spread'),
    checkedAt: snapshot.checkedAt,
  };
};

const calculateTransferIQEstimate = ({
  item,
  amountNum,
  midRate,
  fromCurrency,
  toCurrency,
  isWeekend,
  usdToCurrency,
  amountUsdEquivalent,
}) => {
  const providerType = getTransferProviderType(item);
  const providerModel = PROVIDER_FEE_MODELS[item.provider_brand] || {};
  const amountBand = getTransferAmountBand(amountUsdEquivalent);
  const corridorTier = getTransferCorridorTier(fromCurrency, toCurrency);
  const paymentModifier = PAYMENT_METHOD_MODIFIERS[item.payment_method] || PAYMENT_METHOD_MODIFIERS.bank;
  const receiveModifier = RECEIVE_METHOD_MODIFIERS[item.delivery_method] || RECEIVE_METHOD_MODIFIERS.bank;

  const marginMin = providerModel.applyCommonSpread === false ? 0 : STANDARD_PROVIDER_SPREAD_MIN;
  const marginMid = providerModel.applyCommonSpread === false ? 0 : STANDARD_PROVIDER_SPREAD_MID;
  const marginMax = providerModel.applyCommonSpread === false ? 0 : STANDARD_PROVIDER_SPREAD_MAX;
  const defaultAmountFeeMultiplier = AMOUNT_BAND_MODIFIERS[providerType]?.[amountBand] ?? 1;
  const amountFeeMultiplier = providerModel.amountFeeMultiplier?.[amountBand] ?? defaultAmountFeeMultiplier;
  const corridorFeeWeight = CORRIDOR_FEE_WEIGHT[corridorTier] ?? 1;
  const providerFeeWeight = Number(providerModel.feeWeight ?? 1);
  const wiseFee = item.provider_brand === 'Wise'
    ? getWiseFee(fromCurrency, toCurrency, amountNum).feeUsd
    : null;
  const remitlyFee = item.provider_brand === 'Remitly'
    ? getRemitlyFee(item, fromCurrency, toCurrency)
    : null;
  const hasOfficialFee = wiseFee !== null || remitlyFee !== null || item.provider_brand === 'OFX';
  const feeWeight = providerModel.applyFeeWeight === false || hasOfficialFee
    ? 1
    : corridorFeeWeight * providerFeeWeight;
  const fixedFeeMinUsd = Number(
    remitlyFee?.min ??
    item.fee_min_usd ??
    item.fixed_fee_min_usd ??
    wiseFee ??
    providerModel.fixedFeeMinUsd ??
    providerModel.fixedFeeUsd ??
    item.fixed_fee_usd ??
    0
  );
  const fixedFeeMaxUsd = Number(
    remitlyFee?.max ??
    item.fee_max_usd ??
    item.fixed_fee_max_usd ??
    wiseFee ??
    providerModel.fixedFeeMaxUsd ??
    providerModel.fixedFeeUsd ??
    item.fixed_fee_usd ??
    fixedFeeMinUsd
  );
  const officialFeeBuffer = wiseFee !== null ? 0.02 : 0;
  const rangedFixedFeeMinUsd = officialFeeBuffer > 0
    ? Math.max(fixedFeeMinUsd * (1 - officialFeeBuffer), 0)
    : fixedFeeMinUsd;
  const rangedFixedFeeMaxUsd = officialFeeBuffer > 0
    ? Math.max(fixedFeeMaxUsd * (1 + officialFeeBuffer), 0)
    : fixedFeeMaxUsd;
  const methodFeeAddUsd = paymentModifier.fixedFeeAddUsd + receiveModifier.fixedFeeAddUsd;
  const usdToFrom = usdToCurrency(fromCurrency);
  const baseFeeMinFrom = (rangedFixedFeeMinUsd + methodFeeAddUsd) * amountFeeMultiplier * feeWeight * usdToFrom;
  const baseFeeMaxFrom = (rangedFixedFeeMaxUsd + methodFeeAddUsd) * amountFeeMultiplier * feeWeight * usdToFrom;
  let percentFeeFrom = amountNum * Number(providerModel.percentFee ?? item.percent_fee ?? 0) * feeWeight;

  if (providerType === 'PLAN_BASED_INTERBANK') {
    const plan = item.plan_type || 'standard';
    const weekendFee = isWeekend ? Number(providerModel.weekendFee?.[plan] ?? item.weekend_fee_standard ?? 0.010) : 0;
    const fairUsageThreshold = Number(providerModel.fairUsageThresholdUsd?.[plan] ?? Infinity);
    const fairUsageFee = Number(providerModel.fairUsageFee?.[plan] ?? 0);
    const excessUsd = Math.max(amountUsdEquivalent - fairUsageThreshold, 0);
    const excessFrom = excessUsd * usdToFrom;
    percentFeeFrom += ((amountNum * weekendFee) + (excessFrom * fairUsageFee)) * feeWeight;
  }

  const feeMin = baseFeeMinFrom + percentFeeFrom;
  const feeMax = baseFeeMaxFrom + percentFeeFrom;
  const feeMid = (feeMin + feeMax) / 2;
  const receivedHigh = Math.max(amountNum - feeMin, 0) * midRate * (1 - marginMin);
  const receivedLow = Math.max(amountNum - feeMax, 0) * midRate * (1 - marginMax);
  const receivedMid = (receivedLow + receivedHigh) / 2;
  const totalCostFrom = feeMid + (amountNum * marginMid);
  const accuracyLevel = item.accuracy_level === 'LOW_CONFIDENCE' || providerType === 'CASH_PICKUP_VARIABLE'
    ? 'LOW_CONFIDENCE'
    : 'INFERRED_MODEL';

  return {
    pricingModel: providerType,
    amountBand,
    corridorTier,
    receivedLow,
    receivedMid,
    receivedHigh,
    serviceFeeMin: feeMin,
    serviceFeeFrom: feeMid,
    serviceFeeMax: feeMax,
    totalCostFrom,
    totalCostRate: amountNum > 0 ? totalCostFrom / amountNum : 0,
    effectiveRate: midRate * (1 - marginMid),
    markupMin: marginMin,
    markupMid: marginMid,
    markupMax: marginMax,
    accuracyLevel,
    rateSource: 'transferiq_estimate_engine',
    rateLabel: `${ACCURACY[accuracyLevel]?.label || 'Inferred Model'} - Tier ${corridorTier} - ${amountBand}`,
    modelNote: accuracyLevel === 'LOW_CONFIDENCE'
      ? 'Highly variable by payment and receive method'
      : providerModel.applyCommonSpread === false
        ? 'Official fee range + mid-market rate'
        : hasOfficialFee
          ? 'Official fee + common 0.22%-0.28% spread'
          : 'Estimated fee + corridor weight + common 0.22%-0.28% spread',
  };
};
const calculateRemitQuote = ({ item, amountNum, midRate, fromCurrency, toCurrency, isWeekend, usdToCurrency, amountUsdEquivalent }) => {
  if (!isTransferRouteSupported(item, fromCurrency, toCurrency)) {
    return calculateUnsupportedRouteQuote(item, fromCurrency, toCurrency);
  }

  const snapshot = findTransferSnapshot(item, amountNum, fromCurrency, toCurrency);
  if (snapshot) return calculateTransferSnapshotQuote({ snapshot, item, amountNum, midRate, amountUsdEquivalent });

  return calculateTransferIQEstimate({
    item,
    amountNum,
    midRate,
    fromCurrency,
    toCurrency,
    isWeekend,
    usdToCurrency,
    amountUsdEquivalent,
  });
};

// ── 로고 컴포넌트 ─────────────────────────────────────────
const LogoIcon = ({ source, logoBg, coinSource }) => (
  <View style={[styles.logoBox, { backgroundColor: logoBg || '#FFFFFF' }]}>
    <Image source={source} style={styles.logo} resizeMode="contain" />
    {coinSource ? (
      <View style={[styles.coinLogoBadge, { backgroundColor: logoBg || '#FFFFFF' }]}>
        <Image source={coinSource} style={styles.coinLogoBadgeImage} resizeMode="contain" />
      </View>
    ) : null}
  </View>
);

// ── 통화 선택 모달 ────────────────────────────────────────
const CurrencyPicker = ({ visible, title, onClose, onSelect, T }) => (
  <Modal visible={visible} transparent animationType="slide">
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContainer, { backgroundColor: T.modalBg }]}>
        <View style={[styles.modalHeader, { borderBottomColor: T.border }]}>
          <Text style={[styles.modalTitle, { color: T.text }]}>{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Text style={[styles.modalClose, { color: T.subText }]}>✕</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={CURRENCIES}
          keyExtractor={(item) => item.code}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.currencyItem, { borderBottomColor: T.rowBorder }]}
              onPress={() => { onSelect(item.code); onClose(); }}
            >
              {Boolean(item.isCrypto && COIN_LOGO_MAP[item.code]) ? (
                <View style={[styles.currencyLogoBox, { backgroundColor: T.logoBg }]}>
                  <Image source={COIN_LOGO_MAP[item.code]} style={styles.currencyLogo} resizeMode="contain" />
                </View>
              ) : (
                <Text style={styles.currencyFlag}>{item.flag}</Text>
              )}
              <View>
                <Text style={[styles.currencyCode, { color: T.text }]}>{item.code}{item.isCrypto ? '  🔗' : ''}</Text>
                <Text style={[styles.currencyName, { color: T.subText }]}>{item.name}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  </Modal>
);

// ══════════════════════════════════════════════════════════
export default function App() {
  const [isDark, setIsDark] = useState(true);
  const T = isDark ? DARK_THEME : LIGHT_THEME;

  const [activeTab, setActiveTab]     = useState('compare');
  const [rates, setRates]             = useState({ USD: 1 });
  const [rateTime, setRateTime]       = useState('');
  const [cryptoPrices, setCryptoPrices] = useState({ bitcoin: 105000, ethereum: 2500, ripple: 0.55, solana: 160, tether: 1, 'usd-coin': 1 });
  const [loadingRates, setLoadingRates] = useState(true);

  // Supabase 데이터
  const [remitProfiles, setRemitProfiles] = useState(FALLBACK_REMIT);
  const [cryptoRoutes,  setCryptoRoutes]  = useState(FALLBACK_CRYPTO);
  const [loadingDB,     setLoadingDB]     = useState(true);

  const [amount,       setAmount]       = useState('1,000');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency,   setToCurrency]   = useState('BRL');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker,   setShowToPicker]   = useState(false);
  const [selectedCoin,   setSelectedCoin]   = useState('ALL');

  // Settings default pickers
  const [showDefaultFromPicker, setShowDefaultFromPicker] = useState(false);
  const [showDefaultToPicker,   setShowDefaultToPicker]   = useState(false);
  const [defaultFrom, setDefaultFrom] = useState('USD');
  const [defaultTo,   setDefaultTo]   = useState('BRL');
  const [defaultAmount, setDefaultAmount] = useState('1,000');

  // FAQ accordion 펼침 상태 (index, null이면 전부 닫힘)
  const [expandedFaq, setExpandedFaq] = useState(null);
    useEffect(() => {
    let mounted = true;

    // FX 환율 (단일 레퍼런스)
    fetch(FX_ENDPOINT)
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        if (data?.rates) {
          setRates({ USD: 1, ...data.rates });
          setRateTime(data.time_last_update_utc || '');
        }
      })
      .catch((e) => console.log('FX error:', e))
      .finally(() => { if (mounted) setLoadingRates(false); });

    // CoinGecko 크립토 가격 (BTC/ETH/XRP/SOL 환율 표시용)
    fetch(COINGECKO_ENDPOINT)
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        if (data) setCryptoPrices((prev) => ({ ...prev, ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.usd])) }));
      })
      .catch((e) => console.log('CoinGecko error:', e));

    // Supabase 수수료 데이터
const loadDB = async () => {
  try {
    const cryptoRes = await supabase
      .from('crypto_withdrawal_fees')
      .select('*')
      .order('exchange');

    if (!mounted) return;

    // IMPORTANT:
    // Supabase remittance_fees may still contain old rows.
    // For now, force the app to use the new local Pricing Engine v2 data.
    // This makes Wise Official Snapshot calculate correctly:
    // (1000 - 11.07) × 5.1945 = about 5,137 BRL
    setRemitProfiles(FALLBACK_REMIT);

    if (cryptoRes.data && cryptoRes.data.length > 0) {
      setCryptoRoutes(cryptoRes.data);
    }
  } catch (e) {
    console.log('DB error:', e);

    // Even if DB fails, keep local remittance pricing engine alive.
    setRemitProfiles(FALLBACK_REMIT);
  } finally {
    if (mounted) setLoadingDB(false);
  }
};

loadDB();

    return () => { mounted = false; };
  }, []);

  const amountNum = parseAmountInput(amount);

  // ── 주말 여부 (UTC 기준) ────────────────────────────────
  const isWeekend = [0, 6].includes(new Date().getUTCDay());

  const getCryptoPriceUsd = (code) => {
    const id = COINGECKO_ID_MAP[code];
    return id ? (cryptoPrices[id] || 0) : 0;
  };

  const toUSD = (code, value = 1) => {
    if (STABLE_COINS.includes(code)) return value;
    if (CRYPTO_FX_CODES.includes(code)) return value * getCryptoPriceUsd(code);
    if (!rates[code]) return 0;
    return value / rates[code];
  };

  const fromUSD = (code, usdValue = 1) => {
    if (STABLE_COINS.includes(code)) return usdValue;
    if (CRYPTO_FX_CODES.includes(code)) {
      const price = getCryptoPriceUsd(code);
      return price > 0 ? usdValue / price : 0;
    }
    return usdValue * (rates[code] || 0);
  };

const fxRate = (from, to) => fromUSD(to, toUSD(from, 1));
const usdToCurrency = (currency) => fromUSD(currency, 1);

// ── Common FX Benchmark Engine ────────────────────────
// ExchangeRate-API live mid-market rate — single source of truth.
// Every provider (remittance + crypto) starts from this rate
// and deducts only their own fees/markup.
const getCommonMarketRate = (from, to) => fxRate(from, to);

  // ── FROM↔TO 스왑 ────────────────────────────────────────
  const handleSwap = () => {
    const prevFrom = fromCurrency;
    const prevTo   = toCurrency;
    setFromCurrency(prevTo);
    setToCurrency(prevFrom);
  };

  // ── Remit 계산: Common FX Engine 기반 ────────────────
const remitRows = useMemo(() => {
  const commonRate = getCommonMarketRate(fromCurrency, toCurrency);
  const amountUsdEquivalent = toUSD(fromCurrency, amountNum);

  return remitProfiles.map((item) => {
    const quote = calculateRemitQuote({
      item,
      amountNum,
      midRate: commonRate,
      fromCurrency,
      toCurrency,
      isWeekend,
      usdToCurrency,
      amountUsdEquivalent,
    });

    const logo = getProviderLogo(item);
    const accuracyLevel = quote.accuracyLevel || getRemitAccuracyKey(item);
    const feeNote = quote.modelNote || item.fee_note || 'estimate';
    const weekendNote =
      item.pricing_model === PRICING_MODELS.REVOLUT_INTERBANK_WITH_PLAN && isWeekend
        ? ' · weekend model'
        : '';
    const paymentLabel =
      PAYMENT_METHOD_LABELS[item.payment_method] ||
      item.payment_method ||
      item.type ||
      'Transfer';
    const deliveryLabel =
      DELIVERY_METHOD_LABELS[item.delivery_method] ||
      item.delivery_method ||
      'Recipient method';

    return {
      ...item,
      ...quote,
      logo,
      accuracyLevel,
      feeNote,
      weekendNote,
      paymentLabel,
      deliveryLabel,
      received: quote.receivedMid,
    };
  }).sort((a, b) => {
    if (a.isSupported === false && b.isSupported !== false) return 1;
    if (a.isSupported !== false && b.isSupported === false) return -1;
    return b.receivedMid - a.receivedMid;
  });
}, [amountNum, fromCurrency, toCurrency, rates, isWeekend, remitProfiles]);

  // ── Crypto 계산 ──────────────────────────────────────
  const cryptoRows = useMemo(() => {
  // CommonRate — 송금사와 동일한 단일 기준환율
  const commonRate = getCommonMarketRate(fromCurrency, toCurrency);

  // FROM → USD 변환 (trading fee 계산 기준)
  const amountUSD = toUSD(fromCurrency, amountNum);

  const rows = selectedCoin === 'ALL'
    ? cryptoRoutes
    : cryptoRoutes.filter((r) => r.coin === selectedCoin);

  return rows.map((item) => {
    // USDT/USDC는 항상 $1 — 별도 가격 조회 없음
    const withdrawUsd = item.withdraw_fee;           // coin = $1이므로 그대로 USD
    const tradingUsd  = amountUSD * item.trading_fee; // 송금액 USD 기준 0.1%
    const totalUsd    = withdrawUsd + tradingUsd;

    // USD 비용 → FROM 통화로 환산
    const totalFrom = totalUsd * usdToCurrency(fromCurrency);

    // 수취금액 = (보낸금액 - FROM기준수수료) × CommonRate
    const received  = Math.max(amountNum - totalFrom, 0) * commonRate;

    const logo = LOGO_MAP[item.exchange] || LOGOS.binance;
    const coinLogo = COIN_LOGO_MAP[item.coin] || null;

    return {
      ...item,
      withdrawUsd,
      tradingUsd,
      totalUsd,
      totalFrom,
      received,
      logo,
      coinLogo,
      priceSource: 'LIVE_API',
      benchmarkRate: commonRate,
    };
  }).sort((a, b) => a.totalFrom - b.totalFrom);
}, [selectedCoin, amountNum, fromCurrency, toCurrency, rates, cryptoRoutes]);

  // ── 파생 변수 ─────────────────────────────────────────
  const isLoading = loadingRates || loadingDB;
  const bestRemit  = remitRows.find((item) => item.isSupported !== false) || null;
  const bestCrypto = cryptoRows[0] || null;

  // ── StatBox ──────────────────────────────────────────
  const StatBox = ({ label, value, tone }) => (
    <View style={[styles.statBox, { backgroundColor: T.card, borderColor: T.border }]}>
      <Text style={[styles.statLabel, { color: T.subText }]}>{label}</Text>
      <Text
        style={[
          styles.statValue,
          { color: T.text },
          tone === 'good' ? { color: T.amountColor } : null,
          tone === 'warn' ? { color: WARN } : null,
        ]}
      >
        {value}
      </Text>
    </View>
  );

  // ── RemitCard ─────────────────────────────────────────
  const RemitCard = ({ item, index }) => {
    const acc = ACCURACY[item.accuracyLevel] || ACCURACY.RANGE_ESTIMATE;
    const isRange = Math.abs((item.receivedHigh || 0) - (item.receivedLow || 0)) > 0.005;
    const isUnsupported = item.isSupported === false;

    return (
      <View style={[styles.resultCard, { backgroundColor: T.card, borderColor: T.border }]}>
        <LogoIcon source={item.logo} logoBg={T.logoBg} />

        <View style={styles.resultMain}>
          <View style={styles.rowCenter}>
            <Text style={[styles.resultName, { color: T.text }]}>{item.name}</Text>
            {index === 0 ? (
              <View style={[styles.bestBadge, { backgroundColor: T.badgeBg, borderColor: T.badgeBorder }]}>
                <Text style={[styles.bestBadgeText, { color: T.badgeText }]}>TOP ESTIMATE</Text>
              </View>
            ) : null}
          </View>

          <Text style={[styles.resultMeta, { color: T.subText }]}>
            {`${item.paymentLabel} → ${item.deliveryLabel} · ${item.speed}`}
          </Text>

          <Text style={[styles.resultSub, { color: T.mutedText }]}>
            {isUnsupported
              ? `No ${toCurrency} payout route found for this provider`
              : `Fee ~${formatMoney(item.serviceFeeFrom, fromCurrency, 2)}${item.markupMid > 0 ? ` · ${formatPercent(item.markupMid)} spread` : ' · mid-market rate'}${item.weekendNote || ''}`}
          </Text>

          <View style={styles.accuracyRow}>
            <View style={[styles.accuracyDot, { backgroundColor: acc.color }]} />
            <Text style={[styles.accuracyText, { color: T.mutedText }]}>
              {`${acc.label} · ${item.modelNote || item.feeNote}`}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.quoteBtn, { borderColor: T.feeColor, backgroundColor: T.feeColor + '18' }]}
            onPress={() => {
              trackClick({
                providerName: item.name,
                providerType: 'remittance',
                fromCurrency,
                toCurrency,
                amount: amountNum,
                rank: index + 1,
              });
              Linking.openURL(item.url);
            }}
          >
            <Text style={[styles.quoteBtnText, { color: T.feeColor }]}>Check Official Quote →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.resultRight}>
          <Text style={[styles.received, { color: T.goodColor }]}>
            {formatMoneyRange(item.receivedLow, item.receivedHigh, toCurrency, 2)}
          </Text>

          <Text style={[styles.resultConverted, { color: T.mutedText }]}>
            {isUnsupported ? '0 means unsupported corridor' : (isRange ? 'estimated receive range' : 'est. recipient gets')}
          </Text>

          <Text style={[styles.resultConverted, { color: T.mutedText }]}>
            {`midpoint ${formatMoney(item.receivedMid, toCurrency, 2)}`}
          </Text>

          <View style={styles.feeDivider} />

          <Text style={[styles.feeCostLabel, { color: T.mutedText }]}>Est. total cost</Text>
          <Text style={[styles.feeText, { color: T.feeColor }]}>
            {formatMoney(item.totalCostFrom, fromCurrency, 2)}
          </Text>
        </View>
      </View>
    );
  };

  // ── CryptoCard ────────────────────────────────────────
  const CryptoCard = ({ item, index }) => {
    const acc = ACCURACY[item.priceSource] || ACCURACY.ESTIMATE;

    return (
      <View style={[styles.resultCard, { backgroundColor: T.card, borderColor: T.border }]}>
        <LogoIcon source={item.logo} logoBg={T.logoBg} coinSource={item.coinLogo} />

        <View style={styles.resultMain}>
          <View style={styles.rowCenter}>
            <Text style={[styles.resultName, { color: T.text }]}>
              {item.coin === item.network
                ? `${item.exchange} · ${item.coin} Network`
                : `${item.exchange} · ${item.coin} · ${item.network}`}
            </Text>
          </View>

          {index === 0 ? (
            <View style={[styles.bestBadge, { marginBottom: 4, backgroundColor: T.badgeBg, borderColor: T.badgeBorder }]}>
              <Text style={[styles.bestBadgeText, { color: T.badgeText }]}>LOWEST FEE</Text>
            </View>
          ) : null}

          <Text style={[styles.resultMeta, { color: T.subText }]}>
            {`${item.network} · Trading fee ${formatPercent(item.trading_fee)}`}
          </Text>

          <Text style={[styles.resultSub, { color: T.mutedText }]}>
            {`Withdraw fee: ${item.withdraw_fee} ${item.coin} ≈ $${item.withdrawUsd.toFixed(2)}`}
          </Text>

          <View style={styles.accuracyRow}>
            <View style={[styles.accuracyDot, { backgroundColor: acc.color }]} />
            <Text style={[styles.accuracyText, { color: T.mutedText }]}>
              {`${acc.label} · ${item.exchange} ticker`}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.quoteBtn, { borderColor: T.feeColor, backgroundColor: T.feeColor + '18' }]}
            onPress={() => {
              trackClick({
                providerName: item.exchange,
                providerType: 'crypto',
                coin: item.coin,
                network: item.network,
                fromCurrency,
                toCurrency,
                amount: amountNum,
                rank: index + 1,
              });
              Linking.openURL(item.url);
            }}
          >
            <Text style={[styles.quoteBtnText, { color: T.feeColor }]}>View Route →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.resultRight}>
          <Text style={[styles.received, { color: T.amountColor }]}>
            {formatMoney(item.received, toCurrency, 2)}
          </Text>

          <Text style={[styles.resultConverted, { color: T.mutedText }]}>est. after fees</Text>

          <View style={styles.feeDivider} />

          <Text style={[styles.feeCostLabel, { color: T.mutedText }]}>Est. cost</Text>
          <Text style={[styles.feeText, { color: T.feeColor }]}>
            {formatMoney(item.totalFrom, fromCurrency, 2)}
          </Text>
        </View>
      </View>
    );
  };

  const fromMeta = CURRENCIES.find((c) => c.code === fromCurrency);
  const toMeta   = CURRENCIES.find((c) => c.code === toCurrency);

  // ── Amount 0이면 결과 숨기기 여부 ────────────────────
  const hasAmount = amountNum > 0

  // ── 하단 탭 정의 ─────────────────────────────────────
  const tabs = [
    { id: 'compare',  label: 'Compare',  icon: '⚡' },
    { id: 'remit',    label: 'Remit',    icon: '💸' },
    { id: 'crypto',   label: 'Crypto',   iconText: '₿' },
    { id: 'sources',  label: 'Sources',  icon: '📊' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: T.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <CurrencyPicker
        visible={showFromPicker}
        title="From currency"
        onClose={() => setShowFromPicker(false)}
        onSelect={setFromCurrency}
        T={T}
      />

      <CurrencyPicker
        visible={showToPicker}
        title="To currency"
        onClose={() => setShowToPicker(false)}
        onSelect={setToCurrency}
        T={T}
      />

      <CurrencyPicker
        visible={showDefaultFromPicker}
        title="Default FROM"
        onClose={() => setShowDefaultFromPicker(false)}
        onSelect={(code) => {
          setDefaultFrom(code);
          setFromCurrency(code);
        }}
        T={T}
      />

      <CurrencyPicker
        visible={showDefaultToPicker}
        title="Default TO"
        onClose={() => setShowDefaultToPicker(false)}
        onSelect={(code) => {
          setDefaultTo(code);
          setToCurrency(code);
        }}
        T={T}
      />

      {/* ── 헤더 ─────────────────────────────────────── */}
      <View style={[styles.header, { borderBottomColor: T.navBorder }]}>
        <View>
          <Text style={[styles.headerTitle, { color: T.text }]}>TransferIQ</Text>
          <Text style={[styles.headerSub, { color: T.subText }]}>
            FX, remittance & crypto fee comparator
          </Text>
        </View>

        <View style={[styles.livePill, { backgroundColor: T.livePillBg, borderColor: T.border }]}>
          <View style={[styles.liveDot, { backgroundColor: isLoading ? '#777' : GOOD }]} />
          <Text style={[styles.liveText, { color: T.subText }]}>
            {isLoading ? 'Loading' : 'Live FX'}
          </Text>
        </View>
      </View>

      {/* ── 바디 스크롤뷰 ─────────────────────────────── */}
      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
      >
        {/* ── 금액 / 통화 입력 카드 ──────────────────── */}
        <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}>
          <Text style={[styles.cardLabel, { color: T.mutedText }]}>AMOUNT</Text>

          <TextInput
            style={[styles.amountInput, { color: T.text, borderBottomColor: T.border }]}
            value={amount}
            onChangeText={(v) => setAmount(cleanNumberInput(v))}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={T.mutedText}
          />

          <View style={styles.currencyRow}>
            <TouchableOpacity
              style={[styles.currencyBtn, { backgroundColor: T.inputBg, borderColor: T.border }]}
              onPress={() => setShowFromPicker(true)}
            >
              <Text style={[styles.currencyBtnLabel, { color: T.mutedText }]}>FROM</Text>
              <Text style={[styles.currencyBtnValue, { color: T.text }]}>
                {`${fromMeta?.flag ?? ''}  ${fromCurrency}${fromMeta?.isCrypto ? ' 🔗' : ''}`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.arrowBox,
                {
                  backgroundColor: T.pillBg,
                  borderColor: T.border,
                }
              ]}
              onPress={handleSwap}
              hitSlop={10}
            >
              <Text style={[styles.arrowText, { color: T.swapColor }]}>⇄</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.currencyBtn, { backgroundColor: T.inputBg, borderColor: T.border }]}
              onPress={() => setShowToPicker(true)}
            >
              <Text style={[styles.currencyBtnLabel, { color: T.mutedText }]}>TO</Text>
              <Text style={[styles.currencyBtnValue, { color: T.text }]}>
                {`${toMeta?.flag ?? ''}  ${toCurrency}${toMeta?.isCrypto ? ' 🔗' : ''}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Amount 0이면 안내문 표시 */}
        {!hasAmount ? (
          <View style={[styles.noticeCard, { backgroundColor: T.noticeBg }]}>
            <Text style={[styles.noticeText, { color: T.subText }]}>
              💡 Enter an amount above to compare fees and rates.
            </Text>
          </View>
        ) : null}

        {isLoading ? (
          <View style={[styles.loadingCard, { backgroundColor: T.card }]}>
            <ActivityIndicator color={ACCENT} />
            <Text style={[styles.loadingText, { color: T.subText }]}>
              Updating market data...
            </Text>
          </View>
        ) : null}

        {/* ════════════════════ COMPARE TAB ════════════ */}
        {Boolean(activeTab === 'compare' && hasAmount) ? (
          <View>
            <View style={[styles.noticeCard, { backgroundColor: T.noticeBg }]}>
              <Text style={[styles.noticeText, { color: T.subText }]}>
                ⚠️ Estimates only. TransferIQ uses ExchangeRate-API live mid-market rate as the single reference benchmark. Official/public fees are used first. Wise uses fee + mid-market rate; other estimated routes use the benchmark FX plus a 0.22%-0.28% spread range, centered on 0.25%. Final amounts may differ due to local taxes, banking regulations, country-specific policies, and promotions. Not all providers support every currency pair — availability varies by corridor. Always confirm on the official provider site before sending.
              </Text>
            </View>

            <Text style={[styles.sectionLabel, { color: T.mutedText }]}>BEST SUMMARY</Text>

            <View style={styles.statsGrid}>
              <StatBox
                label="Top remittance estimate"
                value={bestRemit ? `${bestRemit.name} · ${formatMoney(bestRemit.receivedMid, toCurrency, 2)}` : '—'}
                tone="good"
              />

              <StatBox
                label="Lowest crypto fee route"
                value={bestCrypto ? `${bestCrypto.exchange} ${bestCrypto.coin}/${bestCrypto.network}` : '—'}
              />

              <StatBox
                label="Mid-market rate"
                value={`1 ${fromCurrency} ≈ ${getCommonMarketRate(fromCurrency, toCurrency).toFixed(4)} ${toCurrency}`}
              />

              <StatBox label="Data review" value={DATA_REVIEW_DATE} tone="warn" />
            </View>

            <Text style={[styles.sectionLabel, { color: T.mutedText }]}>
              TOP REMITTANCE ESTIMATES
            </Text>

            {remitRows.slice(0, 5).map((item, index) => (
              <RemitCard key={`${item.name}-${item.payment_method}-${item.delivery_method}`} item={item} index={index} />
            ))}

            <Text style={[styles.sectionLabel, { color: T.mutedText }]}>
              CRYPTO FEE ROUTES
            </Text>

            {cryptoRows.slice(0, 5).map((item, index) => (
              <CryptoCard key={`${item.exchange}-${item.coin}-${item.network}`} item={item} index={index} />
            ))}
          </View>
        ) : null}

        {/* ════════════════════ REMIT TAB ══════════════ */}
        {activeTab === 'remit' ? (
          <View>
            <View style={[styles.noticeCard, { backgroundColor: T.noticeBg }]}>
              <Text style={[styles.noticeText, { color: T.subText }]}>
                ⚠️ Estimates only. TransferIQ uses ExchangeRate-API live mid-market rate as the single reference benchmark. Official/public fees are used first. Wise uses fee + mid-market rate; other estimated routes use the benchmark FX plus a 0.22%-0.28% spread range, centered on 0.25%. Final amounts may differ due to local taxes, banking regulations, country-specific policies, and promotions. Not all providers support every currency pair — availability varies by corridor. Always confirm on the official provider site before sending.
              </Text>
            </View>

            <Text style={[styles.sectionLabel, { color: T.mutedText }]}>
              COMPARED REMITTANCE ESTIMATES
            </Text>

            {hasAmount
              ? remitRows.map((item, index) => (
                  <RemitCard key={`${item.name}-${item.payment_method}-${item.delivery_method}`} item={item} index={index} />
                ))
              : null
            }
          </View>
        ) : null}
                {/* ════════════════════ CRYPTO TAB ═════════════ */}
        {activeTab === 'crypto' ? (
          <View>
            <View style={[styles.cryptoDisclaimerCard, { backgroundColor: T.noticeBg, borderLeftColor: WARN }]}>
              <Text style={[styles.cryptoDisclaimerText, { color: T.subText }]}>
                ℹ️ Estimates only. For fee comparison only, not a recommendation to use crypto. Always confirm fees on the exchange before transacting.
              </Text>
            </View>

            <View style={[styles.noticeCard, { backgroundColor: T.noticeBg }]}>
              <Text style={[styles.noticeText, { color: T.subText }]}>
                ⚠️ Withdrawal fees change without notice. Always confirm current fees on the exchange before transacting.
              </Text>
            </View>

            <Text style={[styles.sectionLabel, { color: T.mutedText }]}>COIN FILTER</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.coinScroller}>
              {COIN_FILTERS.map((coin) => (
                <TouchableOpacity
                  key={coin}
                  style={[
                    styles.coinPill,
                    { backgroundColor: T.pillBg, borderColor: T.border },
                    selectedCoin === coin ? {
                      backgroundColor: T.activePillBg,
                      borderColor: T.activePillBorder,
                    } : null
                  ]}
                  onPress={() => setSelectedCoin(coin)}
                >
                  <Text
                    style={[
                      styles.coinPillText,
                      { color: T.subText },
                      selectedCoin === coin ? { color: T.activePillText } : null
                    ]}
                  >
                    {coin}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.sectionLabel, { color: T.mutedText }]}>
              CRYPTO FEE ROUTES
            </Text>

            {hasAmount
              ? cryptoRows.map((item, index) => (
                  <CryptoCard key={`${item.exchange}-${item.coin}-${item.network}`} item={item} index={index} />
                ))
              : null
            }
          </View>
        ) : null}

        {/* ════════════════════ SOURCES TAB ════════════ */}
        {activeTab === 'sources' ? (
          <View>
            <Text style={[styles.sectionLabel, { color: T.mutedText }]}>DATA SOURCES</Text>

            <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}>
              <View style={[styles.settingsRow, { borderBottomColor: T.rowBorder }]}>
                <Text style={[styles.settingsLabel, { color: T.text }]}>FX rate source</Text>
                <Text style={[styles.settingsVal, { color: T.subText }]}>ExchangeRate-API · Live · Single reference</Text>
              </View>

              <View style={[styles.settingsRow, { borderBottomColor: T.rowBorder }]}>
                <Text style={[styles.settingsLabel, { color: T.text }]}>Crypto FX</Text>
                <Text style={[styles.settingsVal, { color: T.subText }]}>CoinGecko · BTC/ETH/XRP/SOL live · USDT/USDC = $1</Text>
              </View>

              <View style={[styles.settingsRow, { borderBottomColor: T.rowBorder }]}>
                <Text style={[styles.settingsLabel, { color: T.text }]}>Wise model</Text>
                <Text style={[styles.settingsVal, { color: T.subText }]}>Corridor-verified fee · mid-market rate</Text>
              </View>

              <View style={[styles.settingsRow, { borderBottomColor: T.rowBorder }]}>
                <Text style={[styles.settingsLabel, { color: T.text }]}>Revolut model</Text>
                <Text style={[styles.settingsVal, { color: T.subText }]}>Interbank-style · plan/weekend logic</Text>
              </View>

              <View style={[styles.settingsRow, { borderBottomColor: T.rowBorder }]}>
                <Text style={[styles.settingsLabel, { color: T.text }]}>Other providers</Text>
                <Text style={[styles.settingsVal, { color: T.subText }]}>Official fees first · estimated routes use 0.22%-0.28% spread</Text>
              </View>

              <View style={[styles.settingsRow, { borderBottomColor: T.rowBorder }]}>
                <Text style={[styles.settingsLabel, { color: T.text }]}>Corridor tiers</Text>
                <Text style={[styles.settingsVal, { color: T.subText }]}>G/A/B+/B/C/D/E · risk & liquidity based</Text>
              </View>

              <View style={[styles.settingsRow, { borderBottomColor: T.rowBorder }]}>
                <Text style={[styles.settingsLabel, { color: T.text }]}>Ranking method</Text>
                <Text style={[styles.settingsVal, { color: T.subText }]}>Remit midpoint · Crypto lowest cost</Text>
              </View>

              <View style={[styles.settingsRow, { borderBottomColor: T.rowBorder }]}>
                <Text style={[styles.settingsLabel, { color: T.text }]}>Fee review date</Text>
                <Text style={[styles.settingsVal, { color: T.subText }]}>{DATA_REVIEW_DATE}</Text>
              </View>

              <View style={[styles.settingsRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.settingsLabel, { color: T.text }]}>FX last updated</Text>
                <Text style={[styles.settingsVal, { color: T.subText }]}>
                  {rateTime
                    ? `${new Date(rateTime).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'America/Sao_Paulo'
                      })} BRT`
                    : 'Live'}
                </Text>
              </View>
            </View>

            <Text style={[styles.sectionLabel, { color: T.mutedText, marginTop: 8 }]}>
              DATA ACCURACY LEVELS
            </Text>

            <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}>
              <View style={[styles.legendRow, { borderBottomColor: T.rowBorder }]}>
                <View style={[styles.accuracyDot, { backgroundColor: ACCURACY.LIVE_API.color, marginTop: 5 }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.legendTitle, { color: T.text }]}>Live API</Text>
                  <Text style={[styles.legendDesc, { color: T.mutedText }]}>
                    Fetched in real time — FX rates and crypto exchange ticker prices.
                  </Text>
                </View>
              </View>

              <View style={[styles.legendRow, { borderBottomColor: T.rowBorder }]}>
                <View style={[styles.accuracyDot, { backgroundColor: ACCURACY.OFFICIAL_SNAPSHOT.color, marginTop: 5 }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.legendTitle, { color: T.text }]}>Official Snapshot</Text>
                  <Text style={[styles.legendDesc, { color: T.mutedText }]}>
                    Manually checked official provider quote for a specific corridor, amount and date.
                  </Text>
                </View>
              </View>

              <View style={[styles.legendRow, { borderBottomColor: T.rowBorder }]}>
                <View style={[styles.accuracyDot, { backgroundColor: ACCURACY.REVIEWED_QUOTE.color, marginTop: 5 }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.legendTitle, { color: T.text }]}>Reviewed Quote</Text>
                  <Text style={[styles.legendDesc, { color: T.mutedText }]}>
                    Manually reviewed provider logic. Final provider screen may still differ.
                  </Text>
                </View>
              </View>

              <View style={[styles.legendRow, { borderBottomColor: T.rowBorder }]}>
                <View style={[styles.accuracyDot, { backgroundColor: ACCURACY.RANGE_ESTIMATE.color, marginTop: 5 }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.legendTitle, { color: T.text }]}>Estimated Range</Text>
                  <Text style={[styles.legendDesc, { color: T.mutedText }]}>
                    Low-to-high range based on provider fee variance, amount band and corridor weight.
                  </Text>
                </View>
              </View>

              <View style={[styles.legendRow, { borderBottomWidth: 0 }]}>
                <View style={[styles.accuracyDot, { backgroundColor: ACCURACY.LOW_CONFIDENCE.color, marginTop: 5 }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.legendTitle, { color: T.text }]}>Low Confidence</Text>
                  <Text style={[styles.legendDesc, { color: T.mutedText }]}>
                    Reference only. Provider pricing is highly variable by payment method, delivery method, account status and promotion.
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.disclaimerCard, { backgroundColor: T.card, borderColor: T.border }]}>
              <Text style={[styles.disclaimerText, { color: T.subText }]}>
                {`TransferIQ separates live market data, official snapshots, reviewed provider logic and estimated ranges.\n\nWise is modeled as official fee plus mid-market rate. Revolut uses plan, weekend and fair-usage logic. Remitly uses public corridor fees where available. OFX has no US transfer fee, while XE may add a send fee and shows exact pricing before confirmation. Estimated routes still vary by payment method, delivery method and corridor.\n\nRankings are indicative only. Always confirm the final quote on the official provider or exchange before sending money.`}
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border, marginTop: 8 }]}>
              <TouchableOpacity
                style={[styles.settingsRow, { borderBottomColor: T.rowBorder }]}
                onPress={() => Linking.openURL('https://cute-crostata-5ee7f7.netlify.app/privacy-policy.html')}
              >
                <Text style={[styles.settingsLabel, { color: T.text }]}>Privacy Policy</Text>
                <Text style={[styles.settingsVal, { color: T.feeColor }]}>View →</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingsRow, { borderBottomWidth: 0 }]}
                onPress={() => Linking.openURL('https://cute-crostata-5ee7f7.netlify.app/disclaimer.html')}
              >
                <Text style={[styles.settingsLabel, { color: T.text }]}>Disclaimer</Text>
                <Text style={[styles.settingsVal, { color: T.feeColor }]}>View →</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* ════════════════════ SETTINGS TAB ═══════════ */}
        {activeTab === 'settings' ? (
          <View>
            <Text style={[styles.sectionLabel, { color: T.mutedText }]}>APPEARANCE</Text>

            <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}>
              <View style={[styles.settingsRow, { borderBottomWidth: 0 }]}>
                <View>
                  <Text style={[styles.settingsLabel, { color: T.text }]}>Dark Mode</Text>
                  <Text style={[styles.settingsHint, { color: T.mutedText }]}>
                    {isDark ? 'Dark theme active' : 'Light theme active'}
                  </Text>
                </View>

                <Switch
                  value={isDark}
                  onValueChange={(val) => setIsDark(val)}
                  trackColor={{ false: '#CCC', true: ACCENT + '55' }}
                  thumbColor={isDark ? ACCENT : '#888'}
                />
              </View>
            </View>

            <Text style={[styles.sectionLabel, { color: T.mutedText }]}>DEFAULTS</Text>

            <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}>
              <TouchableOpacity
                style={[styles.settingsRow, { borderBottomColor: T.rowBorder }]}
                onPress={() => setShowDefaultFromPicker(true)}
              >
                <Text style={[styles.settingsLabel, { color: T.text }]}>Default FROM currency</Text>
                <Text style={[styles.settingsVal, { color: T.feeColor }]}>{defaultFrom} →</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingsRow, { borderBottomColor: T.rowBorder }]}
                onPress={() => setShowDefaultToPicker(true)}
              >
                <Text style={[styles.settingsLabel, { color: T.text }]}>Default TO currency</Text>
                <Text style={[styles.settingsVal, { color: T.feeColor }]}>{defaultTo} →</Text>
              </TouchableOpacity>

              <View style={[styles.settingsRow, { borderBottomWidth: 0, alignItems: 'center' }]}>
                <Text style={[styles.settingsLabel, { color: T.text }]}>Default amount</Text>

                <TextInput
                  style={[
                    styles.settingsAmountInput,
                    { color: T.text, borderColor: T.border, backgroundColor: T.inputBg }
                  ]}
                  value={defaultAmount}
                  onChangeText={(v) => {
                    const cleaned = cleanNumberInput(v);
                    setDefaultAmount(cleaned);
                    setAmount(cleaned);
                  }}
                  keyboardType="decimal-pad"
                  placeholder="1000"
                  placeholderTextColor={T.mutedText}
                />
              </View>
            </View>

            <Text style={[styles.sectionLabel, { color: T.mutedText }]}>DATA</Text>

            <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}>
              <View style={[styles.settingsRow, { borderBottomColor: T.rowBorder }]}>
                <Text style={[styles.settingsLabel, { color: T.text }]}>FX rate source</Text>
                <Text style={[styles.settingsVal, { color: T.subText }]}>ExchangeRate-API</Text>
              </View>

              <View style={[styles.settingsRow, { borderBottomColor: T.rowBorder }]}>
                <Text style={[styles.settingsLabel, { color: T.text }]}>Crypto prices</Text>
                <Text style={[styles.settingsVal, { color: T.subText }]}>USDT/USDC = $1 fixed · No external feed</Text>              </View>

              <View style={[styles.settingsRow, { borderBottomColor: T.rowBorder }]}>
                <Text style={[styles.settingsLabel, { color: T.text }]}>Remittance engine</Text>
                <Text style={[styles.settingsVal, { color: T.subText }]}>Official fees first · estimated routes use 0.22%-0.28% spread</Text>
              </View>

              <View style={[styles.settingsRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.settingsLabel, { color: T.text }]}>Fee data last reviewed</Text>
                <Text style={[styles.settingsVal, { color: T.subText }]}>{DATA_REVIEW_DATE}</Text>
              </View>
            </View>

            <Text style={[styles.sectionLabel, { color: T.mutedText }]}>HELP & FAQ</Text>

            <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border, padding: 0 }]}>
              {FAQ_DATA.map((item, i) => {
                const isOpen = expandedFaq === i;
                const isLast = i === FAQ_DATA.length - 1;

                return (
                  <View
                    key={i}
                    style={[
                      styles.faqItem,
                      { borderBottomColor: T.rowBorder, borderBottomWidth: isLast ? 0 : 1 }
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.faqHeader}
                      activeOpacity={0.7}
                      onPress={() => setExpandedFaq(isOpen ? null : i)}
                    >
                      <Text style={[styles.faqQuestion, { color: T.text }]}>{item.q}</Text>
                      <Text style={[styles.faqChevron, { color: T.feeColor }]}>{isOpen ? '−' : '+'}</Text>
                    </TouchableOpacity>

                    {isOpen ? (
                      <Text style={[styles.faqAnswer, { color: T.subText }]}>{item.a}</Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
                        <Text style={[styles.sectionLabel, { color: T.mutedText }]}>LEGAL</Text>

            <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}>
              <TouchableOpacity
                style={[styles.settingsRow, { borderBottomColor: T.rowBorder }]}
                onPress={() => Linking.openURL('https://cute-crostata-5ee7f7.netlify.app/privacy-policy.html')}
              >
                <Text style={[styles.settingsLabel, { color: T.text }]}>Privacy Policy</Text>
                <Text style={[styles.settingsVal, { color: T.feeColor }]}>View →</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingsRow, { borderBottomWidth: 0 }]}
                onPress={() => Linking.openURL('https://cute-crostata-5ee7f7.netlify.app/disclaimer.html')}
              >
                <Text style={[styles.settingsLabel, { color: T.text }]}>Disclaimer</Text>
                <Text style={[styles.settingsVal, { color: T.feeColor }]}>View →</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionLabel, { color: T.mutedText }]}>ABOUT</Text>

            <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}>
              <View style={[styles.settingsRow, { borderBottomColor: T.rowBorder }]}>
                <Text style={[styles.settingsLabel, { color: T.text }]}>App version</Text>
                <Text style={[styles.settingsVal, { color: T.subText }]}>{APP_VERSION}</Text>
              </View>

              <View style={[styles.settingsRow, { borderBottomColor: T.rowBorder }]}>
                <Text style={[styles.settingsLabel, { color: T.text }]}>Platform</Text>
                <Text style={[styles.settingsVal, { color: T.subText }]}>React Native · Expo SDK 54</Text>
              </View>

              <View style={[styles.settingsRow, { borderBottomColor: T.rowBorder }]}>
                <Text style={[styles.settingsLabel, { color: T.text }]}>Core engine</Text>
                <Text style={[styles.settingsVal, { color: T.subText }]}>Pricing model v3</Text>
              </View>

              <View style={[styles.settingsRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.settingsLabel, { color: T.text }]}>Built by</Text>
                <Text style={[styles.settingsVal, { color: T.subText }]}>TransferIQ</Text>
              </View>
            </View>

            <View style={[styles.disclaimerCard, { backgroundColor: T.card, borderColor: T.border, marginTop: 4 }]}>
              <Text style={[styles.disclaimerText, { color: T.mutedText }]}>
                TransferIQ provides comparison estimates only. Final costs may vary due to fees, spreads, taxes, liquidity, network conditions, payment method, delivery method, account status, promotions and local availability. This app does not execute transfers or recommend any specific provider.
              </Text>
            </View>
          </View>
        ) : null}

      </ScrollView>

      {/* ── 하단 탭 바 ─────────────────────────────────── */}
      <View style={[styles.bottomNav, { backgroundColor: T.navBg, borderTopColor: T.navBorder }]}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.navItem, isActive ? { backgroundColor: T.feeColor + '12' } : null]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              {tab.iconText ? (
                <Text style={[styles.navIconText, { color: isActive ? '#FFD700' : '#B8960C' }]}>
                  {tab.iconText}
                </Text>
              ) : (
                <Text style={[styles.navIcon, { opacity: isActive ? 1 : 0.5 }]}>
                  {tab.icon}
                </Text>
              )}

              <Text
                style={[
                  styles.navLabel,
                  { color: isActive ? T.feeColor : T.subText, fontWeight: isActive ? '800' : '600' }
                ]}
              >
                {tab.label}
              </Text>

              {isActive ? <View style={[styles.navDot, { backgroundColor: T.feeColor }]} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

// ══════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
  },

  headerSub: {
    fontSize: 12,
    marginTop: 5,
  },

  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  liveText: {
    fontSize: 11,
    fontWeight: '700',
  },

  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
  },

  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
  },

  cardLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },

  amountInput: {
    fontSize: 38,
    fontWeight: '900',
    marginBottom: 16,
    borderBottomWidth: 1,
    paddingBottom: 8,
  },

  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  currencyBtn: {
    flex: 1,
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
  },

  currencyBtnLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },

  currencyBtnValue: {
    fontSize: 16,
    fontWeight: '800',
  },

  arrowBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },

  arrowText: {
    fontSize: 22,
    fontWeight: '900',
  },

  loadingCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  loadingText: {
    marginLeft: 10,
    fontSize: 12,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 2,
  },

  statsGrid: {
    marginBottom: 18,
  },

  statBox: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },

  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 5,
  },

  statValue: {
    fontSize: 15,
    fontWeight: '800',
  },

  noticeCard: {
    borderRadius: 12,
    padding: 13,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: WARN,
  },

  noticeText: {
    fontSize: 12,
    lineHeight: 18,
  },

  cryptoDisclaimerCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
  },

  cryptoDisclaimerText: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },

  resultCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
  },

  logoBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    overflow: 'visible',
  },

  logo: {
    width: '100%',
    height: '100%',
  },

  coinLogoBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D8DCE5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },

  coinLogoBadgeImage: {
    width: '100%',
    height: '100%',
  },

  resultMain: {
    flex: 1,
    paddingRight: 8,
  },

  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 3,
  },

  resultName: {
    fontSize: 13,
    fontWeight: '900',
  },

  bestBadge: {
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    borderWidth: 1,
  },

  bestBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },

  resultMeta: {
    fontSize: 12,
    marginBottom: 4,
  },

  resultSub: {
    fontSize: 11,
    marginTop: 1,
  },

  accuracyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 2,
  },

  accuracyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  accuracyText: {
    fontSize: 10,
  },

  legendRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },

  legendTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },

  legendDesc: {
    fontSize: 11,
    lineHeight: 16,
  },

  faqItem: {
    paddingHorizontal: 16,
  },

  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },

  faqQuestion: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    paddingRight: 12,
    lineHeight: 18,
  },

  faqChevron: {
    fontSize: 20,
    fontWeight: '800',
    width: 20,
    textAlign: 'center',
  },

  faqAnswer: {
    fontSize: 12,
    lineHeight: 18,
    paddingBottom: 15,
    paddingRight: 28,
  },

  quoteBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },

  quoteBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },

  resultRight: {
    alignItems: 'flex-end',
    maxWidth: 132,
  },

  received: {
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'right',
  },

  resultConverted: {
    fontSize: 10,
    marginTop: 3,
    textAlign: 'right',
  },

  feeDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#2A2A2A22',
    marginVertical: 6,
  },

  feeCostLabel: {
    fontSize: 10,
    textAlign: 'right',
    marginBottom: 1,
  },

  feeText: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
  },

  coinScroller: {
    marginBottom: 16,
  },

  coinPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
  },

  coinPillText: {
    fontSize: 12,
    fontWeight: '800',
  },

  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: 16,
    paddingTop: 6,
  },

  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    minHeight: 64,
    borderRadius: 10,
    marginHorizontal: 2,
  },

  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },

  navIconText: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },

  navLabel: {
    fontSize: 9,
    fontWeight: '600',
  },

  navDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'flex-end',
  },

  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 24,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
  },

  modalClose: {
    fontSize: 24,
  },

  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },

  currencyFlag: {
    fontSize: 26,
    marginRight: 14,
  },

  currencyLogoBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    overflow: 'hidden',
  },

  currencyLogo: {
    width: '100%',
    height: '100%',
  },

  currencyCode: {
    fontSize: 15,
    fontWeight: '900',
  },

  currencyName: {
    fontSize: 12,
    marginTop: 2,
  },

  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 14,
  },

  settingsLabel: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },

  settingsVal: {
    fontSize: 12,
    textAlign: 'right',
    flex: 1,
  },

  settingsHint: {
    fontSize: 11,
    marginTop: 2,
  },

  settingsAmountInput: {
    fontSize: 14,
    fontWeight: '700',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 80,
    textAlign: 'right',
  },

  disclaimerCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 8,
  },

  disclaimerText: {
    fontSize: 12,
    lineHeight: 18,
  },
});
