# Pitchline

Football league simulation — standings, fixtures, live match events, stats, and championship predictions.

## Live deployment

| | URL |
|---|-----|
| **Web app** | https://caseinsider.omerfarukasil.me |
| **API (same domain)** | https://caseinsider.omerfarukasil.me/api/... |
| **API direct (Postman)** | http://165.232.69.83:9011 |

## Quick start (Docker)

```bash
cp .env.docker.example .env
# edit .env — set DB_PASSWORD; default ports 9010 (web) + 9011 (API)

docker compose up -d --build
```

- **Web UI:** http://YOUR_SERVER_IP:9010  
- **API (Postman):** http://YOUR_SERVER_IP:9011

Full guide: [HowToRun.md](./HowToRun.md)  
API reference: [API.md](./API.md)
