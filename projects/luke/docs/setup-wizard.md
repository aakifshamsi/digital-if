# Luke setup wizard

This setup is optimized to keep paid plan usage minimal.

## 1. Primary coding lane: Kilo

Use Kilo as the first lane because current official docs show it supports:
- VS Code and JetBrains IDEs
- a CLI
- custom modes
- skills
- `AGENTS.md`
- BYOK providers
- sessions and launch configurations

Recommended role for Kilo:
- routine coding
- repo edits
- scaffolding
- repeated refactors
- generating docs and tests

## 2. Premium escalation lane: Human Relay and manual review

Current Kilo docs also describe **Human Relay**. Use that for premium-model help without making your paid plans the default engine for every task.

Use premium manual escalation only for:
- architecture calls
- hard debugging
- review before release
- prompt quality checks

## 3. Avoid default API burn

Do not put OpenAI or Anthropic API keys into autonomous loops first.

Order of preference:
1. Kilo free / bundled capacity
2. Kilo Human Relay for manual web-based escalation
3. OpenRouter cheap fallback for automation where needed
4. direct premium API only when justified

## 4. Portability standard

Make these repo-backed and exportable:
- `AGENTS.md`
- custom modes
- skills
- stack config JSON
- prompt libraries

That way a fresh Kilo environment or a different tool can be rebuilt from Git.

## 5. Android and PC split

### PC
Best host for Kilo IDE and CLI.

### Android
Use for:
- repo access
- chat bridge operations
- notifications
- light command/control
- Termux-side helper scripts if needed

Do not force Android to be the main heavy coding runtime unless necessary.

## 6. SimpleX preference

Current KiloClaw materials document Telegram, Discord, and Slack support. They do **not** clearly document native SimpleX support.

So the practical route is:
- use Kilo/KiloClaw as the coding brain
- use SimpleX as a separate control channel via a custom bridge
- keep the bridge stateless where possible

## 7. Rebuild checklist for a fresh environment

1. clone repo
2. import `config/luke-stack.example.json`
3. restore custom modes
4. restore skills
5. add secrets manually
6. reconnect chat bridge if needed
7. test on a tiny repo task before real work
