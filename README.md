# TransferIQ 💸

**Global remittance & crypto fee comparator**  
Compare transfer costs across 11 remittance providers and crypto routes — powered by a single live mid-market FX benchmark.

---

## 📱 About

TransferIQ helps diaspora users find the cheapest way to send money internationally by comparing:
- **11 remittance providers** — Wise, Revolut, Remitly, OFX, XE, Instarem, WorldRemit, MoneyGram, Western Union, Xoom, PayPal
- **Crypto routes** — USDT/USDC via Binance, Bybit, OKX (TRC20, BEP20, ERC20)

All providers are benchmarked against a **single ExchangeRate-API live mid-market rate** — so comparisons are fair and consistent.

---

## ⚙️ Tech Stack

- React Native + Expo SDK 54
- Supabase (fee data, click tracking)
- ExchangeRate-API (live FX benchmark)

---

## 🧮 How It Works

| Provider Group | Model |
|---|---|
| Wise | Fee deducted first, then mid-market rate |
| Revolut | Interbank rate + weekend markup by plan |
| OFX, XE, Instarem, Remitly | Mid-market minus FX markup |
| WU, MoneyGram, WorldRemit, Xoom, PayPal | Complex range model |
| Crypto (USDT/USDC) | Withdraw fee + trading fee deducted from mid-market |

---

## 📊 Data Sources

- FX rate: ExchangeRate-API (live)
- Crypto fees: Reviewed 2026-06-08
- Remittance fees: Manually reviewed per provider

---

## 📸 Screenshots

![Main](screenshots/screenshot_main.jpg)
![Compare](screenshots/screenshot_compare.jpg)
![Remit](screenshots/screenshot_remit.jpg)
![Crypto](screenshots/screenshot_crypto.jpg)

---

## ⚠️ Disclaimer

Estimates only. Final amounts may differ due to local taxes, banking regulations, and country-specific policies. Not all providers support every currency pair. Always confirm on the official provider site before sending.

---

*Built by Douglas Kim — Crypto/Fintech Operations & Product*
