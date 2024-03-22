import { Context, Logger, Schema, Session } from 'koishi'
import { score } from './commands/score'
import { } from 'koishi-plugin-cron';
export const name = 'bf1-servermanagertools'
export const inject = {
  required: ['cron']
}
export interface Config {
  pushGroupIDs: string[]
}

export const Config: Schema<Config> = Schema.object({
  pushGroupIDs: Schema.array(String).description(`推送的目标QQ群`),
})

export function apply(ctx: Context, config: Config) {
  const logger = ctx.logger(name)
  const { pushGroupIDs } = config
  ctx.cron('*/2 * * * *', async () => {
    logger.info(`into cron`)
    // 每隔 2 分钟执行
    var serverData
    var gtServerData

    try {
      const apiurl = `http://127.0.0.1:10086/Server/GetServerData`;
      const localApi = await ctx.http.get(apiurl)
      var serverData = localApi.data
      var serverDataTimestamp = localApi.timestamp
      // logger.info(localApi)
    } catch (error) {
      return `访问本地API失败。(${error})`;
    }

    // 请求API获取人数 (GameTools)
    try {
      // let gameID : string = "8955485800203"
      const gtApi = `https://api.gametools.network/bf1/detailedserver/?gameid=${serverData.gameId}&platform=pc&lang=zh-tw`;
      const gtServerApi = await ctx.http.get(gtApi)
      // logger.info(gtServerApi)
      var gtServerData = gtServerApi
    } catch (error) {
      return `访问gametoolsAPI失败。(${error})`;
    }

    if (gtServerData.playerAmount <= 30){
      return false
    }
    let message: string = `[比分推送|间隔2分钟]`
    message += `\n游戏时间: ${serverData.gameTime}`
    serverData += `\n当前人数: ${gtServerData.playerAmount} / ${gtServerData.maxPlayerAmount}`
    // 判断是否为征服
    if (serverData.gameMode == "Conquest0") {
      message += `\n${serverData.team1.name}:${serverData.team1.allScore} / ${serverData.team2.name}:${serverData.team2.allScore}`
      // 分差计算
      if (serverData.team1.allScore > serverData.team2.allScore) {
        let score_difference: number = serverData.team1.allScore - serverData.team2.allScore
        message += `\n当前地图: ${serverData.mapName2}[${serverData.gameMode2}]\n分差: ${score_difference}`
      } else if (serverData.team2.allScore > serverData.team1.allScore) {
        let score_difference: number = serverData.team2.allScore - serverData.team1.allScore
        message += `\n当前地图: ${serverData.mapName2}[${serverData.gameMode2}]\n分差: ${score_difference}`
      } else if (serverData.team1.allScore - serverData.team2.allScore == 0) {
        message += `\n当前地图: ${serverData.mapName2}[${serverData.gameMode2}]\n分差: 0`
      }

    } else {
      message == `\n当前模式为[${serverData.gameMode2}]，无比分数据。`
      return false
    }
    message += `\n--------------------`
    message += `\n${serverDataTimestamp}`
    for (const currentBot of ctx.bots) {
      for (const groupId of pushGroupIDs) {
        await currentBot.sendMessage(groupId, message);
        logger.success(`群${groupId}已推送.(${serverDataTimestamp})`)
      }
    }

  })
  score(ctx);
}