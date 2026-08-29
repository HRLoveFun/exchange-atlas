# v1.1 Category B 抽检报告（quote vs 落盘来源）

> **已归档**：v1.1 于 2026-08-27 收口；尾巴收口（英文回填 #45 清零、61 个 CACHE_MISS 归零、verify_quotes 走 expand）于 2026-08-30 完成，见 [ADR-034]。本报告保留作 v1.1 抽检记录，不再更新。

自动抽检：每家从**全部引用来源均已落盘 `.cache/<id>/`** 的 `confidence: high` 字段中随机抽取 10 个，将其 `quote` 与来源逐字比对（复用 `tools/verify_quotes.py` 的同一套逻辑：剥离 HTML 标签 + PDF/Office 文本提取，PDF 无伴随文本时现场 pdftotext）。

**汇总**：可确定性核验字段共抽检 200 个，通过 200，失败 0；通过率 = 100.0%（>=95% 阈值 ✅）。其余 high 字段因引用来源未落盘（需先 `fetch_sources` 或人工提供）属"不可自动核验"，按 CLAUDE.md §四 留人工抽检，不计入本自动通过率。

| 交易所 | high总数 | 全缓存可核验数 | 抽检 | 通过 | 失败 |
|---|---|---|---|---|---|
| au-asx | 56 | 56 | 10 | 10 | 0 |
| br-b3 | 77 | 63 | 10 | 10 | 0 |
| ca-tsx | 47 | 47 | 10 | 10 | 0 |
| ch-six | 49 | 45 | 10 | 10 | 0 |
| cn-sse | 14 | 14 | 10 | 10 | 0 |
| cn-szse | 59 | 53 | 10 | 10 | 0 |
| de-eurex | 28 | 20 | 10 | 10 | 0 |
| de-xetra | 51 | 45 | 10 | 10 | 0 |
| fr-euronext | 61 | 60 | 10 | 10 | 0 |
| hk-hkex | 50 | 49 | 10 | 10 | 0 |
| in-nse | 49 | 48 | 10 | 10 | 0 |
| jp-jpx | 44 | 42 | 10 | 10 | 0 |
| kr-krx | 58 | 55 | 10 | 10 | 0 |
| sa-tadawul | 60 | 58 | 10 | 10 | 0 |
| sg-sgx | 49 | 39 | 10 | 10 | 0 |
| tw-twse | 48 | 48 | 10 | 10 | 0 |
| uk-lse | 52 | 52 | 10 | 10 | 0 |
| us-nasdaq | 39 | 39 | 10 | 10 | 0 |
| us-nyse | 36 | 31 | 10 | 10 | 0 |
| za-jse | 63 | 62 | 10 | 10 | 0 |

## 逐家抽检明细

### au-asx（high 56，全缓存可核验 56，抽检 10，通过 10）

| 字段 | 状态 |
|---|---|
| `market_structure.derivatives.volatility_interruption` | OK |
| `clearing.derivatives.last_trading_day_rule` | OK |
| `regulation.disclosure_requirements` | OK |
| `market_structure.derivatives.market_maker_scheme` | OK |
| `listing.suspension_resumption` | OK |
| `market_structure.volatility_interruption` | OK |
| `market_structure.derivatives.matching_principle` | OK |
| `overview.founded_year` | OK |
| `market_structure.derivatives.circuit_breaker` | OK |
| `clearing.settlement_cycle` | OK |

### br-b3（high 77，全缓存可核验 63，抽检 10，通过 10）

| 字段 | 状态 |
|---|---|
| `market_structure.derivatives.trading_sessions.continuous_pm` | OK |
| `overview.organization_form` | OK |
| `market_structure.derivatives.trading_sessions.after_market` | OK |
| `market_structure.derivatives.price_limits.type` | OK |
| `listing.delisting_conditions` | OK |
| `market_structure.price_limits.type` | OK |
| `market_structure.closing_mechanism` | OK |
| `market_structure.odd_lot_handling` | OK |
| `participants.foreign_access_channel` | OK |
| `costs.capital_gains_tax` | OK |

### ca-tsx（high 47，全缓存可核验 47，抽检 10，通过 10）

| 字段 | 状态 |
|---|---|
| `infrastructure.data_latency` | OK |
| `market_structure.matching_principle` | OK |
| `overview.trading_currency` | OK |
| `clearing.ccp_name` | OK |
| `overview.annual_turnover_usd_bn` | OK |
| `listing.transfer_between_boards` | OK |
| `market_structure.opening_mechanism` | OK |
| `market_structure.connect_schemes` | OK |
| `listing.delisting_transition_period` | OK |
| `participants.investor_structure` | OK |

### ch-six（high 49，全缓存可核验 45，抽检 10，通过 10）

| 字段 | 状态 |
|---|---|
| `listing.delisting_conditions` | OK |
| `overview.annual_turnover_usd_bn` | OK |
| `market_structure.short_selling` | OK |
| `costs.stamp_duty` | OK |
| `listing.delisting_transition_period` | OK |
| `market_structure.volatility_interruption` | OK |
| `market_structure.closing_mechanism` | OK |
| `overview.founded_year` | OK |
| `market_structure.market_maker_scheme` | OK |
| `market_structure.matching_principle` | OK |

