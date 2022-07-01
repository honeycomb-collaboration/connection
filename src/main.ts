function main() {
    const ws = new WebSocket(
        'wss://demo.piesocket.com/v3/channel_1?api_key=VCXCEuvhGcBDP7XhiJJUDvR1e1D3eiVjgZ9VRiaV&notify_self'
    )
    ws.onmessage = function (evt) {
        console.debug(evt)
    }
    ws.onerror = function (error) {
        console.error(error)
    }
    ws.onopen = function (evt) {
        console.log(evt)
        ws.send('hello')
    }
}

main()
