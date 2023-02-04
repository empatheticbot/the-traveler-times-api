import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { BungieD2Definition } from '../BungieAPIHandler'

import DefinitionHandler from '../DefinitionHandler'

async function getDefinitions(event: HandlerEvent) {
  const definitionType: BungieD2Definition | null = event.queryStringParameters[
    'definitionType'
  ] as BungieD2Definition
  const definitionIds = event.multiValueQueryStringParameters['definitionIds']
  console.log(definitionIds.length)
  console.log(definitionType)
  if (!definitionType) {
    return new Response('`definitionType` query parameter is required.', {
      status: 400,
    })
  }

  const definitionHandler = new DefinitionHandler()
  console.log('before getting defs')
  let allDefinitions
  try {
    allDefinitions = await definitionHandler.getDefinitions(definitionType)
  } catch (e) {
    console.error(e)
  }
  console.log('after getting defs')
  const requestedDefinitions =
    definitionIds.length > 0
      ? definitionIds.map((hash: string) => allDefinitions[hash])
      : allDefinitions
  console.log(definitionIds)
  // const body = JSON.stringify(requestedDefinitions)
  // const headers = { 'Content-type': 'application/json' }
  return requestedDefinitions
}

const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  const definitions = await getDefinitions(event)
  console.log(definitions)
  return {
    statusCode: 200,
    body: JSON.stringify({ definitions }),
  }
}

export { handler }

// function getEnvVars() {
// 	return {
// 		apiKey: process.env.TTT_API_KEY,
// 		bungieAPIKey: process.env.BUNGIE_API_KEY,
// 		bungieCharacterID: process.env.BUNGIE_CHARACTER_ID,
// 		bungieClientSecret: process.env.BUNGIE_CLIENT_SECRET,
// 		bungieClientID: process.env.BUNGIE_CLIENT_ID,
// 		bungieMembershipType: process.env.BUNGIE_MEMB_TYPE,
// 		bungieMembershipID: process.env.BUNGIE_MEMBERSHIP_ID,
// 		bungieOAuthToken: process.env.BUNGIE_OAUTH_TOKEN,
// 	}
// }
