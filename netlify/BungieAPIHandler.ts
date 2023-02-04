import { BungieErrorStatus } from './BungieAPIError'

interface BungieAPIManifestResponse {
  Response: BungieD2Manifest
}

interface BungieD2Manifest {
  jsonWorldComponentContentPaths: {
    en: { [index: string]: string }
  }
  jsonWorldContentPaths: {
    en: string
  }
}

interface BungieD2PGCRResponse {}

interface BungieAPIPGCRResponse {
  Message: string
  Response: BungieD2PGCRResponse
  ErrorStatus: BungieErrorStatus
}

interface BungieUserSearchResponse {
  Message: string
  Response: {}
  ErrorStatus: BungieErrorStatus
}

interface BungieD2CharacterMilestoneResponse {
  characterProgressions?: {
    data: { [index: string]: { milestones: unknown } }
  }
}

interface BungieAPICharacterMilestoneResponse {
  Message: string
  Response: BungieD2CharacterMilestoneResponse
  ErrorStatus: BungieErrorStatus
}

export type BungieD2Definition =
  | 'DestinyVendorDefinition'
  | 'DestinyInventoryItemDefinition'
  | 'DestinyActivityDefinition'
  | 'DestinyActivityModifierDefinition'
  | 'DestinyClassDefinition'
  | 'DestinyDamageTypeDefinition'
  | 'DestinyMilestoneDefinition'
  | 'DestinyDestinationDefinition'
  | 'DestinyPresentationNodeDefinition'
  | 'DestinyRecordDefinition'
  | 'DestinySeasonDefinition'

export default class BungieAPIHandler {
  manifest?: BungieD2Manifest = undefined
  membershipId: string | null = null
  characterId: string | null = null
  membershipType: string | null = null
  apiKey: string | null = null
  oauthToken: string | null = null

  constructor() {
    this.apiKey = process.env.BUNGIE_API_KEY
    this.membershipId = process.env.BUNGIE_MEMBERSHIP_ID
    this.membershipType = process.env.BUNGIE_MEMB_TYPE
    this.characterId = process.env.BUNGIE_CHARACTER_ID
    this.oauthToken = process.env.BUNGIE_OAUTH_TOKEN
  }

  /**
   * Adds the API Key to the request header.
   */
  addApiKeyToHeader({ headers = {}, ...rest }): { headers: {} } {
    return {
      headers: {
        ...headers,
        Authorization: 'Bearer ' + this.oauthToken,
        'X-API-Key': this.apiKey,
      },
      ...rest,
    }
  }

  /**
   * Calls the api for passed in options and parses into JSON response;
   */
  async callApi({
    headers = {},
    components,
    path = '',
    baseUrl = 'https://www.bungie.net/Platform',
  }: {
    headers?: {}
    components?: string[]
    path?: string
    baseUrl?: string
  }) {
    let resp
    const url = new URL(`${baseUrl}${path}`)
    if (components) {
      url.searchParams.set('components', components.join(','))
    }
    console.log('CALL: ' + url)
    try {
      resp = await fetch(url.toString(), this.addApiKeyToHeader({ headers }))
    } catch (e) {
      console.error(`Failed to call bungie platform api ${e}`)
      return Promise.reject(`Failed to call bungie platform api ${e}`)
    }
    console.log(resp.status)
    if (!resp.ok) {
      if (resp.status === 401) {
        console.error(
          'Unauthorized from Bungie API. Check to make sure credentials are updated.'
        )
        // TODO: Look into a way to send myself an alert to update credentials when a 401 happens.
      }
      return Promise.reject('Bungie API failed.')
    }
    // console.log(resp.json())
    let json
    try {
      // console.log(resp)
      json = await resp.json()
      console.log('parsed')
    } catch (e) {
      console.error(e)
      return Promise.reject(e)
    }
    return json
  }

  async callBungieNet(options: {
    path: string
    headers?: {}
    components?: string[]
  }) {
    return this.callApi({ ...options, baseUrl: 'https://www.bungie.net' })
  }

  /**
   * Gets current version of the Destiny API manifest.
   * Links to sqlite database file containing information on items/entities etc.
   * Useful for large/frequent requests for item information and other things.
   */
  async getManifest() {
    if (this.manifest) {
      return this.manifest
    }
    let options = {
      path: '/Destiny2/Manifest/',
      method: 'GET',
    }
    let manifestResponse = (await this.callApi(
      options
    )) as BungieAPIManifestResponse
    this.manifest = manifestResponse.Response
    return this.manifest
  }

  /**
   * Gets current version of the Destiny API manifest.
   * Links to sqlite database file containing information on items/entities etc.
   * Useful for large/frequent requests for item information and other things.
   */
  async getManifestDefinition(entityType: string, hash: string | number) {
    let options = {
      path: `/Destiny2/Manifest/${entityType}/${hash}/`,
      method: 'GET',
    }
    return await this.callApi(options)
  }

  async getCompleteManifest() {
    const manifest = await this.getManifest()

    return this.callBungieNet({ path: manifest?.jsonWorldContentPaths?.en })
  }

  async getDefinitionFromManifest(definition: BungieD2Definition) {
    console.log(definition)
    if (typeof definition !== 'string') {
      return Promise.reject(
        'Parameter `definition` is required and must be of type string.'
      )
    }

    const manifest = await this.getManifest()
    const definitionPath =
      manifest?.jsonWorldComponentContentPaths?.en[definition]

    if (!definitionPath) {
      return Promise.reject(
        `Parameter 'definition' with value of ${definition} does not exist in the Destiny 2 Manifest.`
      )
    }

    return this.callBungieNet({ path: definitionPath })
  }

  async getPostGameCarnageReport(id: string) {
    let resp: BungieAPIPGCRResponse
    try {
      resp = (await this.callApi({
        path: `/Platform/Destiny2/Stats/PostGameCarnageReport/${id}/`,
        baseUrl: `https://stats.bungie.net`,
      })) as BungieAPIPGCRResponse
    } catch (e) {
      console.error(`Failed to call bungie platform api ${e}`)
      throw e
    }
    if (resp.Message === 'Ok') {
      return resp.Response
    } else if (
      resp.ErrorStatus === BungieErrorStatus.DestinyPGCRNotFound ||
      resp.ErrorStatus === BungieErrorStatus.DestinySystemDisabled
    ) {
      return null
    } else {
      throw new Error(`${resp.ErrorStatus}: ${resp.Message}`)
    }
  }

  async getCharacterMilestones() {
    let resp: BungieAPICharacterMilestoneResponse
    try {
      resp = (await this.callApi({
        path: `/Destiny2/${this.membershipType}/Profile/${this.membershipId}`,
        components: ['CharacterProgressions'],
      })) as BungieAPICharacterMilestoneResponse
    } catch (e) {
      console.error(`Failed to call bungie platform api ${e}`)
      throw e
    }
    if (resp.Message === 'Ok' && this.characterId) {
      return resp.Response?.characterProgressions?.data[this.characterId]
        ?.milestones
    } else {
      throw new Error(`${resp.ErrorStatus}: ${resp.Message}`)
    }
  }

  async getUsersFromSearch(search: string, page = 0) {
    let resp: BungieUserSearchResponse
    try {
      resp = (await this.callApi({
        path: `/User/Search/Prefix/${search}/${page}/`,
      })) as BungieUserSearchResponse
    } catch (e) {
      console.error(`Failed to call bungie user search api ${e}`)
      throw e
    }
    if (resp.Message === 'Ok') {
      return resp.Response
    } else {
      throw new Error(`${resp.ErrorStatus}: ${resp.Message}`)
    }
  }
}
