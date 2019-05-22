/**
 * Returns a random unique id.
 *
 * @ignore
 * @see {@link https://stackoverflow.com/a/6860962/1064165}
 * @return {String} - Random unique id generated.
 */
export function randomUniqueId () {
  const randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26))
  return randLetter + Date.now()
}
