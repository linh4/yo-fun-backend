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
    const foundClient = clients.find(client => client.connection === connection)
    foundClient.roomname = roomname
    rooms.push({roomname, offer: null})
    sendStatus(connection, 'success')
  } else {
    sendStatus(connection, 'fail')
  }
}

const joinRoom = (connection, roomname) => {
  const foundClient = clients.find(client => client.connection === connection)
  foundClient.roomname = roomname
}

const getRoom = (connection) => {
  connection.send(JSON.stringify(rooms.map(room => room.roomname)))
}

const handleOffer = (messageObj) => {
  console.log(messageObj)
  const selectRoom = rooms.find(room => room.roomname === messageObj.roomname)
  selectRoom.offer = messageObj.offer
  console.log("select room", selectRoom.offer)
}

const getOffer = (messageObj, connection) => {
  const selectRoom = rooms.find(room => room.roomname === messageObj.roomname)
  connection.send(JSON.stringify(selectRoom.offer))
}

const getAnswer = (messageObj, connection) => {
  connection.send(JSON.stringify(messageObj.answer))
}

const getCandidate = (messageObj, connection) => {
  const selectRoom = rooms.find(room => room.roomname === messageObj.roomname)
  selectRoom.candidate = messageObj.candidate
  clients.map(obj => obj.connection).forEach(client => {
    client.send(JSON.stringify(messageObj))
  })
}

const checkRoomname = (connection, room) => {
  const checkRoom = clients.filter(selectroom => selectroom.roomname === room).length
  const jsonRoom = JSON.stringify({checkRoom, type: 'numOfPeople'})
  connection.send(jsonRoom)
}

const setRoomNull = (connection) => {
  const checkRoom = clients.find(client => client.connection === connection)
  checkRoom.roomname = null
}

wss.on('connection', connection => {
  clients.push({connection, roomname: null})
  connection.on('message', (message) => {
    let messageObj = JSON.parse(message)
    switch (messageObj.type) {
      case 'addUsername':
        addUsername(connection, messageObj.username)
        break
      case 'addRoomname':
        addRoom(connection, messageObj.roomname)
        break
      case 'joinRoomname':
        joinRoom(connection, messageObj.roomname)
        break
      case 'getRoomname':
        getRoom(connection)
        break
      case 'checkRoomname':
        checkRoomname(connection, messageObj.roomname)
        break
      case 'setRoomNull':
        setRoomNull(connection)
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

setInterval(() => {
  clients = clients.filter(client => client.connection.readyState !== client.connection.CLOSED)
  const checkRoom = clients.filter(selectroom => selectroom.roomname === 'ee').length
  console.log("checkroom", checkRoom)
}, 100)
