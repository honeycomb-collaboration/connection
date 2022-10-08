package connection

import (
	"context"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
)

const maxMessageSizeBytes = 2 * 1024 * 1024
const messageBufferCount = 10

var upgrader = websocket.Upgrader{
	ReadBufferSize:    4096,
	WriteBufferSize:   4096,
	EnableCompression: true,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Connection struct {
	IncomingMessage <-chan *[]byte
	OutgoingMessage chan<- *[]byte
}

func Handle(ctx context.Context, responseWriter http.ResponseWriter, request *http.Request, handler func(con *Connection)) error {
	log.Println("WebSocket new connection: " + request.Host)

	wsConn, err := upgrader.Upgrade(responseWriter, request, nil)
	if err != nil {
		return err
	}

	// Set message size limit
	wsConn.SetReadLimit(maxMessageSizeBytes)

	incoming := make(chan *[]byte, messageBufferCount)
	outgoing := make(chan *[]byte, messageBufferCount)
	defer close(incoming)
	defer close(outgoing)

	// Read
	go func() {
		for {
			_, rawBytes, err := wsConn.ReadMessage()
			if err != nil {
				log.Println("websocket read error:", err)
				break
			}

			if len(rawBytes) <= 1 {
				// PONG
				outgoing <- &[]byte{}
				log.Println("websocket receive Heartbeat")
				continue
			}

			incoming <- &rawBytes
		}
	}()

	// Write
	go func() {
		for msg := range outgoing {
			if err := wsConn.WriteMessage(websocket.BinaryMessage, *msg); err != nil {
				log.Println("websocket write error:", err)
				break
			}
		}
	}()

	// handle the connection
	go handler(&Connection{
		IncomingMessage: incoming,
		OutgoingMessage: outgoing,
	})

	select {
	case <-ctx.Done():
		log.Println("WebSocket context done: ", ctx.Err())
		return wsConn.Close()
	}
}
