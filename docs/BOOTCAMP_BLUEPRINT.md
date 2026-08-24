# BOOTCAMP BLUEPRINT — Cybersecurity Engineering Lab (7 dias)

> **De `Security Reviewer` → `Cybersecurity Engineer`**
> Design → Implement → Automate → Secure → Attack → Detect → Troubleshoot → Improve
> Regra mestra: **80% hands-on / 20% teoria**. Cloud-agnostic first. Custo zero.

**Status:** confirmado — stack Node/Express, GitHub real, Azure só conceitual. Início: Dia 1.
**Data de referência da pesquisa:** 19/ago/2026.
**Objetivo de carreira:** vaga de **Application Security Engineer em banco** (setor financeiro regulado — BACEN/LGPD/PCI-DSS; ferramentas típicas: Fortify, Azure DevOps).

---

## 0. Como ler este blueprint

Este documento é o **plano de voo**. Ele não começa o Dia 1 — ele define o que vamos construir, com quais ferramentas, contra qual modelo de ameaça, e como validamos aprendizado. Cada seção foi triangulada seguindo sua matriz de pesquisa (OWASP → Docs oficiais → GitHub → Blog/Medium → Incidente real → Framework). As decisões de ferramenta trazem justificativa e **limitações**, não só o "use X".

Tudo aqui é portável: Markdown puro, sem dependência de plataforma. No fim você terá um repositório `cybersecurity-engineering-lab` apresentável em GitHub, Notion, Pages ou PDF.

---

## 0.1 Priorização para a vaga de AppSec Engineer em banco

O bootcamp cobre 12 domínios, mas eles **não têm o mesmo peso** para o seu alvo (sair de *reviewer* → *AppSec Engineer* em banco). Ordem de criticidade e onde cada um é trabalhado:

**🔴 Prioridade máxima — é o coração da vaga:**

1. **AppSec** — OWASP Top 10 Web **+ API**; achar **e corrigir** SQLi/SSRF/authz na prática, não só apontar. *(Dias 1–2)*
2. **DevSecOps / CI-CD Engineering** — integrar SAST/SCA/DAST/secret scanning como **security gates** que não travam o time. É literalmente o trabalho do dia 1 no emprego. *(Dias 1–2, 5)*
3. **Threat Modeling** — STRIDE, trust boundaries, abuse cases. Cai em entrevista de banco. *(Dias 6–7)*

**🟠 Alta prioridade — seu diferencial vs. outros candidatos:**

4. **Supply Chain Security** — virou **A03 do OWASP Top 10:2025**. Poucos reviewers sabem *implementar* SBOM + assinatura + provenance. *(Dia 3)*
5. **IAM / OIDC** — "por que credencial long-lived é ruim" é pergunta clássica. *(Dia 5)*

**🟡 Suporte — importa, mas não é onde se ganha a vaga de AppSec:**

6. Container Security → 7. IaC Security → 8. Cloud Security → depois Kubernetes, Observability, Incident Response, Automation. *(Dias 3–4, 6–7)*

**Consequência no cronograma:** os **Dias 1, 2, 3 e 6** recebem mais peso e tempo (app + gates + supply chain + ataque). A entrevista simulada do Dia 7 usa perguntas **estilo banco**: secure SDLC, security champions, tuning de SAST/Fortify, gate sem fricção, LGPD/PCI no pipeline.

---

## 1. Arquitetura do laboratório

### 1.1 Visão de plataforma

```
PLATAFORMA PRIMÁRIA        PLATAFORMA SECUNDÁRIA        RUNTIME LOCAL
GitHub + GitHub Actions  →  Azure DevOps (mapeamento)   Docker + Kind + Terraform
   (fonte da verdade)         (mesmos conceitos)          (tudo roda no seu laptop)
```

