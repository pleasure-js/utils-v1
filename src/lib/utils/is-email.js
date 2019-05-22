export function isEmail (email) {
  return /^[a-z][a-z0-9.+_-]*@[a-z0-9.-]+\.[a-z]{2,16}$/i.test(email)
}
