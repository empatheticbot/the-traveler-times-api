import fetch from 'node-fetch'

const baseUrl = 'https://api.netlify.com/api/v1/accounts/sledsworth'

export async function updateEnvVariable(
  key: string,
  value: string
): Promise<unknown> {
  const url = new URL(`${baseUrl}/env/${key}`)
  url.searchParams.set('site_id', process.env.NETLIFY_SITE_ID)
  return fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${process.env.NETLIFY_AUTH_TOKEN}`,
    },
    method: 'put',
    body: JSON.stringify({
      values: [
        {
          id: 'string',
          value: value,
          context: 'all',
        },
      ],
      key: key,
    }),
  })
}