**Por que GitHub como primária:** melhor superfície de *security features* nativas grátis (OIDC, artifact attestations, immutable releases, code scanning, dependency review, environments com approvals), fácil de publicar e compartilhar, e é onde acontecem os incidentes de supply chain que vamos estudar. Azure DevOps entra como **cross-training conceitual** — você já mexe com ele no trabalho, então o valor é traduzir conceito ↔ sintaxe, não decorar YAML.

### 1.2 Aplicação-alvo

**Stack escolhida: Node.js + Express + SQLite (e Postgres via docker-compose).**

Justificativa:

- Express é enxuto, tem auth simples (JWT/express-session), e gera erros de segurança realistas (SQLi, SSRF, path traversal, command injection) sem boilerplate.
- Ecossistema Node cobre todas as ferramentas do bootcamp de graça (Semgrep, `npm audit`, OSV-Scanner, Trivy, Gitleaks).
- SQLite (`better-sqlite3`) para rodar local sem infra; Postgres opcional via compose para exercícios de secret/connection.
- Testes com **Jest + Supertest** (unit + regressão de segurança).

> Nota de mentor: bancos ainda têm muito Java/Spring no core (e o Fortify brilha em Java). Os conceitos de AppSec são idênticos entre stacks — usamos Node por familiaridade e velocidade de lab; um *post-bootcamp* opcional replica os mesmos vetores em Java.

A app terá, propositalmente, **um par seguro e um inseguro** de cada coisa:

| Componente        | Versão insegura (lab)                          | Versão segura (fix)                     |
| ----------------- | ---------------------------------------------- | --------------------------------------- |
| Query de banco    | string concatenada → **SQL Injection**         | parametrização / ORM                    |
| Fetch de URL      | request sem validação → **SSRF**               | allowlist + bloqueio de IPs internos    |
| Leitura de arquivo| join de path do usuário → **Path Traversal**   | canonicalização + jail                  |
| Exec de comando   | `child_process.exec(user_input)` → **Command Injection** | `execFile` sem shell + validação |
| Segredo           | API key **hardcoded**                          | env var / secret manager                |
| Auth              | senha fraca / sem rate-limit                   | hashing forte + lockout                 |
| Dependência       | pacote com CVE conhecido                        | versão corrigida                        |

> ⚠️ **Regra de segurança:** todo exploit ocorre **somente** contra este lab local. Nada de alvos externos, credenciais reais ou secrets corporativos.

### 1.3 Estrutura do repositório (evolui ao longo dos 7 dias)

```
cybersecurity-engineering-lab/
├── app/                      # Express: endpoints seguros e vulneráveis
│   ├── server.js
│   ├── auth.js
│   ├── db.js
│   └── vulnerable/           # rotas intencionalmente inseguras (isoladas)
├── tests/                    # Jest + Supertest (unit + security regression)
├── Dockerfile                # multi-stage, non-root, distroless/slim
├── docker-compose.yml
├── terraform/                # IaC insegura → hardened (S3/IAM/network)
├── kubernetes/               # manifests inseguros → hardened + policies
├── .github/
│   └── workflows/            # ci.yml, security.yml, release.yml, cd.yml
├── azure-pipelines/          # espelho conceitual em Azure DevOps
├── security/
│   ├── threat-model/         # STRIDE, attack trees, trust boundaries
│   ├── policies/             # OPA/Conftest, Kyverno, rulesets
│   ├── attacks/              # PoCs de ataque ao pipeline (Dia 6)
│   └── reports/              # saídas de SAST/SCA/SBOM/scan
├── scripts/
├── docs/                     # arquitetura, ADRs, runbooks, reading lists
└── README.md
```

### 1.4 Diagrama do pipeline-alvo (onde queremos chegar no Dia 7)

