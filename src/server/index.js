const express = require('express');
const path = require('path');
const app = express();
const port = 3000; // <- make sure to change the port used in module net_utils if you change the port
const proxy = require('./cors_proxy')
const importGameInfo = require('./modules/import_game_info')
const prettierFuncs = require('./modules/prettier')
const importGroupUserInfo = require('./modules/import_group_user')


// VARIABLES
// =====================================================================================================
app.set('views', path.join(__dirname, '../template'))
app.set('view engine', 'pug');

app.use(express.json())

// STATIC
// =====================================================================================================
app.use('/static', express.static(path.join(__dirname, '../static')))

// APPLICATION ROUTES
// =====================================================================================================

app.use('/proxy', proxy)

// MAIN ROUTES
// =====================================================================================================

app.get('/', (req, res) => {
    res.render('index.pug')
});


app.get('/games/:gameId', async (req, res) => {
    let gameId = req.params.gameId

    if (!parseInt(gameId) || parseInt(gameId) !== parseFloat(gameId) || parseInt(gameId) <= 0) {
      return res.status(400).render('error.pug', {message: "Please enter a valid, positive integer as the place ID.", title: "400"})
    }

    let resObj = await importGameInfo.getUniverseId(gameId)

    if (typeof resObj === "string") {
      return res.status(404).render('error.pug', {message: resObj, title: "404"})
    }

    resObj.functions = {
      integerPrettier: prettierFuncs.integerPrettier,
      formatDate: prettierFuncs.formatDate
    }

    await importGameInfo.getPlaceMedia(resObj);
    await importGameInfo.getPlaceInfo(resObj)

    // console.log(resObj)

    res.render('games.pug', resObj)
})

app.get('/users/:userId', async (req, res) => {
    let userId = req.params.userId

    if (!parseInt(userId) || parseInt(userId) !== parseFloat(userId) || parseInt(userId) <= 0) {
      return res.status(400).render('error.pug', {message: "Please enter a valid, positive integer as the user ID.", title: "400"})
    }

    let respObj = await importGroupUserInfo.fetchUserData(parseInt(userId));
    if (respObj === 404) {
      return res.status(404).render('error.pug', {message: "Please ensure the user ID entered is valid.<br><br>User accounts from early Roblox may not work if they are terminated.", title: "404"})
    }

    respObj.functions = {
      formatDate: prettierFuncs.formatDate
    }

    res.render('user.pug', respObj)
    // res.render('base.pug')
})

app.get('/groups/:groupId', async (req, res) => {
    let groupId = req.params.groupId

    if (!parseInt(groupId) || parseInt(groupId) !== parseFloat(groupId) || parseInt(groupId) <= 0) {
      return res.status(400).render('error.pug', {message: "Please enter a valid, positive integer as the group ID.", title: "400"})
    }

    let respObj = await importGroupUserInfo.fetchGroupInfo(parseInt(groupId));
    if (respObj === 404) {
      return res.status(404).render('error.pug', {message: "Please ensure the group ID entered is valid, or Roblox's API is currently down.", title: "404"})
    }

    respObj.functions = {
      formatDate: prettierFuncs.formatDate,
      integerPrettier: prettierFuncs.integerPrettier
    }

    res.render('group.pug', respObj)
    // res.render('base.pug')
})

// app.use((err, req, res, next) => {
//   console.log(err);
//   console.log(res.statusCode);
//   console.log(req.statusCode);
//   return res.status(req.statusCode).send(req.statusCode);
// })

app.use((req, res, next) => {
    res.status(404).render('error.pug', {message: "We didn't find what you were looking for, sorry!", title: "404"})
})


app.listen(port, () => {
  console.log(`Ro-Universe listening on port ${port}`);
});