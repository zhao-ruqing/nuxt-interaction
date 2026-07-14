import { getTeamRankings } from '../../services/xingjian-social.service'

export default defineEventHandler(async () => ({ success: true, data: await getTeamRankings() }))