```
Developer → PR ──► [Branch protection + CODEOWNERS + required checks]
                     │
        ┌────────────┼───────────────────────────┐
     Code Review                         Security checks (PR gate)
                     │                            │
                    CI ──► test · SAST · SCA · secrets · IaC scan · license
                     │
                Build image ──► container scan · SBOM (SPDX/CycloneDX)
                     │
              Sign (cosign keyless) + Artifact Attestation (SLSA provenance)
                     │
                    DEV ──► DAST (ZAP)
                     │
                 STAGING ──► Security Gate (política) ──► Approval (environment)
                     │
                 PRODUCTION  (deploy via OIDC, short-lived creds, least privilege)
```

---

## 2. Ferramentas escolhidas (com justificativa e limitações)

Regra: você **não** aceita minha escolha automaticamente. Cada dia começa com um mini "tool decision" — abaixo estão as escolhas-base e o *porquê*, mas no Dia 2+ você vai revalidar (Tool → Problem → Coverage → Limitations → Integration → Gate).

### SAST — **Semgrep** (primário) + **CodeQL** (comparativo)

- **Semgrep:** rápido, regras em YAML legível, ótimo para custom rules e para *gate* de PR. Roda 100% local e grátis (Community). Fraqueza: análise mais rasa de fluxo de dados que CodeQL em casos complexos.
- **CodeQL:** análise semântica profunda (taint tracking real), grátis para repos públicos via GitHub code scanning. Fraqueza: mais lento, curva de aprendizado da linguagem QL, e o uso self-hosted em repo privado tem restrições de licença.
- **Veredito do lab:** Semgrep no gate rápido de PR; CodeQL como *default setup* de code scanning para comparar achados. Você vai ver na prática por que SAST tem falso-positivo e falso-negativo.

### SCA / Dependency — **OSV-Scanner** + **npm audit** (e Trivy como all-in-one)

- **OSV-Scanner** (Google/OpenSSF): usa a base OSV, cobre múltiplos ecossistemas, ótimo sinal de proveniência. **`npm audit`** é o baseline nativo do Node. **Trivy** cobre SCA + container + IaC + secrets num binário só — excelente para reduzir superfície de ferramentas.
- Limitação: SCA acha *vulnerabilidade conhecida*, não backdoor novo (ver incidente Shai-Hulud). Por isso combinamos com SBOM + attestation.

### Secrets — **Gitleaks** (gate) + **TruffleHog** (validação)

- **Gitleaks:** rápido, ótimo em pre-commit e CI, regex + entropy. **TruffleHog:** diferencial é **verificação ativa** (testa se o segredo ainda é válido), reduzindo falso-positivo. Usamos os dois para você sentir a diferença "detectou" vs "detectou e confirmou que vaza".

### IaC — **Trivy** + **Checkov** + **Conftest/OPA** (policy as code)

- ⚠️ **tfsec está em modo de manutenção**: a Aqua consolidou o motor do tfsec dentro do **Trivy** e recomenda migração. Não vamos ancorar no tfsec — usamos **Trivy** (misconfig) e **Checkov** (amplo, com soft/hard fail e políticas customizadas). **Conftest/OPA (Rego)** entra para *policy as code* própria (ex.: "nenhum S3 público", "sem `*` em IAM").

### Container — **Trivy** (scan) + **Syft** (SBOM) + **Grype** (vuln do SBOM)

- **Syft** gera SBOM (SPDX/CycloneDX); **Grype** consome o SBOM e reporta CVEs; **Trivy** faz scan direto da imagem. Ver os dois caminhos ensina a diferença entre "scan da imagem" e "scan do SBOM".

### Assinatura / Proveniência — **Cosign (keyless/Sigstore)** + **GitHub Artifact Attestations**

- **Cosign keyless:** assina imagem sem gerenciar chave privada — usa OIDC do runner + Fulcio (cert efêmero) + Rekor (transparência). **GitHub Artifact Attestations:** gera proveniência **SLSA Build L3** com reusable workflows, verificável via `gh attestation verify`. É a resposta direta à sua pergunta: *"como provar que o artifact em produção é o mesmo do build?"*

