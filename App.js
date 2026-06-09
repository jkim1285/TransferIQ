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

const DATA_REVIEW_DATE = '2026-06-08';

const FX_ENDPOINT = 'https://open.er-api.com/v6/latest/USD';

// USDT/USDC는 항상 $1 — 별도 가격 조회 불필요
const STABLE_COINS = ['USDT', 'USDC'];

// 정확도 등급
const ACCURACY = {
  LIVE_API:       { label: 'Live API',        color: '#00FF88' },
  LIVE_QUOTE:     { label: 'Live Quote',      color: '#00FF88' },
  OFFICIAL_SNAPSHOT: { label: 'Official Snapshot', color: '#00FF88' },
  REVIEWED:       { label: 'Reviewed',        color: '#FFB020' },
  REVIEWED_QUOTE: { label: 'Reviewed Quote',  color: '#FFB020' },
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
];

// ── Fallback 송금사 데이터 ─────────────────────────────────
// pricing_model 기준으로 업체별 계산법을 분리한다.
// official_rate는 특정 corridor 스냅샷이 있을 때만 우선 사용된다.
const FALLBACK_REMIT = [
  {
    name: 'Wise',
    provider_brand: 'Wise',
    type: 'Bank transfer',
    pricing_model: PRICING_MODELS.WISE_FEE_THEN_MIDMARKET,
    fixed_fee_usd: 1.69,
    percent_fee: 0.0050,
    fx_markup_min: 0.000,
    fx_markup_mid: 0.000,
    fx_markup_max: 0.000,
    fee_variance: 0.02,
    payment_method: 'ach',
    delivery_method: 'bank',
    speed: 'Seconds–2 days',
    availability: 'Fee deducted first, then mid-market rate',
    url: 'https://wise.com/invite/arhc/joogonk',
    accuracy_level: 'REVIEWED_QUOTE',
    quote_type: 'reviewed_model',
    confidence_level: 'HIGH',
    fee_note: 'ACH · fee first · mid-market rate',
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
    percent_fee: 0.000,
    fx_markup_min: 0.005,
    fx_markup_mid: 0.012,
    fx_markup_max: 0.025,
    fee_variance: 0.20,
    payment_method: 'bank',
    delivery_method: 'bank',
    speed: '3–5 business days',
    availability: 'Usually cheaper, slower route',
    url: 'https://www.remitly.com',
    accuracy_level: 'RANGE_ESTIMATE',
    quote_type: 'estimated_range',
    confidence_level: 'MEDIUM',
    fee_note: 'Economy range · promo excluded',
  },
  {
    name: 'Remitly Express',
    provider_brand: 'Remitly',
    type: 'Card / fast transfer',
    pricing_model: PRICING_MODELS.MARKUP_IN_RATE,
    fixed_fee_usd: 3.99,
    percent_fee: 0.000,
    fx_markup_min: 0.015,
    fx_markup_mid: 0.025,
    fx_markup_max: 0.040,
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
    percent_fee: 0.000,
    fx_markup_min: 0.004,
    fx_markup_mid: 0.008,
    fx_markup_max: 0.015,
    fee_variance: 0.10,
    payment_method: 'bank',
    delivery_method: 'bank',
    speed: '1–3 days',
    availability: 'Margin usually improves with larger amounts',
    url: 'https://www.ofx.com',
    accuracy_level: 'RANGE_ESTIMATE',
    quote_type: 'estimated_range',
    confidence_level: 'MEDIUM',
    fee_note: 'Markup range · login quote required',
  },
  {
    name: 'XE Money Transfer',
    provider_brand: 'XE',
    type: 'Bank transfer',
    pricing_model: PRICING_MODELS.MARKUP_IN_RATE,
    fixed_fee_usd: 0,
    percent_fee: 0.000,
    fx_markup_min: 0.005,
    fx_markup_mid: 0.012,
    fx_markup_max: 0.020,
    fee_variance: 0.12,
    payment_method: 'bank',
    delivery_method: 'bank',
    speed: '1–3 days',
    availability: 'Send-money rate differs from XE converter',
    url: 'https://www.xe.com/send-money',
    accuracy_level: 'RANGE_ESTIMATE',
    quote_type: 'estimated_range',
    confidence_level: 'MEDIUM',
    fee_note: 'Transfer-rate estimate',
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

const APP_VERSION = '1.1.0';

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
  const decimals = decimalsOverride ?? meta?.decimals ?? 2;
  if (!Number.isFinite(value)) return `— ${currency}`;
  return `${value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} ${currency}`;
};

const formatPercent = (value) => `${((Number(value) || 0) * 100).toFixed(2)}%`;

const clampPositive = (value) => Math.max(Number(value) || 0, 0);

const clampRate = (value) => Math.min(Math.max(Number(value) || 0, 0), 0.25);

const cleanNumberInput = (value) => {
  const cleaned = String(value).replace(',', '.').replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) return `${parts[0]}.${parts.slice(1).join('')}`;
  return cleaned;
};