### cn-sse（high 14，全缓存可核验 14，抽检 10，通过 10）

| 字段 | 状态 |
|---|---|
| `clearing.default_management` | OK |
| `infrastructure.major_outage_history` | OK |
| `infrastructure.data_latency` | OK |
| `infrastructure.historical_data_availability` | OK |
| `regulation.foreign_ownership_limit` | OK |
| `listing.post_delisting_venue` | OK |
| `regulation.core_laws` | OK |
| `infrastructure.market_data_levels` | OK |
| `regulation.investor_protection` | OK |
| `regulation.disclosure_requirements` | OK |

### cn-szse（high 59，全缓存可核验 53，抽检 10，通过 10）

| 字段 | 状态 |
|---|---|
| `market_structure.derivatives.opening_mechanism` | OK |
| `market_structure.price_limits.other_boards` | OK |
| `infrastructure.data_pricing_model` | OK |
| `clearing.derivatives.last_trading_day_rule` | OK |
| `participants.suitability_management` | OK |
| `market_structure.derivatives.trading_halt_mechanism` | OK |
| `regulation.capital_controls` | OK |
| `market_structure.derivatives.circuit_breaker` | OK |
| `market_structure.derivatives.order_types` | OK |
| `market_structure.odd_lot_handling` | OK |

### de-eurex（high 28，全缓存可核验 20，抽检 10，通过 10）

| 字段 | 状态 |
|---|---|
| `infrastructure.data_latency` | OK |
| `clearing.last_trading_day_rule` | OK |
| `participants.foreign_access_channel` | OK |
| `clearing.default_management` | OK |
| `regulation.investor_protection` | OK |
| `clearing.delivery_method` | OK |
| `regulation.disclosure_requirements` | OK |
| `overview.founded_year` | OK |
| `market_structure.price_limits.type` | OK |
| `infrastructure.historical_data_availability` | OK |

### de-xetra（high 51，全缓存可核验 45，抽检 10，通过 10）

| 字段 | 状态 |
|---|---|
| `costs.dividend_withholding_tax` | OK |
| `market_structure.trading_halt_mechanism` | OK |
| `infrastructure.historical_data_availability` | OK |
| `clearing.default_management` | OK |
| `market_structure.market_maker_scheme` | OK |
| `infrastructure.data_pricing_model` | OK |
| `market_structure.tick_size` | OK |
| `costs.clearing_fees` | OK |
| `market_structure.price_limits.type` | OK |
| `participants.foreign_access_channel` | OK |

### fr-euronext（high 61，全缓存可核验 60，抽检 10，通过 10）

| 字段 | 状态 |
|---|---|
| `regulation.core_laws` | OK |
| `market_structure.derivatives.trading_halt_mechanism` | OK |
| `costs.exchange_fees` | OK |
| `listing.transfer_between_boards` | OK |
| `listing.suspension_resumption` | OK |
| `clearing.csd_name` | OK |
| `market_structure.derivatives.margin_practice_note` | OK |
| `infrastructure.historical_data_availability` | OK |
| `listing.continuing_obligations` | OK |
| `market_structure.derivatives.block_trade` | OK |

### hk-hkex（high 50，全缓存可核验 49，抽检 10，通过 10）

| 字段 | 状态 |
|---|---|
| `participants.account_opening_requirements` | OK |
| `market_structure.derivatives.matching_principle` | OK |
| `market_structure.derivatives.price_limits.main_board` | OK |
| `infrastructure.major_outage_history` | OK |
| `market_structure.derivatives.trading_sessions.pre_market` | OK |
| `clearing.default_management` | OK |
| `clearing.derivatives.last_trading_day_rule` | OK |
| `clearing.derivatives.maintenance_margin_practice` | OK |
| `market_structure.derivatives.circuit_breaker` | OK |
| `costs.regulatory_fees` | OK |

### in-nse（high 49，全缓存可核验 48，抽检 10，通过 10）

| 字段 | 状态 |
|---|---|
| `clearing.derivatives.initial_margin_practice` | OK |
| `overview.market_cap_usd_bn` | OK |
| `costs.stamp_duty` | OK |
| `costs.regulatory_fees` | OK |
| `infrastructure.access_methods` | OK |
| `market_structure.derivatives.opening_mechanism` | OK |
| `market_structure.price_limits.type` | OK |
| `market_structure.opening_mechanism` | OK |
| `market_structure.circuit_breaker` | OK |
| `market_structure.derivatives.circuit_breaker` | OK |

### jp-jpx（high 44，全缓存可核验 42，抽检 10，通过 10）

| 字段 | 状态 |
|---|---|
| `regulation.self_regulatory_org` | OK |
| `market_structure.opening_mechanism` | OK |
| `listing.suspension_resumption` | OK |
| `infrastructure.access_methods` | OK |
| `participants.broker_landscape` | OK |
| `listing.review_system` | OK |
| `infrastructure.data_latency` | OK |
| `participants.foreign_access_channel` | OK |
| `clearing.settlement_cycle` | OK |
| `regulation.foreign_ownership_limit` | OK |