### DAST — **OWASP ZAP** (baseline + full via Automation Framework)

- ZAP baseline scan roda como GitHub Action contra a app rodando em container. Grátis, bom o suficiente para o lab. Limitação: DAST acha o que consegue exercitar; cobertura depende de endpoints/autenticação configurados.

### Kubernetes — **Kind** + **Kyverno** (policy) + **Trivy** (misconfig de manifests)

- **Kind** (K8s em Docker) roda local sem custo. **Kyverno** (YAML nativo, menor curva que Rego) para admission control; comparamos com **OPA Gatekeeper** conceitualmente.

### Segurança do próprio pipeline — **zizmor** + **OpenSSF Scorecard** + **Gato-X** + **StepSecurity Harden-Runner**

- **zizmor:** SAST específico de workflows do GitHub Actions (pega script injection, `pull_request_target` inseguro, permissões excessivas). **Scorecard:** postura do repositório. **Gato-X** (Praetorian): ferramenta ofensiva de enumeração/exploração de Actions — usada **só contra o seu lab** no Dia 6. **Harden-Runner:** age como "EDR do runner" (monitora egress/arquivo/processo) — usado para *detectar* os ataques que você mesmo executar.

### Cloud local — **Moto/MiniStack** no lugar de LocalStack

- ⚠️ **Mudança importante (2026):** o LocalStack passou a exigir `LOCALSTACK_AUTH_TOKEN` e restringiu o tier grátis a uso não-comercial (repos arquivados em mar/2026). Para manter **custo zero e sem conta**, o lab usa **Moto** (MIT, in-process, cobre S3/IAM/etc.) para testes, e Terraform aplicando contra Moto/endpoints locais. LocalStack fica como "se você tiver licença, veja como seria".

---

## 3. Threat model inicial do laboratório

Usamos **STRIDE** por componente + a **OWASP Top 10 CI/CD (CICD-SEC)** como matriz de ataque do pipeline. Aprofundamos no Dia 6 e Dia 7.

### 3.1 Trust boundaries (fronteiras de confiança)

```
[Dev laptop] ─► [GitHub repo] ─► [Actions runner] ─► [Registry/Artifact] ─► [DEV/STG/PROD]
     │              │                  │                     │                    │
  commit         PR/fork          exec de YAML          integridade          identidade
  signing      (código não        (secrets,             (assinatura,          (OIDC,
               confiável)         GITHUB_TOKEN)          attestation)          least priv.)
```

Cada seta é uma fronteira onde dados/código cruzam níveis de confiança — é ali que ficam os controles.

### 3.2 OWASP Top 10 CI/CD (matriz-base do lab)

| ID           | Risco                                   | Onde atacamos/mitigamos no lab            |
| ------------ | --------------------------------------- | ----------------------------------------- |
| CICD-SEC-1   | Insufficient Flow Control               | branch protection, required reviews (D5)  |
| CICD-SEC-2   | Inadequate IAM                          | OIDC, least privilege, RBAC (D5)          |
| CICD-SEC-3   | Dependency Chain Abuse                  | SCA, pinning, SBOM (D2/D3/D6)             |
| CICD-SEC-4   | Poisoned Pipeline Execution (PPE)       | script injection, `pull_request_target` (D6) |
| CICD-SEC-5   | Insufficient PBAC                       | permissões de job, scoped tokens (D6)     |
| CICD-SEC-6   | Insufficient Credential Hygiene         | secret scanning, OIDC vs long-lived (D2/D5) |
| CICD-SEC-7   | Insecure System Configuration           | runner hardening, config do pipeline (D6) |
| CICD-SEC-8   | Ungoverned 3rd-Party Services           | pinning por SHA, allowlist de actions (D6)|
| CICD-SEC-9   | Improper Artifact Integrity Validation  | cosign, attestations, provenance (D3/D5)  |
| CICD-SEC-10  | Insufficient Logging & Visibility       | observability, Harden-Runner, audit (D6/D7)|

