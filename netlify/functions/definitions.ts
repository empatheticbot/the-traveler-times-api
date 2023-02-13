import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { BungieD2Definition } from '../BungieAPIHandler'
import { isAuthorized } from '../Authorization'

import DefinitionHandler from '../DefinitionHandler'

async function getDefinitions(event: HandlerEvent) {
  const definitionType: BungieD2Definition | null = event.queryStringParameters[
    'definitionType'
  ] as BungieD2Definition
  let definitionIds = event.multiValueQueryStringParameters['definitionIds']

  if (!definitionIds) {
    const body = JSON.parse(event.body)
    definitionIds = body.definitionIds
  }
  if (!definitionType) {
    return {
      statusCode: 400,
      body: '`definitionType` query parameter is required.',
    }
  }

  const definitionHandler = new DefinitionHandler()
  let allDefinitions
  try {
    allDefinitions = await definitionHandler.getDefinitions(definitionType)
  } catch (e) {
    console.error(e)
    return {
      statusCode: 500,
      body: 'Failed to get definitions.',
    }
  }
  const requestedDefinitions =
    definitionIds?.length > 0
      ? definitionIds.map((hash: string) => allDefinitions[hash])
      : allDefinitions
  return requestedDefinitions
}

const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  if (!isAuthorized(event.headers)) {
    return {
      statusCode: 401,
    }
  }

  const definitions = await getDefinitions(event)
  return {
    statusCode: 200,
    body: JSON.stringify({ definitions }),
  }
}

export { handler }
