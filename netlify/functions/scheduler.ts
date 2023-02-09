import {
  Handler,
  HandlerEvent,
  HandlerContext,
  schedule,
} from '@netlify/functions'
import fetch from 'node-fetch'
import { updateEnvVariable } from '../NetlifyUtils'

const myHandler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  console.log('Received event:', event)
  const client_id = process.env.BUNGIE_CLIENT_ID
  const client_secret = process.env.BUNGIE_CLIENT_SECRET
  const refresh_token = process.env.BUNGIE_REFRESH_TOKEN

  let body = `grant_type=refresh_token&client_id=${client_id}&client_secret=${client_secret}&refresh_token=${refresh_token}`

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

  let data = await response.json()

  let access_token = data?.access_token
  let new_refresh_token = data?.refresh_token

  let envUpdates: Promise<unknown>[] = []
  if (access_token) {
    envUpdates.push(updateEnvVariable('BUNGIE_OAUTH_TOKEN', access_token))
  }
  if (new_refresh_token) {
    envUpdates.push(
      updateEnvVariable('BUNGIE_REFRESH_TOKEN', new_refresh_token)
    )
  }
  await Promise.all(envUpdates)
  return {
    statusCode: 200,
  }
}

const handler = schedule('3,33 * * * *', myHandler)

export { handler }
