import { Context, Logger, Schema, Session } from 'koishi'
import { score } from './commands/score'
import { } from 'koishi-plugin-cron';
export const name = 'bf1-servermanagertools'
export const inject = {
  required: ['cron']
}
export interface Config {
  pushGroupIDs: string[],
  pushInterval: string
}

export const Config: Schema<Config> = Schema.object({
  pushGroupIDs: Schema.array(String).description(`推送的目标QQ群`),
  pushInterval: Schema.string().description("推送间隔,请填写cron表达式.(cron表达式详解: https://help.aliyun.com/zh/ecs/user-guide/cron-expressions )").required(),
}).description('配置项')

export function apply(ctx: Context, config: Config) {
  const logger = ctx.logger(name)
  let { pushGroupIDs , pushInterval } = config
  if (pushInterval == ""){
    pushInterval = "*/2 * * * *"
    logger.info("未配置cron表达式，默认为2分钟一次")
  }
  logger.info(`当前的cron表达式: ${pushInterval}`)
  try {
    ctx.cron(pushInterval, async () => {
      logger.info(`执行cron`)
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

      logger.info(`服内当前玩家:${gtServerData.playerAmount} , 队伍[${serverData.team1.name}]:${serverData.team1.allScore} | 队伍[${serverData.team2.name}]:${serverData.team2.allScore} | 游戏时间:${serverData.time} `)
      // 检测服内无人则不推送消息
      // 如果服务器玩家人数小于等于30(30来自于游戏开始的人数) 或 双方分数加起来等于0 或服务器游戏时间等于0
      // 后两条同时包括了API出错 所有数据都为0时
      if (gtServerData.playerAmount <= 30 || serverData.team1.allScore + serverData.team2.allScore == 0 || serverData.time == 0 ){
        return false
      }
      let message: string = `[比分推送|间隔2分钟]`
      message += `\n游戏时间: ${serverData.gameTime}`
      message += `\n当前人数: ${gtServerData.playerAmount} / ${gtServerData.maxPlayerAmount}`
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
      logger.debug(message)
      for (const currentBot of ctx.bots) {
        for (const groupId of pushGroupIDs) {
          await currentBot.sendMessage(groupId, message);
          logger.success(`群${groupId}已推送.(${serverDataTimestamp})`)
        }
      }

    }
  )
  } catch (error) {
    logger.info(`初始化cron定时失败,错误原因:${error}`)
    logger.info(`将无法使用比分定时推送功能`)
  }
  score(ctx);
}