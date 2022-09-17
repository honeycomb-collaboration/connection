package connection

import (
	"bytes"
	"compress/gzip"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
)

const maxMessageSizeBytes = 2 * 1024 * 1024

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

func Handle(responseWriter http.ResponseWriter, request *http.Request) (con *Connection, err error) {
	log.Println("WebSocket new connection: " + request.Host)
	if wsConn, err := upgrader.Upgrade(responseWriter, request, nil); err == nil {
		// Set message size limit
		wsConn.SetReadLimit(maxMessageSizeBytes)

		incoming := make(chan *[]byte)
		outgoing := make(chan *[]byte)

		// Read
		go func() {
			// TODO authentication
			log.Println("WebSocket Authenticate ok")

			for {
				messageType, rawBytes, err := wsConn.ReadMessage()
				if err != nil {
					log.Println("websocket read error:", err)
					close(incoming)
					close(outgoing)
					break
				}

				if len(rawBytes) <= 1 {
					// PONG
					_ = wsConn.WriteMessage(messageType, []byte{})
					log.Println("websocket receive Heartbeat")
					continue
				}

				buf := bytes.NewBuffer(rawBytes)
				decompressReader, err := gzip.NewReader(buf)
				if err != nil {
					log.Println("websocket decompress error:", err)
					close(incoming)
					close(outgoing)
					break
				}

				var resB bytes.Buffer
				_, err = resB.ReadFrom(decompressReader)
				if err != nil {
					log.Println("websocket read decompress error:", err)
					close(incoming)
					close(outgoing)
					return
				}

				messageBytes := resB.Bytes()

				incoming <- &messageBytes
			}
		}()

		// Write
		go func() {
			for {
				msg := <-outgoing
				if err := wsConn.WriteMessage(websocket.BinaryMessage, *msg); err != nil {
					log.Println("websocket write error:", err)
					close(incoming)
					close(outgoing)
					break
				}
			}
		}()

		return &Connection{
			IncomingMessage: incoming,
			OutgoingMessage: outgoing,
		}, nil
	}

	return nil, err
}
