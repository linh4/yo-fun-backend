const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({port: 8000}, () => {
  console.log('server is running')
});

let users = [],
    rooms = [],
    clients = []



const sendStatus = (connection, status) => {
  let message = {status}
  connection.send(JSON.stringify(message))
}

const addUsername = (connection, username) => {
  if (!users.includes(username)) {
    users.push(username)
    sendStatus(connection, 'success')
  } else {
    sendStatus(connection, 'fail')
  }
}

const addRoom = (connection, roomname) => {
  if (!rooms.includes(roomname)) {
    rooms.push({roomname, offer: null})
    sendStatus(connection, 'success')
  } else {
    sendStatus(connection, 'fail')
  }
}

const getRoom = (connection) => {
  connection.send(JSON.stringify(rooms.map(room => room.roomname)))
}

const handleOffer = (messageObj) => {
  const selectRoom = rooms.find(room => room.roomname === messageObj.roomname)
  selectRoom.offer = messageObj.offer
}

const getOffer = (messageObj, connection) => {
  const selectRoom = rooms.find(room => room.roomname === messageObj.roomname)
  connection.send(JSON.stringify(selectRoom.offer))
}

const getAnswer = (messageObj, connection) => {
  connection.send(JSON.stringify(messageObj.answer))
}

const getCandidate = (messageObj, connection) => {
  console.log(messageObj)
  const selectRoom = rooms.find(room => room.roomname === messageObj.roomname)
  selectRoom.candidate = messageObj.candidate
  clients.forEach(client => {
    client.send(JSON.stringify(messageObj))
  })
}

wss.on('connection', connection => {
  clients.push(connection)
  connection.on('message', (message) => {
    let messageObj = JSON.parse(message)
    switch (messageObj.type) {
      case 'addUsername':
        addUsername(connection, messageObj.username)
        break
      case 'addRoomname':
        addRoom(connection, messageObj.roomname)
        break
      case 'getRoomname':
        getRoom(connection)
        break
      case 'offer':
        handleOffer(messageObj)
        break
      case 'getOffer':
        getOffer(messageObj, connection)
        break
      case 'answer':
        getAnswer(messageObj, connection)
      case 'candidate':
        getCandidate(messageObj, connection)
    }

  })
})
