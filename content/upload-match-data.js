class UploadMatchData {
  constructor() {}
  init() {
    let match = []

    // 所有联赛
    let $allGames = $('.ipo-CompetitionBase')

    for (let i = 0; i < $allGames.length; i++) {
      let $games = $($allGames[i])

      // 联赛名称，比如NBA
      const game_name = $games.find('.ipo-Competition_Name').text()

      // 比赛，比如湖人队 vs 公牛队
      const $allTeams = $games.find('.ipo-Fixture')

      for (let j = 0; j < $allTeams.length; j++) {
        const $game = $($allTeams[j])
        const $teanName = $game.find('.ipo-Fixture_Truncator')
        const teamA = $teanName[0].innerText
        const teamB = $teanName[1].innerText

        match.push({
          BallGroup: game_name,
          ATeamName: teamA,
          BTeamName: teamB
        })
      }
    }

    return match
  }
}
