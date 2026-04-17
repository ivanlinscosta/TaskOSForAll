---
name: Project Overview
description: Visão geral da arquitetura do TaskOS ForAll — stack, serviços, estrutura de pastas
type: project
---

## TaskOS ForAll

Plataforma premium React 18 + TypeScript + Firebase para organização pessoal, finanças e carreira.

**Stack:** React 18, TypeScript, Vite, Tailwind v4, Radix UI, Recharts, Firebase v12, Genkit + Gemini 2.5 Flash, Zustand, sonner (toasts)

**Cloud Functions:** Node 20, Genkit `onCallGenkit`, Gemini 2.5 Flash via GEMINI_API_KEY secret

**Módulos principais:** Dashboard, Tarefas, Planejamento, Finanças (Despesas/Receitas/Cartão/Investimentos), Carreira, Desenvolvimento, Viagens, Chat

**Auth:** Firebase Auth com perfil em Firestore (collection `usuarios`)

**Padrão de serviço:** `src/services/` — funções async que usam `currentUidOrNull()` do `require-auth.ts`

**Padrão visual:** CSS custom properties `var(--theme-*)`, cards Radix UI, Lucide icons, toast via sonner

**Build:** `vite build` — sem tsc standalone no projeto raiz (usa verificação de tipos do Vite)
