---
name: Investment Module
description: Aba de Investimentos criada dentro do módulo de Finanças do TaskOS ForAll — arquitetura, APIs, arquivos e coleções Firestore
type: project
---

## Aba de Investimentos — criada em 2026-04-17

Implementação completa da aba de **Investimentos** dentro de `src/app/pages/forall/finance.tsx`.

### Novos arquivos criados

| Arquivo | Responsabilidade |
|---|---|
| `src/services/investment-market-service.ts` | BCB + AwesomeAPI + brapi — dados de mercado, ativos, renda fixa sintética |
| `src/services/investment-portfolio-service.ts` | CRUD Firestore para user_investments, snapshots diários, insights IA |
| `src/services/investment-calculation-service.ts` | Rentabilidade diária e projeções 30/90/180/365d (252 dias úteis) |
| `src/app/components/finance/investments/InvestmentTab.tsx` | Componente principal com 5 seções |
| `functions/src/flows/investment-insights-flow.ts` | Cloud Function Genkit para insights com Gemini 2.5 Flash |

### Arquivos alterados

- `src/lib/firebase-config.ts` — adicionadas 4 novas collections
- `functions/src/index.ts` — exporta `investmentInsightsCallable`
- `src/app/pages/forall/finance.tsx` — 5ª tab "Investimentos" integrada

### Coleções Firestore novas

- `user_investments` — carteira do usuário
- `investment_market_snapshots` — cache diário de mercado (chave = YYYY-MM-DD)
- `investment_daily_snapshots` — snapshot diário por investimento (chave = `{id}_{date}`)
- `investment_ai_insights` — insights gerados (chave = `{uid}_{date}`)

### APIs externas

- BCB: series 11 (Selic diária), 12 (CDI diária), 433 (IPCA)
- AwesomeAPI: USD-BRL, EUR-BRL (CORS enabled, sem auth)
- brapi: ações/FIIs/ETFs (token via `VITE_BRAPI_TOKEN`, default = 'demo')

### Cálculo de rentabilidade

Convenção 252 dias úteis: `daily_rate = (1 + annual_rate/100)^(1/252) - 1`
Para CDI%: `annual_rate = cdiAnual * benchmarkPercent/100`
Para IPCA+: `annual_rate = ipcaAnual + fixedSpread`
Para Prefixado: `annual_rate = fixedRateAnnual`

**Why:** Ivan pediu implementação completa de investimentos com dados reais, cálculos realistas e IA como interpretação.
**How to apply:** Ao alterar qualquer parte do módulo financeiro, verificar se os serviços de investimento são afetados. As projeções são sempre estimativas — não remover disclaimers.
