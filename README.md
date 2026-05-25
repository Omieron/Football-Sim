# Pitchline

Football league simulation — standings, fixtures, live match events, stats, and championship predictions.

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
