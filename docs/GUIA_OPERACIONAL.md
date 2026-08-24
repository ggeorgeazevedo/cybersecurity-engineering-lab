# Guia Operacional — Comandos & Fluxos do Lab

Referência rápida de tudo que se repete no bootcamp: conectar ambiente, proteger branches, estratégia de branches, fluxo de PR e troubleshooting. Feito para **este repo** (`ggeorgeazevedo/cybersecurity-engineering-lab`), stack **Node/Express**, terminal **zsh** no macOS.

> ⚠️ **zsh:** não cole linhas de comentário começando com `#` no terminal — o zsh interativo tenta executá-las (`command not found: #`). Os comentários aqui são só para leitura; copie apenas os comandos.

---

## 0. Pré-requisitos — checar o que está instalado

```bash
git --version
gh --version
node --version
docker --version
terraform --version
kind --version
```

Autenticar o GitHub CLI (uma vez por máquina):

```bash
gh auth login
gh auth status
```

---

## 1. Conectar o ambiente ao Claude

O Claude (Cowork) trabalha na sua máquina através de uma **pasta conectada**.

1. No app do Claude (desktop), clique em **"Add folder"**.
2. Selecione a pasta do projeto: `~/Projetos/cybersecurity-engineering-lab`.
3. Pronto — a partir daí o Claude **lê e escreve** arquivos nessa pasta (para code review e para gerar arquivos), mas **quem versiona é você** (`git add/commit/push`).

Fora do Claude, o repositório local vive em:

```bash
cd ~/Projetos/cybersecurity-engineering-lab
```

---

## 2. Proteger a branch `main` (branch protection)

Isso implementa o **CICD-SEC-1 (Insufficient Flow Control)**: ninguém commita direto na `main`; tudo passa por Pull Request.

### Via interface (recomendado)

1. Repo → **Settings** → **Rules** → **Rulesets** → **New branch ruleset**.
2. Nome: `protect-main` · **Enforcement status: Active**.
3. **Target branches** → *Add target* → **Include default branch**.
4. Marque:
   - ✅ *Require a pull request before merging*
   - (a partir do Dia 2) ✅ *Require status checks to pass* → adicione os checks de CI/segurança
   - (opcional) ✅ *Block force pushes* · ✅ *Restrict deletions*
5. **Create**.

### Via CLI (equivalente rápido)

```bash
gh api -X POST repos/ggeorgeazevedo/cybersecurity-engineering-lab/rulesets \
  -f name='protect-main' \
  -f target='branch' \
  -f enforcement='active' \
  -F 'conditions[ref_name][include][]=~DEFAULT_BRANCH' \
  -F 'rules[][type]=pull_request' \
  -F 'rules[][type]=non_fast_forward'
```

Conferir as regras ativas:

```bash
gh api repos/ggeorgeazevedo/cybersecurity-engineering-lab/rules/branches/main
```

---

## 3. Estratégia de branches — onde roda cada tipo

**Regra de ouro:** `main` é sempre a fonte da verdade, sempre protegida, sempre deployável. Todo trabalho nasce numa branch separada e volta via PR.

| Branch | Para quê | Convenção de nome | O que dispara |
| --- | --- | --- | --- |
| `main` | estado estável/deployável | — | CI completo + CD (deploy) |
| feature | funcionalidade nova | `feat/<curto>` | CI + gates de segurança no PR |
| fix | correção | `fix/<curto>` | CI + gates no PR |
| docs | documentação | `docs/<curto>` | CI leve (lint/markdown) |
| lab do dia | exercício do bootcamp | `dia-<N>/<tema>` | CI + o que o dia exigir |
| ataque (Dia 6) | PoC ofensivo isolado | `attack/<tecnica>` | roda em ambiente isolado, **nunca** com secrets de prod |

Exemplos de nomes:

```
feat/auth-jwt
fix/sqli-users-endpoint
docs/guia-operacional
dia-2/sast-semgrep-gate
attack/script-injection-poc
```

**Onde cada workflow roda** (config no `.github/workflows/*.yml` via `on:`):

- **Push em qualquer branch** → CI básico (build + test).
- **Pull Request → `main`** → CI + **security gates** (SAST, SCA, secrets). É o portão que decide o merge.
- **Push/merge na `main`** → build da imagem, SBOM, assinatura, e (Dia 5) deploy para DEV/STG.
- **Tag `v*` / Release** → publicação de artifact assinado + provenance.
- ⚠️ **Nunca** use `pull_request_target` com checkout de código de fork (Dia 6 explica o porquê — pwn request).

---

## 4. Fluxo de Pull Request (o ciclo que você repete todo dia)

