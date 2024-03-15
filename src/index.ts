import { Context, Schema, Session } from 'koishi'
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

export function apply(ctx: Context,config: Config) {
  const logger = ctx.logger(name)
  const {pushGroupIDs} = config
  ctx.cron('*/2 * * * *', async () => {
    logger.info(`into cron`)
    // 每隔 2 分钟执行
    const apiurl = `http://127.0.0.1:10086/Server/GetServerData`;
    try {
      const respone = await ctx.http.get(apiurl)

      let message: string = `[比分推送 间隔2分钟]`
      message += `\n游戏时间: ${respone.data.gameTime}`
      // 判断是否为征服
      if (respone.data.gameMode == "Conquest0") {
        message += `\n${respone.data.team1.name}:${respone.data.team1.allScore} / ${respone.data.team2.name}:${respone.data.team2.allScore}`
        // 分差计算
        if (respone.data.team1.allScore > respone.data.team2.allScore) {
          let score_difference: number = respone.data.team1.allScore - respone.data.team2.allScore
          message += `\n当前地图: ${respone.data.mapName2}[${respone.data.gameMode2}]    分差: ${score_difference}`
        } else if (respone.data.team2.allScore > respone.data.team1.allScore) {
          let score_difference: number = respone.data.team2.allScore - respone.data.team1.allScore
          message += `\n当前地图: ${respone.data.mapName2}[${respone.data.gameMode2}]    分差: ${score_difference}`
        } else if (respone.data.team1.allScore - respone.data.team2.allScore == 0) {
          message += `\n当前地图: ${respone.data.mapName2}[${respone.data.gameMode2}]    分差: 0`
        }

      } else {
        message == `\n当前模式为[${respone.data.gameMode2}]，无比分数据。`
        return false
      }
      message += `\n--------------------`
      message += `\n${respone.timestamp}`
      for (const currentBot of ctx.bots) {
        for (const groupId of pushGroupIDs) {
            await currentBot.sendMessage(groupId, message);
            logger.success(`群${groupId}已推送.(${respone.timestamp})`)
          }
        }
    } catch (error) {
      logger.error(`无法连接到HTTP API`)

    }

  })
  score(ctx);

}