### kr-krx（high 58，全缓存可核验 55，抽检 10，通过 10）

| 字段 | 状态 |
|---|---|
| `market_structure.derivatives.circuit_breaker` | OK |
| `overview.history` | OK |
| `clearing.derivatives.initial_margin_practice` | OK |
| `market_structure.derivatives.trading_sessions.pre_market` | OK |
| `market_structure.trading_sessions.pre_market` | OK |
| `overview.organization_form` | OK |
| `market_structure.derivatives.matching_principle` | OK |
| `listing.post_delisting_venue` | OK |
| `market_structure.derivatives.contract_specs_note` | OK |
| `listing.delisting_conditions` | OK |

### sa-tadawul（high 60，全缓存可核验 58，抽检 10，通过 10）

| 字段 | 状态 |
|---|---|
| `market_structure.price_limits.main_board` | OK |
| `infrastructure.access_methods` | OK |
| `listing.review_system` | OK |
| `clearing.csd_name` | OK |
| `regulation.foreign_ownership_limit` | OK |
| `listing.suspension_resumption` | OK |
| `listing.delisting_conditions` | OK |
| `market_structure.derivatives.tick_size` | OK |
| `participants.membership_structure` | OK |
| `regulation.self_regulatory_org` | OK |

### sg-sgx（high 49，全缓存可核验 39，抽检 10，通过 10）

| 字段 | 状态 |
|---|---|
| `clearing.derivatives.initial_margin_practice` | OK |
| `participants.foreign_access_channel` | OK |
| `market_structure.odd_lot_handling` | OK |
| `listing.continuing_obligations` | OK |
| `listing.delisting_process` | OK |
| `market_structure.derivatives.trading_halt_mechanism` | OK |
| `market_structure.derivatives.circuit_breaker` | OK |
| `market_structure.volatility_interruption` | OK |
| `risks.regulatory_change_risk_note` | OK |
| `market_structure.derivatives.volatility_interruption` | OK |

### tw-twse（high 48，全缓存可核验 48，抽检 10，通过 10）

| 字段 | 状态 |
|---|---|
| `listing.delisting_process` | OK |
| `market_structure.price_limits.main_board` | OK |
| `infrastructure.market_data_levels` | OK |
| `costs.capital_gains_tax` | OK |
| `market_structure.price_limits.other_boards` | OK |
| `market_structure.intraday_reversal` | OK |
| `costs.stamp_duty` | OK |
| `market_structure.market_maker_scheme` | OK |
| `regulation.self_regulatory_org` | OK |
| `clearing.default_management` | OK |

### uk-lse（high 52，全缓存可核验 52，抽检 10，通过 10）

| 字段 | 状态 |
|---|---|
| `costs.clearing_fees` | OK |
| `infrastructure.data_latency` | OK |
| `market_structure.matching_principle` | OK |
| `risks.political_risk_note` | OK |
| `regulation.foreign_ownership_limit` | OK |
| `participants.membership_structure` | OK |
| `risks.enforcement_note` | OK |
| `market_structure.trading_halt_mechanism` | OK |
| `infrastructure.trading_system_name` | OK |
| `costs.regulatory_fees` | OK |

### us-nasdaq（high 39，全缓存可核验 39，抽检 10，通过 10）

| 字段 | 状态 |
|---|---|
| `risks.political_risk_note` | OK |
| `costs.capital_gains_tax` | OK |
| `overview.history` | OK |
| `infrastructure.historical_data_availability` | OK |
| `market_structure.closing_mechanism` | OK |
| `overview.organization_form` | OK |
| `market_structure.short_selling` | OK |
| `participants.suitability_management` | OK |
| `market_structure.order_types` | OK |
| `listing.delisting_process` | OK |

### us-nyse（high 36，全缓存可核验 31，抽检 10，通过 10）

| 字段 | 状态 |
|---|---|
| `infrastructure.major_outage_history` | OK |
| `overview.organization_form` | OK |
| `costs.regulatory_fees` | OK |
| `risks.enforcement_note` | OK |
| `overview.founded_year` | OK |
| `clearing.default_management` | OK |
| `regulation.investor_protection` | OK |
| `costs.clearing_fees` | OK |
| `market_structure.opening_mechanism` | OK |
| `risks.liquidity_risk_note` | OK |

### za-jse（high 63，全缓存可核验 62，抽检 10，通过 10）

| 字段 | 状态 |
|---|---|
| `market_structure.short_selling` | OK |
| `infrastructure.access_methods` | OK |
| `clearing.default_management` | OK |
| `market_structure.closing_mechanism` | OK |
| `participants.membership_structure` | OK |
| `listing.suspension_resumption` | OK |
| `listing.delisting_process` | OK |
| `listing.delisting_conditions` | OK |
| `infrastructure.trading_system_name` | OK |
| `overview.founded_year` | OK |

