const express = require('express');
const parser = require('body-parser');
const db = require('../database');

const app = express();

app.use(express.static(__dirname + '/../client/public'));
app.use(parser.urlencoded({extended: true}));
app.use(express.json());

// app.use((req, res, next) => {
//   console.log(req.method, req.url);
//   next();
// });

let idsUpdatedAt = {};

app.post('/games', (req, res) => {
  // console.log('post /games body: ', req.body);
  db.saveGame(req.body)
    .then(game => res.send(game));
    idsUpdatedAt[req.body.id] = new Date();
    console.log('save date', idsUpdatedAt[req.body.id]);
});

app.get('/games', (req, res) => {
  // console.log('get /games query: ', req.query);
  // console.log('date', new Date(req.query.updatedAt), idsUpdatedAt[req.query.id]);
  if (req.query.id === 'undefined') {
    db.createGame()
      .then(game => res.send(game));
  } else {
    let delay = 0;
    let interval;
    const longPoll = function longPolling() {
      if (idsUpdatedAt[req.query.id] === undefined || new Date(req.query.updatedAt) < idsUpdatedAt[req.query.id]) {
        // console.log('query db');
        if (idsUpdatedAt[req.query.id] === undefined) {
          idsUpdatedAt[req.query.id] = new Date();
        }
        clearInterval(interval);
        db.getGame(req.query.id)
          .then(game => res.send({id: game.id, board: game.board, moves: game.moves, updatedAt: new Date()}))
          .catch(err => res.sendStatus(404));
      } else if (delay > 200) {
          clearInterval(interval);
          res.end();
      } else {
        interval = setTimeout(() => longPoll(), 100);
      }
      delay++;
    }
    longPoll();
  }
});

app.get('*', (req, res) => {
  res.sendFile('index.html', {root: __dirname + '/../client/public/'});
});

app.listen(process.env.PORT || 3000, () => console.log(`listening on  port ${process.env.PORT || 3000}`));