const formatMoneyRange = (lowValue, highValue, currency) => {
  const low = Math.min(lowValue, highValue);
  const high = Math.max(lowValue, highValue);
  if (!Number.isFinite(low) || !Number.isFinite(high)) return `— ${currency}`;
  if (Math.abs(high - low) < 0.005) return formatMoney(low, currency);
  return `${formatMoney(low, currency)} – ${formatMoney(high, currency)}`;
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

const calculateWiseQuote = ({ item, amountNum, midRate, fromCurrency, usdToCurrency }) => {
  const fee = getFeeFrom(item, amountNum, fromCurrency, usdToCurrency);
  const providerRate = getProviderRate({ item, midRate });

  const receivedMid  = Math.max(amountNum - fee.mid, 0) * providerRate.rate;
  const receivedLow  = Math.max(amountNum - fee.max, 0) * providerRate.rate;
  const receivedHigh = Math.max(amountNum - fee.min, 0) * providerRate.rate;

  return {
    pricingModel: PRICING_MODELS.WISE_FEE_THEN_MIDMARKET,
    receivedLow,
    receivedMid,
    receivedHigh,
    serviceFeeMin: fee.min,
    serviceFeeFrom: fee.mid,
    serviceFeeMax: fee.max,
    totalCostFrom: fee.mid,
    totalCostRate: amountNum > 0 ? fee.mid / amountNum : 0,
    effectiveRate: providerRate.rate,
    markupMin: 0,
    markupMid: 0,
    markupMax: 0,
    rateSource: providerRate.rateSource,
    rateLabel: providerRate.rateLabel,
    modelNote: 'Fee deducted first, then live mid-market rate',
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

const calculateMarkupQuote = ({ item, amountNum, midRate, fromCurrency, usdToCurrency }) => {
  const fee = getFeeFrom(item, amountNum, fromCurrency, usdToCurrency);
  const markup = getMarkupProfile(item, amountNum);

  const receivedHigh = Math.max(amountNum - fee.min, 0) * midRate * (1 - markup.min);
  const receivedMid = Math.max(amountNum - fee.mid, 0) * midRate * (1 - markup.mid);
  const receivedLow = Math.max(amountNum - fee.max, 0) * midRate * (1 - markup.max);

  const totalCostFrom = fee.mid + (amountNum * markup.mid);

  return {
    pricingModel: PRICING_MODELS.MARKUP_IN_RATE,
    receivedLow,
    receivedMid,
    receivedHigh,
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
    modelNote: 'Customer rate = mid-market rate minus provider markup',
  };
};

const calculateComplexRangeQuote = ({ item, amountNum, midRate, fromCurrency, usdToCurrency }) => {
  const base = calculateMarkupQuote({ item, amountNum, midRate, fromCurrency, usdToCurrency });

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

const calculateRemitQuote = ({ item, amountNum, midRate, fromCurrency, toCurrency, isWeekend, usdToCurrency }) => {
  const model = item.pricing_model || PRICING_MODELS.MARKUP_IN_RATE;

  if (model === PRICING_MODELS.WISE_FEE_THEN_MIDMARKET) {
    return calculateWiseQuote({ item, amountNum, midRate, fromCurrency, usdToCurrency });
  }

  if (model === PRICING_MODELS.REVOLUT_INTERBANK_WITH_PLAN) {
    return calculateRevolutQuote({ item, amountNum, midRate, isWeekend, fromCurrency, usdToCurrency });
  }

  if (model === PRICING_MODELS.COMPLEX_RANGE) {
    return calculateComplexRangeQuote({ item, amountNum, midRate, fromCurrency, usdToCurrency });
  }

  return calculateMarkupQuote({ item, amountNum, midRate, fromCurrency, usdToCurrency });
};

// ── 로고 컴포넌트 ─────────────────────────────────────────
const LogoIcon = ({ source, logoBg }) => (
  <View style={[styles.logoBox, { backgroundColor: logoBg || '#FFFFFF' }]}>
    <Image source={source} style={styles.logo} resizeMode="contain" />
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
              <Text style={styles.currencyFlag}>{item.flag}</Text>
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
  const [loadingRates, setLoadingRates] = useState(true);

  // Supabase 데이터
  const [remitProfiles, setRemitProfiles] = useState(FALLBACK_REMIT);
  const [cryptoRoutes,  setCryptoRoutes]  = useState(FALLBACK_CRYPTO);
  const [loadingDB,     setLoadingDB]     = useState(true);

  const [amount,       setAmount]       = useState('1000');
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
  const [defaultAmount, setDefaultAmount] = useState('1000');

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

  const amountNum = parseFloat(amount) || 0;

  // ── 주말 여부 (UTC 기준) ────────────────────────────────
  const isWeekend = [0, 6].includes(new Date().getUTCDay());

  const toUSD = (code, value = 1) => {
    // USDT/USDC는 항상 $1
    if (STABLE_COINS.includes(code)) return value;
    if (!rates[code]) return 0;
    return value / rates[code];
  };

  const fromUSD = (code, usdValue = 1) => {
    // USDT/USDC는 항상 $1
    if (STABLE_COINS.includes(code)) return usdValue;
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

  return FALLBACK_REMIT.map((item) => {
    const quote = calculateRemitQuote({
      item,
      amountNum,
      midRate: commonRate,
      fromCurrency,
      toCurrency,
      isWeekend,
      usdToCurrency,
    });

    const logo = getProviderLogo(item);
    const accuracyLevel = getRemitAccuracyKey(item);
    const feeNote = item.fee_note || quote.modelNote || 'estimate';
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
  }).sort((a, b) => b.receivedMid - a.receivedMid);
}, [amountNum, fromCurrency, toCurrency, rates, isWeekend]);

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

    return {
      ...item,
      withdrawUsd,
      tradingUsd,
      totalUsd,
      totalFrom,
      received,
      logo,
      priceSource: 'LIVE_API',
      benchmarkRate: commonRate,
    };
  }).sort((a, b) => a.totalFrom - b.totalFrom);
}, [selectedCoin, amountNum, fromCurrency, toCurrency, rates, cryptoRoutes]);

  // ── 파생 변수 ─────────────────────────────────────────
  const isLoading = loadingRates || loadingDB;
  const bestRemit  = remitRows[0] || null;
  const bestCrypto = cryptoRows[0] || null;

  // ── StatBox ──────────────────────────────────────────
  const StatBox = ({ label, value, tone }) => (
    <View style={[styles.statBox, { backgroundColor: T.card, borderColor: T.border }]}>
      <Text style={[styles.statLabel, { color: T.subText }]}>{label}</Text>
      <Text
        style={[
          styles.statValue,
          { color: T.text },
          tone === 'good' && { color: T.amountColor },
          tone === 'warn' && { color: WARN },
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

    return (
      <View style={[styles.resultCard, { backgroundColor: T.card, borderColor: T.border }]}>
        <LogoIcon source={item.logo} logoBg={T.logoBg} />

        <View style={styles.resultMain}>
          <View style={styles.rowCenter}>
            <Text style={[styles.resultName, { color: T.text }]}>{item.name}</Text>
            {index === 0 && (
              <View style={[styles.bestBadge, { backgroundColor: T.badgeBg, borderColor: T.badgeBorder }]}>
                <Text style={[styles.bestBadgeText, { color: T.badgeText }]}>TOP ESTIMATE</Text>
              </View>
            )}
          </View>

          <Text style={[styles.resultMeta, { color: T.subText }]}>
            {item.paymentLabel} → {item.deliveryLabel} · {item.speed}
          </Text>

          <Text style={[styles.resultSub, { color: T.mutedText }]}>
            Model: {item.pricingModel?.replaceAll('_', ' ') || 'Provider model'}
          </Text>

          <Text style={[styles.resultSub, { color: T.mutedText }]}>
            {item.rateLabel || 'Provider rate model'}{item.weekendNote || ''}
          </Text>

          <Text style={[styles.resultSub, { color: T.mutedText }]}>
            Fee around {formatMoney(item.serviceFeeFrom, fromCurrency)} · Spread {formatPercent(item.markupMid || 0)}
          </Text>

          <Text style={[styles.resultSub, { color: T.mutedText }]}>
            Range basis: {formatPercent(item.markupMin || 0)}–{formatPercent(item.markupMax || 0)} spread
          </Text>

          <Text style={[styles.resultSub, { color: T.mutedText }]}>{item.availability}</Text>

          <View style={styles.accuracyRow}>
            <View style={[styles.accuracyDot, { backgroundColor: acc.color }]} />
            <Text style={[styles.accuracyText, { color: T.mutedText }]}>
              {acc.label} · {item.feeNote}
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
            {formatMoneyRange(item.receivedLow, item.receivedHigh, toCurrency)}
          </Text>

          <Text style={[styles.resultConverted, { color: T.mutedText }]}>
            {isRange ? 'estimated receive range' : 'estimated recipient gets'}
          </Text>

          <Text style={[styles.resultConverted, { color: T.mutedText }]}>
            midpoint {formatMoney(item.receivedMid, toCurrency)}
          </Text>

          <View style={styles.feeDivider} />

          <Text style={[styles.feeCostLabel, { color: T.mutedText }]}>Est. total cost</Text>
          <Text style={[styles.feeText, { color: T.feeColor }]}>
            {formatMoney(item.totalCostFrom, fromCurrency)}
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
        <LogoIcon source={item.logo} logoBg={T.logoBg} />

        <View style={styles.resultMain}>
          <View style={styles.rowCenter}>
            <Text style={[styles.resultName, { color: T.text }]}>
              {item.coin === item.network
                ? `${item.exchange} · ${item.coin} Network`
                : `${item.exchange} · ${item.coin} · ${item.network}`}
            </Text>
          </View>

          {index === 0 && (
            <View style={[styles.bestBadge, { marginBottom: 4, backgroundColor: T.badgeBg, borderColor: T.badgeBorder }]}>
              <Text style={[styles.bestBadgeText, { color: T.badgeText }]}>LOWEST FEE</Text>
            </View>
          )}

          <Text style={[styles.resultMeta, { color: T.subText }]}>
            {item.network} · Trading fee {formatPercent(item.trading_fee)}
          </Text>

          <Text style={[styles.resultSub, { color: T.mutedText }]}>
            Withdraw fee: {item.withdraw_fee} {item.coin} ≈ ${item.withdrawUsd.toFixed(2)}
          </Text>

          <View style={styles.accuracyRow}>
            <View style={[styles.accuracyDot, { backgroundColor: acc.color }]} />
            <Text style={[styles.accuracyText, { color: T.mutedText }]}>
              {acc.label} · {item.exchange} ticker
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
            {formatMoney(item.received, toCurrency)}
          </Text>

          <Text style={[styles.resultConverted, { color: T.mutedText }]}>est. after fees</Text>

          <View style={styles.feeDivider} />

          <Text style={[styles.feeCostLabel, { color: T.mutedText }]}>Est. cost</Text>
          <Text style={[styles.feeText, { color: T.feeColor }]}>
            {formatMoney(item.totalFrom, fromCurrency)}
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
                {fromMeta?.flag}  {fromCurrency}{fromMeta?.isCrypto ? ' 🔗' : ''}
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
                {toMeta?.flag}  {toCurrency}{toMeta?.isCrypto ? ' 🔗' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Amount 0이면 안내문 표시 */}
        {!hasAmount && (
          <View style={[styles.noticeCard, { backgroundColor: T.noticeBg }]}>
            <Text style={[styles.noticeText, { color: T.subText }]}>
              💡 Enter an amount above to compare fees and rates.
            </Text>
          </View>
        )}

        {isLoading && (
          <View style={[styles.loadingCard, { backgroundColor: T.card }]}>
            <ActivityIndicator color={ACCENT} />
            <Text style={[styles.loadingText, { color: T.subText }]}>
              Updating market data...
            </Text>
          </View>
        )}

        {/* ════════════════════ COMPARE TAB ════════════ */}
        {activeTab === 'compare' && hasAmount && (
          <View>
            <View style={[styles.noticeCard, { backgroundColor: T.noticeBg }]}>
              <Text style={[styles.noticeText, { color: T.subText }]}>
                ⚠️ Estimates only. TransferIQ uses ExchangeRate-API live mid-market rate as the single reference benchmark. Each provider's fees and spreads are deducted from that rate. Final amounts may differ due to local taxes, banking regulations, country-specific policies, and promotions. Not all providers support every currency pair — availability varies by corridor. Always confirm on the official provider site before sending.
              </Text>
            </View>

            <Text style={[styles.sectionLabel, { color: T.mutedText }]}>BEST SUMMARY</Text>

            <View style={styles.statsGrid}>
              <StatBox
                label="Top remittance estimate"
                value={bestRemit ? `${bestRemit.name} · ${formatMoney(bestRemit.receivedMid, toCurrency)}` : '—'}
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
        )}

        {/* ════════════════════ REMIT TAB ══════════════ */}
        {activeTab === 'remit' && (
          <View>
            <View style={[styles.noticeCard, { backgroundColor: T.noticeBg }]}>
              <Text style={[styles.noticeText, { color: T.subText }]}>
                ⚠️ Estimates only. TransferIQ uses ExchangeRate-API live mid-market rate as the single reference benchmark. Each provider's fees and spreads are deducted from that rate. Final amounts may differ due to local taxes, banking regulations, country-specific policies, and promotions. Not all providers support every currency pair — availability varies by corridor. Always confirm on the official provider site before sending.
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
        )}
                {/* ════════════════════ CRYPTO TAB ═════════════ */}
        {activeTab === 'crypto' && (
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
                    selectedCoin === coin && {
                      backgroundColor: T.activePillBg,
                      borderColor: T.activePillBorder,
                    }
                  ]}
                  onPress={() => setSelectedCoin(coin)}
                >
                  <Text
                    style={[
                      styles.coinPillText,
                      { color: T.subText },
                      selectedCoin === coin && { color: T.activePillText }
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
        )}

        {/* ════════════════════ SOURCES TAB ════════════ */}
        {activeTab === 'sources' && (
          <View>
            <Text style={[styles.sectionLabel, { color: T.mutedText }]}>DATA SOURCES</Text>

            <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}>
              <View style={[styles.settingsRow, { borderBottomColor: T.rowBorder }]}>
                <Text style={[styles.settingsLabel, { color: T.text }]}>FX rate source</Text>
                <Text style={[styles.settingsVal, { color: T.subText }]}>ExchangeRate-API · Live · Single reference</Text>
              </View>

              <View style={[styles.settingsRow, { borderBottomColor: T.rowBorder }]}>
                <Text style={[styles.settingsLabel, { color: T.text }]}>Crypto price</Text>
                <Text style={[styles.settingsVal, { color: T.subText }]}>USDT/USDC = $1 fixed · No external price feed</Text>
              </View>

              <View style={[styles.settingsRow, { borderBottomColor: T.rowBorder }]}>
                <Text style={[styles.settingsLabel, { color: T.text }]}>Remittance engine</Text>
                <Text style={[styles.settingsVal, { color: T.subText }]}>Provider-specific pricing models</Text>
              </View>

              <View style={[styles.settingsRow, { borderBottomColor: T.rowBorder }]}>
                <Text style={[styles.settingsLabel, { color: T.text }]}>Wise model</Text>
                <Text style={[styles.settingsVal, { color: T.subText }]}>Fee first · official snapshot if matched</Text>
              </View>

              <View style={[styles.settingsRow, { borderBottomColor: T.rowBorder }]}>
                <Text style={[styles.settingsLabel, { color: T.text }]}>Revolut model</Text>
                <Text style={[styles.settingsVal, { color: T.subText }]}>Interbank-style · plan/weekend logic</Text>
              </View>

              <View style={[styles.settingsRow, { borderBottomColor: T.rowBorder }]}>
                <Text style={[styles.settingsLabel, { color: T.text }]}>Markup providers</Text>
                <Text style={[styles.settingsVal, { color: T.subText }]}>OFX · XE · Instarem · Remitly</Text>
              </View>

              <View style={[styles.settingsRow, { borderBottomColor: T.rowBorder }]}>
                <Text style={[styles.settingsLabel, { color: T.text }]}>Complex providers</Text>
                <Text style={[styles.settingsVal, { color: T.subText }]}>WU · MoneyGram · WorldRemit · Xoom · PayPal</Text>
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
                    ? new Date(rateTime).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'America/Sao_Paulo'
                      }) + ' BRT'
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
                    Low-to-high range based on provider spread, fee variance and known pricing model.
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
                TransferIQ separates live market data, official snapshots, reviewed provider logic and estimated ranges.{'\n\n'}
                Wise is modeled as fee-then-rate. Revolut is modeled with plan/weekend logic. Providers such as OFX, XE, Instarem and Remitly use markup-in-rate logic. Providers such as Western Union, MoneyGram, WorldRemit, Xoom and PayPal use wider complex ranges because payment method and delivery method can strongly change the final quote.{'\n\n'}
                Rankings are indicative only. Always confirm the final quote on the official provider or exchange before sending money.
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
        )}

        {/* ════════════════════ SETTINGS TAB ═══════════ */}
        {activeTab === 'settings' && (
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
                <Text style={[styles.settingsVal, { color: T.subText }]}>USDT/USDC = $1 fixed · No external feed</Text>
              </View>

              <View style={[styles.settingsRow, { borderBottomColor: T.rowBorder }]}>
                <Text style={[styles.settingsLabel, { color: T.text }]}>Remittance engine</Text>
                <Text style={[styles.settingsVal, { color: T.subText }]}>Provider-specific model</Text>
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

                    {isOpen && (
                      <Text style={[styles.faqAnswer, { color: T.subText }]}>{item.a}</Text>
                    )}
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
                <Text style={[styles.settingsVal, { color: T.subText }]}>Pricing model v2</Text>
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
        )}

      </ScrollView>

      {/* ── 하단 탭 바 ─────────────────────────────────── */}
      <View style={[styles.bottomNav, { backgroundColor: T.navBg, borderTopColor: T.navBorder }]}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.navItem, isActive && { backgroundColor: T.feeColor + '12' }]}
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

              {isActive && <View style={[styles.navDot, { backgroundColor: T.feeColor }]} />}
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
    paddingTop: 18,
    paddingBottom: 18,
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
    marginTop: 3,
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
    overflow: 'hidden',
  },

  logo: {
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