*(OWASP Top 10 CI/CD v1.0, set–out/2022 — ainda é a referência corrente.)*

### 3.3 STRIDE aplicado (exemplo — o runner do CI)

| STRIDE                 | Ameaça no runner                          | Controle                                  |
| ---------------------- | ----------------------------------------- | ----------------------------------------- |
| **S**poofing           | action de terceiro se passa por confiável | pin por commit SHA, immutable actions     |
| **T**ampering          | artifact alterado pós-build               | assinatura + attestation + verify no CD   |
| **R**epudiation        | não sei quem/what buildou                 | provenance SLSA, logs assinados (Rekor)   |
| **I**nfo Disclosure    | exfiltração de secret via PR              | least-privilege token, egress filtering   |
| **D**oS                | workflow abusa de minutos/recursos        | flow control, concurrency limits          |
| **E**levation of Priv. | `pull_request_target` roda código de fork | evitar checkout de fork; v7 checkout defaults |

---

## 4. Cronograma dos 7 dias

Cada dia segue: **Explain → Implement → Break → Investigate → Attack → Detect → Fix → Validate**, terminando com **Reading List** (Must/Should/Deep Dive/Labs/Incidents/Optional).

### DIA 1 — Engineering Foundation
Construir a app Express + testes, repo Git, primeiro workflow (jobs, steps, runners, artifacts, cache, vars, env, exit codes, logs). Publicar artifact. **Desafio "Pipeline failed"** com troubleshooting guiado (Hypothesis → Evidence → Command → Log → Diagnosis → Fix → Validation).

### DIA 2 — DevSecOps Pipeline (shift-left)
Integrar SAST (Semgrep), SCA (OSV-Scanner/Trivy), secrets (Gitleaks + TruffleHog), license check. Você justifica cada ferramenta e desenha **security gates** que bloqueiam sem travar o dev (warn vs fail, baseline, `continue-on-error` consciente).

### DIA 3 — Container + Supply Chain
Dockerfile seguro (multi-stage, non-root, slim/distroless, sem secrets em layer). Scan de imagem (Trivy), SBOM (Syft → SPDX/CycloneDX), Grype. Assinatura keyless (cosign) + **GitHub Artifact Attestations / SLSA provenance**. Responder na prática: *"o artifact em PROD é o mesmo do build?"*

### DIA 4 — IaC + Cloud Security
Terraform com infra **propositalmente insegura** (S3 público, IAM amplo, secret hardcoded, rede aberta, recurso sem cripto). Pipeline `fmt → validate → plan → security scan → policy → apply`. Checkov + Trivy + Conftest/OPA. Discutir state, secrets no state, remote state, drift, RBAC. Aplicar contra Moto (custo zero).

### DIA 5 — CD + Identity
Environments DEV → STAGING → PROD, approvals, deployment protection rules. **OIDC vs credencial long-lived** (curto-prazo, federação, blast radius). RBAC, least privilege, scoped secrets. Verificação de attestation antes do deploy.

### DIA 6 — Attack the Pipeline (RED TEAM) — *dia mais importante*
Reproduzir **em lab**: Poisoned Pipeline Execution, Script Injection, Dependency Chain Abuse, Credential Theft, Excessive Permissions, Malicious PR, Artifact Tampering, Compromised Runner, Unsafe 3rd-Party Action, Secret Exfiltration. Ferramentas: **zizmor** (encontrar), **Gato-X** (explorar), **Harden-Runner** (detectar). Cada ataque: `Lab → Exploit → Impact → Detection → Mitigation`.

### DIA 7 — Principal Engineer Mode
Você recebe uma arquitetura e faz: threat modeling → trust boundaries → attack paths → blast radius → controls → implement → gates → observability → incident response → docs. Depois **review como Principal Security Engineer** com notas 0–10 por dimensão + entrevista técnica simulada.

