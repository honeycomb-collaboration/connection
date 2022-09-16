package connection

import (
	"github.com/gorilla/websocket"
	"log"
	"net/http"
)

const MaxMessageSizeBytes = 2 * 1024 * 1024

var upgrader = websocket.Upgrader{
	ReadBufferSize:    4096,
	WriteBufferSize:   4096,
	EnableCompression: true,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func handler(responseWriter http.ResponseWriter, request *http.Request) {
	log.Println("WebSocket new connection: " + request.Host)
	if conn, err := upgrader.Upgrade(responseWriter, request, nil); err == nil {
		// Set message size limit
		conn.SetReadLimit(MaxMessageSizeBytes)

		go func() {
			log.Println("WebSocket Authenticate ok: ")
			for {
				messageType, rawBytes, err := conn.ReadMessage()
				if err != nil {
					log.Println("websocket read error:", err)
					break
				}
				log.Println("websocket read message:", rawBytes)

				if len(rawBytes) <= 1 {
					// PONG
					_ = conn.WriteMessage(messageType, []byte{})
					continue
				}

				// echo
				_ = conn.WriteMessage(messageType, rawBytes)
			}
		}()
	}
}

func Start(path string) {
	http.HandleFunc(path, handler)
	log.Printf(`
================================================================================

WebSocket service listening: %s
Connection@Honeycomb

================================================================================
	`, path)
}
