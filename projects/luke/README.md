# Luke

Portable AI workspace for building and operating projects such as `junkMoney` while minimizing paid plan usage.

Luke is a separate project from `junkboy-monetize`.

## Goals

- use free Kilo / KiloClaw capacity first
- preserve paid ChatGPT Plus and Claude plan usage for high-value manual work
- keep prompts, modes, rules, skills, and launch configs exportable
- make the same setup reproducible across PC, Android-adjacent workflows, CLI, and future agent environments

## Principles

1. Git-backed configuration
2. Provider routing by task type
3. Premium models only for escalation
4. Portable agent instructions using `AGENTS.md`
5. Exportable custom modes and skills

## Layout

- `config/` provider routing and stack profiles
- `docs/` setup notes and chat bridge plan

## Sources baked into this design

This workspace is designed around current Kilo and SimpleX documentation:

- Kilo supports VS Code, JetBrains, CLI, sessions, custom modes, skills, AGENTS.md, and BYOK.
- KiloClaw is Kilo's hosted OpenClaw with current documented support for Telegram, Discord, and Slack.
- SimpleX provides Android app, terminal CLI, self-hosted SMP server support, and a TypeScript SDK / bot direction in project materials.

## Immediate use

Start with `docs/setup-wizard.md` and `config/luke-stack.example.json`.