---

## 5. GitHub ↔ Azure DevOps (mapa de cross-training)

| Conceito          | GitHub                                   | Azure DevOps                                   |
| ----------------- | ---------------------------------------- | ---------------------------------------------- |
| Pipeline          | Workflow (`.github/workflows/*.yml`)     | Pipeline (`azure-pipelines.yml`)               |
| Unidade de exec   | Job → Steps                              | Stage → Job → Steps                            |
| Runner            | GitHub-hosted / self-hosted runner       | Microsoft-hosted / self-hosted agent (pool)    |
| Secret            | Actions secret / environment secret      | Secret variable / Variable group / Secure file |
| Identidade p/ nuvem| OIDC (federated)                        | Service connection (workload identity fed.)    |
| Environment       | Environment + protection rules           | Environment + Approvals/Checks                 |
| Approval          | Required reviewers no environment        | Approvals & Checks no environment              |
| Artifact          | Actions artifact / Packages              | Pipeline artifact / Azure Artifacts            |
| Permissão do token| `permissions:` + `GITHUB_TOKEN`          | Job authorization scope / build service perms  |
| Security gate     | Required status checks / rulesets        | Branch policies / Checks / gates               |
| Proteção de recurso| Environment + branch protection         | Protected resources (approvals p/ pool/conn.)  |

Ambos tratam **repos, environments, service connections, agent pools, secure files e secret variables** como recursos que exigem controle de acesso — o conceito é o mesmo, muda a UI.

---

## 6. Frameworks e padrões (Framework → Purpose → Control → Implementation → Evidence)

- **OWASP Top 10 CI/CD (CICD-SEC-1..10)** — matriz de risco do pipeline → controles no gate → evidência: workflow + report.
- **OWASP DevSecOps Guideline** — como embutir segurança no SDLC.
- **OWASP ASVS / SAMM** — requisitos de app / maturidade do programa.
- **OWASP Top 10:2025** — nota: **A03 agora é "Software Supply Chain Failures"** (subiu de escopo), reforçando o foco do bootcamp.
- **NIST SSDF (SP 800-218 v1.1)** — práticas seguras de desenvolvimento; mapeamos tarefas do lab às práticas PO/PS/PW/RV.
- **SLSA v1.x (Build L0–L3)** — proveniência/integridade de build; alvo do lab = **Build L3** via attestations.
- **OpenSSF Scorecard** — postura do repositório, medível e automatizável.
- **CIS Benchmarks** — hardening (Docker/K8s).
- **MITRE ATT&CK / D3FEND** — mapear técnicas de ataque ao pipeline e as defesas correspondentes (Dia 6/7).
- **SPDX 3.0 / CycloneDX 1.7** — formatos de SBOM (usaremos ambos para comparar).

---

## 7. Estratégia de pesquisa (a matriz que já estou aplicando)

Para cada tópico crítico, triangular:

| Fonte              | Papel               | Exemplo já levantado                          |
| ------------------ | ------------------- | --------------------------------------------- |
| OWASP              | guidance de risco   | CICD-SEC Top 10, DevSecOps Guideline          |
| Docs oficiais      | como implementar    | GitHub Docs (attestations, OIDC), MS Learn    |
| GitHub (código)    | implementação real  | cicd-goat, harden-runner, Gato-X, zizmor      |
| Blog/Medium        | experiência prática | Wiz/Datadog/StepSecurity hardening posts      |
| Incident report    | ataque real         | tj-actions, Codecov, Shai-Hulud, CISA alerts  |
| Framework/Standard | fundamentação       | SLSA, SSDF, ASVS, MITRE                        |

Sempre: **Medium/Blog → confirmar em Doc oficial → ver implementação no GitHub → comparar → decidir**, classificando cada recomendação como *best practice / opinion / vendor-specific / security requirement / architecture choice*.

---

## 8. Estratégia de publicação (portabilidade)

