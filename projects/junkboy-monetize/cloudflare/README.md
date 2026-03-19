# Cloudflare remote config option

This folder contains the minimal pieces needed to expose a remote config endpoint.

## Intended behavior

- `GET /config` returns the latest JSON config
- `PUT /config` stores JSON config after bearer-token auth
- Config is stored in a KV namespace bound as `CONFIG`

## Suggested bindings

- KV namespace: `CONFIG`
- Secret: `ADMIN_TOKEN`

## Minimal route shape

- `GET /config`
- `PUT /config`

## Why Cloudflare here

- cheap
- fast globally
- easy to pair with GitHub Pages admin
- good fit for config JSON and lightweight content publishing hooks

If your worker write file is not present yet, use the sample in `docs/cloudflare-worker-sample.md` and paste it into Cloudflare Dashboard or Wrangler manually.
