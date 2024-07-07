const express = require('express')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const path = require('path')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'cricketMatchDetails.db')
let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

// API 1: Get all players
app.get('/players/', async (request, response) => {
  const getPlayersQuery =
    'SELECT player_id AS playerId, player_name AS playerName FROM player_details;'
  const players = await db.all(getPlayersQuery)
  response.send(players)
})

// API 2: Get a specific player by ID
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `SELECT player_id AS playerId, player_name AS playerName FROM player_details WHERE player_id = ${playerId};`
  const player = await db.get(getPlayerQuery)
  response.send(player)
})

// API 3: Update a specific player by ID
app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body
  const updatePlayerQuery = `UPDATE player_details SET player_name = '${playerName}' WHERE player_id = ${playerId};`
  await db.run(updatePlayerQuery)
  response.send('Player Details Updated')
})

// API 4: Get match details by match ID
app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatchQuery = `SELECT match_id AS matchId, match, year FROM match_details WHERE match_id = ${matchId};`
  const match = await db.get(getMatchQuery)
  response.send(match)
})

// API 5: Get all matches of a player
app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getMatchesQuery = `
    SELECT match_details.match_id AS matchId, match_details.match, match_details.year 
    FROM player_match_score 
    JOIN match_details ON player_match_score.match_id = match_details.match_id 
    WHERE player_match_score.player_id = ${playerId};`
  const matches = await db.all(getMatchesQuery)
  response.send(matches)
})

// API 6: Get all players of a specific match
app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getPlayersQuery = `
    SELECT player_details.player_id AS playerId, player_details.player_name AS playerName 
    FROM player_match_score 
    JOIN player_details ON player_match_score.player_id = player_details.player_id 
    WHERE player_match_score.match_id = ${matchId};`
  const players = await db.all(getPlayersQuery)
  response.send(players)
})

// API 7: Get the statistics of a specific player
app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getPlayerScoresQuery = `
    SELECT 
      player_details.player_id AS playerId, 
      player_details.player_name AS playerName, 
      SUM(player_match_score.score) AS totalScore, 
      SUM(player_match_score.fours) AS totalFours, 
      SUM(player_match_score.sixes) AS totalSixes 
    FROM player_details 
    JOIN player_match_score ON player_details.player_id = player_match_score.player_id 
    WHERE player_details.player_id = ${playerId};`
  const playerScores = await db.get(getPlayerScoresQuery)
  response.send(playerScores)
})

module.exports = app