Fluxo de saída para cada entregável:

```
Generic Concept → GitHub Implementation → Azure DevOps Mapping → Cloud (real, opcional)
```

Formatos de exportação garantidos (tudo nasce em Markdown puro + assets versionados):

- **GitHub** (repo + Wiki + Pages) — canônico.
- **Notion** — import direto do Markdown.
- **PDF / apresentação** — via pandoc/Marp a partir dos mesmos `.md`.
- **Portfólio** — README raiz + `docs/` como narrativa.

Nada depende de Azure ou de serviço pago.

---

## 9. Critérios de avaliação (o que medimos no Dia 7)

Notas **0–10** com justificativa em cada dimensão:

CI/CD Engineering · DevSecOps · AppSec · Cloud Security · IAM · Supply Chain Security · Container Security · IaC Security · Threat Modeling · Troubleshooting · Security Architecture · Automation.

Mais **entrevista técnica simulada** (Cybersecurity/DevSecOps Engineer): eu avalio seu raciocínio antes de dar a resposta (ex.: risco do `pull_request_target`, service connection com Contributor no subscription, como impedir exfiltração de secret via PR, como provar integridade de artifact, por que SBOM sozinho não basta, como implementar SLSA/OIDC, como fazer gate sem travar o time).

---

## 10. Pré-requisitos (o que precisamos ter/instalar)

**Obrigatório (grátis):**
- Conta GitHub (repo público para usar code scanning/attestations grátis).
- Git, Docker, Node.js 20+ (LTS), Terraform, `gh` CLI.
- Kind (Kubernetes local).

**Instalados durante o lab (grátis/OSS):**
- Semgrep, Trivy, Syft, Grype, Gitleaks, TruffleHog, OSV-Scanner, Checkov, Conftest/OPA, Cosign, zizmor, OpenSSF Scorecard, ZAP (via Action/Docker), Kyverno, Gato-X (Dia 6, só contra o lab).

**Opcional / cost warning:**
- ⚠️ Azure DevOps corporativo — **só com autorização explícita**, sem secrets/código/credenciais reais no lab.
- ⚠️ Nuvem real (AWS/Azure) — opcional; padrão é Moto local. Marcarei **COST WARNING** em qualquer passo que possa gerar custo.

Ambiente de referência: seu **MacBook Air** (device conectado). Posso preparar tudo aqui na sessão e te entregar os arquivos, ou escrever direto numa pasta que você conectar.

---

## 11. O que roda 100% local vs. o que vai pro GitHub

**Local (laptop/Docker/Kind):** app, testes, todos os scanners, Terraform+Moto, Kind+Kyverno, SBOM/sign/verify, DAST contra container local, ataques do Dia 6.

**GitHub (público):** repo, workflows CI/CD, code scanning (CodeQL), dependency review, artifact attestations, environments/approvals, OIDC, immutable releases, Scorecard.

---

## 12. Tópicos avançados fora dos 7 dias — `POST-BOOTCAMP DEEP DIVE`

eBPF · Kubernetes admission controllers avançados · OPA/Gatekeeper em profundidade · Argo CD / GitOps · HashiCorp Vault · Workload Identity · SPIFFE/SPIRE · Service Mesh · in-toto/Witness · VEX (troca com SBOM) · Actions Data Stream & native egress firewall (roadmap GitHub 2026) · Scoped secrets / workflow dependency locking (roadmap GitHub 2026).

---

## 13. READING LIST (curadoria inicial — expande a cada dia)

### MUST READ
- OWASP Top 10 CI/CD Security Risks — https://owasp.org/www-project-top-10-ci-cd-security-risks/
- GitHub — Secure use reference (hardening) — https://docs.github.com/en/actions/reference/security/secure-use
- GitHub — Artifact attestations — https://docs.github.com/en/actions/concepts/security/artifact-attestations
- SLSA — Specification & levels — https://slsa.dev/spec/v1.1/levels

