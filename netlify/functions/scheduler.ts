import {
  Handler,
  HandlerEvent,
  HandlerContext,
  schedule,
} from '@netlify/functions'
import fetch from 'node-fetch'
import { redeploySite, updateEnvVariable } from '../NetlifyUtils'

interface BungieAuthorizationResponse {
  access_token: string
  refresh_token: string
}

export async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(() => resolve(undefined), ms))
}

const myHandler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  const client_id = process.env.BUNGIE_CLIENT_ID
  const client_secret = process.env.BUNGIE_CLIENT_SECRET
  const refresh_token = process.env.BUNGIE_REFRESH_TOKEN

  const body = `grant_type=refresh_token&client_id=${client_id}&client_secret=${client_secret}&refresh_token=${refresh_token}`

  const response = await fetch(
    'https://www.bungie.net/platform/app/oauth/token/',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: body,
    }
  )
  const data: BungieAuthorizationResponse =
    (await response.json()) as BungieAuthorizationResponse
  const accessToken = data?.access_token
  const newRefreshToken = data?.refresh_token

  let envUpdates: Promise<unknown>[] = []
  if (accessToken) {
    envUpdates.push(updateEnvVariable('BUNGIE_OAUTH_TOKEN', accessToken))
  }
  if (newRefreshToken) {
    envUpdates.push(updateEnvVariable('BUNGIE_REFRESH_TOKEN', newRefreshToken))
  }
  try {
    await Promise.all(envUpdates)
  } catch (e) {
    console.error('Failed to update env variables: ', e)
    return {
      statusCode: 500,
    }
  }
  try {
    await delay(5000)
    await redeploySite()
  } catch (e) {
    console.error('Failed to redeploy site: ', e)
    return {
      statusCode: 500,
    }
  }

  return {
    statusCode: 200,
  }
}

const handler = schedule('0 1,3,5,7,9,11,13,15,17,19,21,23 * * *', myHandler)

export { handler }
