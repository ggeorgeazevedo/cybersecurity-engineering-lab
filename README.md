# cybersecurity-engineering-lab

> Laboratório profissional de **CI/CD + DevSecOps + Supply Chain Security**, construído ao longo de um bootcamp hands-on de 7 dias.
> Objetivo: sair de **Security Reviewer** para **Cybersecurity Engineer** — capaz de **projetar, implementar, automatizar, proteger, atacar, detectar, troubleshootar e explicar** uma cadeia completa de software delivery.

**Regra mestra:** 80% hands-on / 20% teoria · Cloud-agnostic first · Custo zero (open source / free tier / local).

---

## 📌 Status

🚧 Em construção — Dia 0 (blueprint aprovado). O plano completo está em [`docs/BOOTCAMP_BLUEPRINT.md`](docs/BOOTCAMP_BLUEPRINT.md).

| Dia | Tema                         | Status |
| --- | ---------------------------- | ------ |
| 1   | Engineering Foundation       | ⬜     |
| 2   | DevSecOps Pipeline (shift-left) | ⬜  |
| 3   | Container + Supply Chain     | ⬜     |
| 4   | IaC + Cloud Security         | ⬜     |
| 5   | CD + Identity (OIDC)         | ⬜     |
| 6   | Attack the Pipeline (Red Team) | ⬜   |
| 7   | Principal Engineer Mode      | ⬜     |

---

## 🏗️ Arquitetura (alvo)

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
                 STAGING ──► Security Gate ──► Approval (environment)
                     │
                 PRODUCTION  (deploy via OIDC, short-lived creds, least privilege)
```

## 📂 Estrutura do repositório

```
├── app/            # FastAPI: endpoints seguros e vulneráveis (isolados)
├── tests/          # pytest (unit + security regression)
├── terraform/      # IaC insegura → hardened
├── kubernetes/     # manifests inseguros → hardened + policies
├── .github/workflows/  # CI/CD + security pipelines
├── azure-pipelines/    # espelho conceitual em Azure DevOps
├── security/       # threat-model · policies · attacks · reports
├── scripts/
└── docs/           # blueprint, ADRs, runbooks, reading lists
```

## 🧰 Stack & ferramentas (todas OSS / grátis)

| Domínio        | Ferramentas                                            |
| -------------- | ------------------------------------------------------ |
| App            | Python · FastAPI · SQLite/Postgres                     |
| SAST           | Semgrep · CodeQL                                       |
| SCA / deps     | OSV-Scanner · Trivy · pip-audit                        |
| Secrets        | Gitleaks · TruffleHog                                  |
| IaC            | Trivy · Checkov · Conftest/OPA                         |
| Container/SBOM | Trivy · Syft · Grype                                   |
| Assinatura     | Cosign (keyless/Sigstore) · GitHub Artifact Attestations |
| DAST           | OWASP ZAP                                              |
| Kubernetes     | Kind · Kyverno                                         |
| Pipeline sec   | zizmor · OpenSSF Scorecard · Harden-Runner · Gato-X*   |
| Cloud local    | Moto (LocalStack alt. sem conta)                       |

\* Ferramenta ofensiva — usada **exclusivamente contra este laboratório**.

## 🎯 Frameworks de referência

OWASP Top 10 CI/CD (CICD-SEC) · OWASP DevSecOps Guideline · OWASP ASVS/SAMM · OWASP Top 10:2025 · NIST SSDF (SP 800-218) · SLSA v1.x · OpenSSF Scorecard · CIS Benchmarks · MITRE ATT&CK / D3FEND · SPDX / CycloneDX.

## ⚠️ Uso responsável

Todo cenário ofensivo ocorre **apenas contra este ambiente controlado**. Não há alvos externos, credenciais reais nem secrets corporativos neste repositório.

## 📄 Licença

[MIT](LICENSE) — conteúdo educacional.