### SHOULD READ
- OWASP DevSecOps Guideline — https://github.com/OWASP/DevSecOpsGuideline
- OWASP CI/CD Security Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/CI_CD_Security_Cheat_Sheet.html
- Wiz — Hardening GitHub Actions — https://www.wiz.io/blog/github-actions-security-guide
- Datadog — The case for GitHub Actions security — https://securitylabs.datadoghq.com/articles/case-for-github-actions-security/
- GitHub — 2026 Actions security roadmap — https://github.blog/news-insights/product-news/whats-coming-to-our-github-actions-2026-security-roadmap/

### DEEP DIVE
- SLSA v1.2 spec — https://slsa.dev/spec-stages
- Sigstore/Cosign docs — https://docs.sigstore.dev/cosign/signing/overview/
- NIST SSDF SP 800-218 — https://csrc.nist.gov/projects/ssdf/publications
- CycloneDX 1.7 — https://fossa.com/blog/whats-new-cyclone-dx-1-7/
- OWASP Top 10:2025 (A03 Supply Chain) — https://owasp.org/Top10/2025/

### GITHUB LABS
- CI/CD Goat (vulnerável by design, 11 desafios) — https://github.com/cider-security-research/cicd-goat
- zizmor (SAST de workflows) — https://github.com/zizmorcore/zizmor
- Gato-X (ataque a Actions — só no lab) — https://github.com/praetorian-inc/Gato-X
- Harden-Runner (detecção runtime) — https://github.com/step-security/harden-runner
- OpenSSF Scorecard — https://github.com/ossf/scorecard
- awesome-software-supply-chain-security — https://github.com/bureado/awesome-software-supply-chain-security

### REAL WORLD INCIDENTS
- tj-actions/changed-files (CVE-2025-30066) — https://www.wiz.io/blog/github-action-tj-actions-changed-files-supply-chain-attack-cve-2025-30066
- CISA alert (tj-actions + reviewdog) — https://www.cisa.gov/news-events/alerts/2025/03/18/supply-chain-compromise-third-party-tj-actionschanged-files-cve-2025-30066-and-reviewdogaction
- Shai-Hulud npm worm — https://securitylabs.datadoghq.com/articles/shai-hulud-2.0-npm-worm/
- Codecov bash uploader post-mortem — https://about.codecov.io/apr-2021-post-mortem/

### OPTIONAL
- Azure DevOps — Secure your pipelines — https://learn.microsoft.com/en-us/azure/devops/pipelines/security/overview
- Kyverno vs OPA Gatekeeper — https://nirmata.com/2026/01/28/whats-the-difference-between-kyverno-and-opa-gatekeeper/
- tfsec → Trivy migração — https://appsecsanta.com/iac-security-tools/tfsec-vs-trivy
- ZAP baseline scan Action — https://www.lunavi.com/blog/using-the-owasp-zap-baseline-scan-github-action

---

## 14. Decisões (confirmadas)

1. **Stack:** ✅ **Node.js + Express**.
2. **Modelo de trabalho:** ✅ **você escreve o código na sua máquina; eu leio, reviso e guio** (mentoria real). Pasta local conectada ao Claude para code review dos seus commits.
3. **GitHub real:** ✅ repo público [`ggeorgeazevedo/cybersecurity-engineering-lab`](https://github.com/ggeorgeazevedo/cybersecurity-engineering-lab) — workflows, OIDC e attestations reais.
4. **Azure DevOps:** ✅ apenas **mapeamento conceitual** (tabelas GitHub ↔ Azure em cada dia). Sem ambiente corporativo.
5. **Prioridade:** ✅ foco em **AppSec Engineer de banco** — ver a **Seção 0.1**. Peso maior nos Dias 1, 2, 3 e 6.

---

**Próximo passo:** dizer **"bora Dia 1"** e eu inicio o **Dia 1 — Engineering Foundation**.
