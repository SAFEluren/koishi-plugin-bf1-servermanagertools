import { Context, Logger } from 'koishi';
import { name } from "../index";

export function score(ctx: Context) {
  ctx.command('score', { authority: 0 })
    .alias("比分","分数")
    .action(async ({ session }) => {
      const logger = ctx.logger(name+"_cmd.score")
      const apiurl = `http://127.0.0.1:10086/Server/GetServerData`;
      try {
        const respone = await ctx.http.get(apiurl)
        logger.info("已触发命令")

        let message: string = `${respone.message}`
        message += `\n服务器名: ${respone.data.name}`
        message += `\nGameID: ${respone.data.gameId}`
        message += `\n--------------------`
        if (respone.data.mapName == "ID_M_LEVEL_MENU"){
          message += `\n当前正在${respone.data.mapName2}, 管服机疑似从游戏中掉线`
          return message
      }
        message += `\n游戏时间: ${respone.data.gameTime}`
        message += `\n当前地图: ${respone.data.mapName2}[${respone.data.gameMode2}]`
        // 判断是否为征服
        if (respone.data.gameMode == "Conquest0") {
          message += `\n${respone.data.team1.name}: ${respone.data.team1.allScore} / ${respone.data.team1.maxScore}`
          message += `\n${respone.data.team2.name}: ${respone.data.team2.allScore} / ${respone.data.team2.maxScore}`

          // 分差计算
          if (respone.data.team1.allScore > respone.data.team2.allScore) {
            let score_difference: number = respone.data.team1.allScore - respone.data.team2.allScore
            message += `\n分差: ${score_difference}`
          } else if (respone.data.team2.allScore > respone.data.team1.allScore) {
            let score_difference: number = respone.data.team2.allScore - respone.data.team1.allScore
            message += `\n分差: ${score_difference}`
          } else if (respone.data.team1.allScore - respone.data.team2.allScore == 0){
            message += `\n分差: 0`
          }

        } else {
          message += `\n当前模式为[${respone.data.gameMode2}]，无比分数据。`
        }
        message += `\n--------------------`
        message += `\n${respone.timestamp}`

        return message
      } catch (error) {
        return "访问API失败。";
      }
    });
}