# Multiplayer service

Private rooms use a Node 22 WebSocket service, the production shared physics,
60 Hz simulation and 20 Hz state snapshots. Browsers predict their own car and
reconcile acknowledged controls; the server owns all lap and finish decisions.
Human cars have equal skill. Empty or disconnected seats use AI. A refresh can
resume the same seat with its per-tab session token; invitation links contain
only the room ID. The host passes to another connected player on disconnection.

## Local development

Run `npm run dev:server` and `npm run dev` in separate terminals. Vite proxies
`/multiplayer` and `/multiplayer/health` to port 8081. Open the printed Vite URL,
create a room, then use its link in another tab or device. Browser profiles on
the same machine can share the invite, but not the same live reconnect token.
`npm test` includes actual WebSocket tests and needs permission to bind a local
port. No accounts, database or paid external services are used.

## Production

The existing nginx container on `website_default` proxies WSS to the
`quattro-multiplayer` service, port 8081. No additional host port is published.
Install this directory at `/root/quattro-multiplayer/` and apply
`deploy/quattro-https.conf` to the existing nginx vhost, test nginx configuration,
then reload it. Start with:

```
docker compose -f /root/quattro-multiplayer/compose.yml up -d
```

`npm run build` emits both the website and the self-contained Node bundle at
`dist/server/app.cjs`. Existing CI rsync sends it to `/srv/quattro/server`.
The unprivileged, read-only Node container checks the bundle checksum every
three seconds and restarts its child process after an update. nginx denies
HTTP access to `/server/`. Room state is held in memory: backend releases and
server restarts end existing rooms. Players get an expired-room message and
can create a new room. This is deliberately a single-server service.

Only the configured production Origin is accepted. There are at most 32 rooms,
128 sockets, 12 connections per source IP, 2 KB messages and 150 messages/sec
per socket. Input queues and outgoing socket buffers are bounded. Idle lobbies
and results rooms expire after 30 minutes; empty rooms expire after two minutes.
Races have a three-minute cap, with 25 seconds of grace after the first human
finishes. Per-race input IDs prevent old controls carrying into the next race.

```
curl --fail https://quattro.jonh.no/multiplayer/health
docker compose -f /root/quattro-multiplayer/compose.yml logs --tail=50
docker compose -f /root/quattro-multiplayer/compose.yml ps
```

The service has CPU/memory/PID limits and rotating logs. The static site and solo
racing remain available if multiplayer is down. Roll code back through a revert
on main; the same static deployment also rolls back the server bundle. Removing
the service requires first removing its nginx proxy block and reloading nginx.
