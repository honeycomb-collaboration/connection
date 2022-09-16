# Connection

Connection lib for honeycomb apps.

## Develop

```shell
pnpm i
```

```shell
pnpm dev
```

Then open `chrome://inspect/#workers` to see sharedworkers.

## TODO

- [x] basic events
- [x] readonly states
- [x] automatically reconnection
- [x] develop logger
- [x] heartbeat
- [ ] authentication
- [ ] encryption
- [x] gzip compression
- [ ] payload compression using [Cap’n Proto] or [Protocol Buffers]
- [ ] live in a SharedWorker

---

[Cap’n Proto]: https://capnproto.org/otherlang.html

[Protocol Buffers]: https://developers.google.com/protocol-buffers
