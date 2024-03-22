import { Context, Logger } from 'koishi';
import { name } from "../index";

export function score(ctx: Context) {
  ctx.command('score', { authority: 0 })
    .alias("比分", "分数")
    .action(async ({ session }) => {
      const logger = ctx.logger(name + "_cmd.score")
      logger.info("已触发命令")

      try {
        const apiurl = `http://127.0.0.1:10086/Server/GetServerData`;
        const localApi = await ctx.http.get(apiurl)
        var serverData = localApi.data
        var serverDataTimestamp = localApi.timestamp
      } catch (error) {
        return `访问本地API失败。(${error})`;
      }

      // 请求API获取人数 (GameTools)
      try {
        const gtApi = `https://api.gametools.network/bf1/detailedserver/?gameid=${serverData.gameId}&platform=pc&lang=zh-tw`;
        const gtServerApi = await ctx.http.get(gtApi)
        var gtServerData = gtServerApi
      } catch (error) {
        return `访问gametoolsAPI失败。(${error})`;
      }

      // 构造消息
      let message: string = `操作成功`
      message += `\n服务器名: ${serverData.name}`
      message += `\nGameID: ${serverData.gameId}`
      message += `\n--------------------`
      if (serverData.mapName == "ID_M_LEVEL_MENU") {
        message += `\n当前正在${serverData.mapName2}, 管服机疑似从游戏中掉线`
        return serverData
      }
      message += `\n游戏时间: ${serverData.gameTime}`
      message += `\n当前地图: ${serverData.mapName2}[${serverData.gameMode2}]`
      message += `\n当前人数: ${gtServerData.playerAmount} / ${gtServerData.maxPlayerAmount}`
      // 判断是否为征服
      if (serverData.gameMode == "Conquest0") {
        message += `\n${serverData.team1.name}: ${serverData.team1.allScore} / ${serverData.team1.maxScore}`
        message += `\n${serverData.team2.name}: ${serverData.team2.allScore} / ${serverData.team2.maxScore}`

        // 分差计算
        if (serverData.team1.allScore > serverData.team2.allScore) {
          let score_difference: number = serverData.team1.allScore - serverData.team2.allScore
          message += `\n分差: ${score_difference}`
        } else if (serverData.team2.allScore > serverData.team1.allScore) {
          let score_difference: number = serverData.team2.allScore - serverData.team1.allScore
          message += `\n分差: ${score_difference}`
        } else if (serverData.team1.allScore - serverData.team2.allScore == 0) {
          message += `\n分差: 0`
        }

      } else {
        message += `\n当前模式为[${serverData.gameMode2}]，无比分数据。`
      }
      message += `\n--------------------`
      message += `\n${serverDataTimestamp}`
      return message

    });
}