```bash
# 1. partir sempre da main atualizada
git switch main
git pull

# 2. criar a branch do trabalho
git switch -c feat/nome-curto

# 3. trabalhar... e commitar em pedaços pequenos
git add -A
git commit -m "feat: descrição objetiva"

# 4. enviar a branch (a main está protegida; branches passam)
git push -u origin feat/nome-curto

# 5. abrir o PR
gh pr create --fill

# 6. acompanhar os checks de CI/segurança
gh pr checks --watch

# 7. quando tudo verde, fazer o merge (squash) e apagar a branch
gh pr merge --squash --delete-branch

# 8. ressincronizar a main local
git switch main
git pull
```

Ver o PR no navegador a qualquer momento:

```bash
gh pr view --web
```

### Mensagens de commit (convenção)

Use *Conventional Commits* — ajuda leitura e é padrão de mercado:

```
feat:      nova funcionalidade
fix:       correção de bug
docs:      documentação
refactor:  refatoração sem mudar comportamento
test:      testes
chore:     tarefa de manutenção/infra
security:  correção/hardening de segurança
```

---

## 5. Comandos `gh` úteis

```bash
gh repo view --web                 # abre o repo no navegador
gh pr list                         # lista PRs abertos
gh pr status                       # estado dos seus PRs
gh pr checks                       # status dos checks do PR atual
gh run list                        # últimas execuções de workflow (Actions)
gh run view <id> --log             # logs de uma execução
gh run watch                       # acompanha a execução em andamento
gh workflow list                   # workflows do repo
gh secret list                     # secrets configurados (nomes, não valores)
gh browse                          # abre o repo/arquivo atual no navegador
```

---

## 6. Rodar a aplicação e os testes localmente (Node/Express)

```bash
npm install                        # instala dependências
npm run dev                        # sobe a app (hot-reload)
npm test                           # roda os testes (Jest + Supertest)
npm audit                          # SCA nativo: vulnerabilidades nas deps
```

Com Docker (a partir do Dia 3):

```bash
docker compose up -d               # sobe app + banco
docker compose logs -f app         # acompanha logs
docker compose down                # derruba tudo
```

---

## 7. Rodar os scanners de segurança localmente (prévia do que vira gate)

```bash
# SAST
semgrep --config auto .

# Secrets
gitleaks detect --source . --verbose

# SCA / dependências (multi-ecossistema)
osv-scanner scan --lockfile package-lock.json

# Container / IaC / secrets (tudo-em-um)
trivy fs .
trivy config ./terraform

# SBOM + vuln do SBOM
syft . -o cyclonedx-json > sbom.json
grype sbom:sbom.json

# Segurança dos próprios workflows do GitHub Actions
zizmor .github/workflows/
```

> Rodar local **antes** de abrir o PR economiza tempo: você chega com o gate já verde.

---

## 8. Troubleshooting rápido

**`push declined due to repository rule violations` / "Changes must be made through a pull request"**
→ Não é erro: a branch protection está funcionando. Faça pela via de PR (Seção 4). Nunca contorne com force push.

**`Not possible to fast-forward` ao dar `git pull` na main**
→ Sua `main` local divergiu (ex.: você commitou direto antes do merge do PR). Realinhe com o remoto:
```bash
git fetch origin
git reset --hard origin/main
```
⚠️ `reset --hard` descarta mudanças locais não commitadas — garanta que não há trabalho a salvar.

**`remote origin already exists`**
→ O remote já está configurado. Cheque com `git remote -v`. Só ajuste se a URL estiver errada:
```bash
git remote set-url origin https://github.com/ggeorgeazevedo/cybersecurity-engineering-lab.git
```

**Commitei na branch errada**
→ Mova o último commit para uma branch nova:
```bash
git switch -c feat/branch-certa      # cria a branch já com o commit
git switch main
git reset --hard origin/main          # limpa a main
git switch feat/branch-certa
```

**Ver o que mudou antes de commitar**
```bash
git status
git diff                # mudanças não staged
git diff --staged       # mudanças já em stage
git log --oneline -5    # últimos commits
```

**Desfazer o último commit mantendo as mudanças no working tree**
```bash
git reset --soft HEAD~1
```

---

## 9. Ciclo de um dia do bootcamp (resumo)

```
git switch main && git pull
git switch -c dia-<N>/<tema>
   ... implementar (Claude revisa na pasta conectada) ...
   ... rodar scanners locais (Seção 7) ...
git add -A && git commit -m "..."
git push -u origin dia-<N>/<tema>
gh pr create --fill
gh pr checks --watch        (gates de segurança rodam aqui)
gh pr merge --squash --delete-branch
git switch main && git pull
```

Esse loop **é** o produto do bootcamp: código passa por um portão de segurança automatizado antes de chegar na `main`.
