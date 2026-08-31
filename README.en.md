<!-- 本文件与 README.md 手工同步（README.md 很少变动，人工同步成本可接受）。
     唯一的例外是下面的 exchange-list 块：由 `make sync` 从 data/exchanges/*.yml 生成，
     中英两版各写一次，不要手改。 -->
# exchange-atlas 全球交易所图鉴

A unified framework for recording the trading mechanics and market rules of the world's major exchanges — price limits, intraday reversal (T+N), settlement cycles, circuit breakers, listing and delisting rules and more — with every fact dated and sourced, traceable and comparable across markets.

**Site:** https://hrlovefun.github.io/exchange-atlas/

[English](README.en.md) · [中文](README.md)

## What this is

- **Market Mechanics Profile**: pick a market and see how its trading day works on a single screen — sessions, call auctions, price-limit walls, circuit-breaker triggers, volatility corridors, matching model, order types, tick size, settlement cycle, and taxes and fees — plotted on a plane of *intraday time × % change from previous close*. Every element opens to show the source text it came from.
- **A comparison matrix**: rows are exchanges, columns are switchable dimension groups (trading mechanism / listing & delisting / clearing & settlement / regulatory environment / costs & taxes), so institutional differences read across at a glance.
- **One profile per exchange**: recorded systematically across eleven chapters (basic information, regulation, products, trading mechanism, listing & delisting, indices, clearing & settlement, participants, technical infrastructure, costs & taxes, risks).
- Every fact carries a source link, a verbatim quote, a verification date and a confidence level — not "reportedly", but "this document, this clause, says this".

## What this does not cover

Only institutions that are **written into exchange / clearing-house rules, or published as official data** are included — trading sessions, matching methods, order types and priority rules, tick size, price limits and circuit breakers, transparency arrangements, margin, erroneous-trade rules, short-selling restrictions, listing and settlement rules — all of which can be found in rulebooks, announcements and official data services.

Elements that are **consequences of enforcement** are out of scope: real execution risk (whether an order is internalised by a local broker, whether a mechanism favours local participants), actual market impact and absorbable volume, the true sources of liquidity and spread dynamics, and price-clustering behaviour in limit orders. These can only be accumulated through small live testing and sustained observation; this project does not fill them in from third-party inference. (Fields such as `risks.liquidity_risk_note` therefore sit structurally at low/medium confidence.)

## Coverage

<!-- BEGIN:GENERATED exchange-list -->
| ID | Name | Region |
|---|---|---|
| `au-asx` | Australian Securities Exchange (ASX) | APAC |
| `br-b3` | B3 S.A. – Brasil, Bolsa, Balcão (B3) | Americas |
| `ca-tsx` | Toronto Stock Exchange (TSX) | Americas |
| `ch-six` | SIX Swiss Exchange | Europe |
| `cn-sse` | Shanghai Stock Exchange (SSE) | APAC |
| `cn-szse` | Shenzhen Stock Exchange (SZSE) | APAC |
| `de-eurex` | Eurex | Europe |
| `de-xetra` | Deutsche Börse Xetra | Europe |
| `fr-euronext` | Euronext N.V. | Europe |
| `hk-hkex` | Hong Kong Exchanges and Clearing Limited (HKEX) | APAC |
| `in-nse` | National Stock Exchange of India (NSE) | APAC |
| `jp-jpx` | Tokyo Stock Exchange (TSE) | APAC |
| `kr-krx` | Korea Exchange (KRX) | APAC |
| `sa-tadawul` | Saudi Exchange (Tadawul) | MENA & Africa |
| `sg-sgx` | Singapore Exchange Limited (SGX) | APAC |
| `tw-twse` | Taiwan Stock Exchange (TWSE) | APAC |
| `uk-lse` | London Stock Exchange (LSE) | Europe |
| `us-nasdaq` | The Nasdaq Stock Market (Nasdaq) | Americas |
| `us-nyse` | New York Stock Exchange (NYSE) | Americas |
| `za-jse` | JSE Limited (Johannesburg Stock Exchange) | MENA & Africa |
<!-- END:GENERATED exchange-list -->

## Disclaimer

An independent secondary research compilation. Rules are as officially published by each exchange; this is not investment advice. Rules change at different speeds — verify the current position against the `verified` date and the source links.

## Licence

Code under the MIT License; data under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (please cite the source and the verification date).

## Contributing

This repository is public and free to read and cite. Contributions are not actively solicited and there are no issue/PR templates. If you find an error, please open an issue.

## For myself / AI collaborators

How this project operates (how to add an exchange, how the data structure is designed, why it is the way it is) is recorded in `CLAUDE.md` and the `PROJECT/` directory, and is not repeated here.
