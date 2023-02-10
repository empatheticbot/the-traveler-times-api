interface EventHeaders {
  [name: string]: string | undefined
}

export function isAuthorized(headers: EventHeaders): boolean {
  const authKey = headers['TTT-API-KEY']
  return authKey && authKey === process.env.TTT_API_KEY
}
