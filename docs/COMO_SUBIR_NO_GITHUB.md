# Como subir este repositório no seu GitHub

Escolha **um** dos caminhos abaixo. Recomendo criar o repo como **público** — isso habilita, de graça, code scanning (CodeQL), dependency review e artifact attestations que usaremos a partir do Dia 2.

Substitua `SEU-USUARIO` pelo seu usuário do GitHub.

---

## Caminho A — GitHub CLI (mais rápido)

Se você tem o [`gh`](https://cli.github.com/) instalado e autenticado (`gh auth login`):

```bash
cd cybersecurity-engineering-lab
./scripts/push-to-github.sh SEU-USUARIO public
```

O script inicializa o git, faz o commit inicial, cria o repo na sua conta e faz o push.

---

## Caminho B — Git puro (sem gh)

1. Crie um repositório **vazio** chamado `cybersecurity-engineering-lab` em <https://github.com/new> — **sem** README, .gitignore ou licença (o repo já tem os três).

2. No terminal:

```bash
cd cybersecurity-engineering-lab
git init -b main
git add -A
git commit -m "chore: initial bootcamp scaffold (Day 0 blueprint)"
git remote add origin https://github.com/SEU-USUARIO/cybersecurity-engineering-lab.git
git push -u origin main
```

Ao dar `push`, o GitHub pedirá autenticação. Use um **Personal Access Token** (Settings → Developer settings → Tokens) como senha, ou um SSH key configurado.

---

## Depois do push (recomendado antes do Dia 1)

- **Branch protection** em `main`: Settings → Branches → Add rule → exigir PR + status checks. (Vamos endurecer isso no Dia 5.)
- **Deixe Actions habilitado**: Settings → Actions → Allow.
- Nada de secrets reais no repo. O `.gitignore` já bloqueia `.env`, `*.tfstate`, chaves.

Pronto — amanhã começamos o **Dia 1** commitando a app FastAPI e o primeiro workflow.
