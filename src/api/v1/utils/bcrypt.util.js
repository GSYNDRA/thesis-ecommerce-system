import bcrypt from 'bcrypt'

export class BcryptServices {
  static SALT_ROUNDS = 12

  // hash password
  static async hashPassword(password) {
    return bcrypt.hash(password, this.SALT_ROUNDS)
  }

  // compare password
  static async comparePassword(password, hashPassword) {
    return bcrypt.compare(password, hashPassword)
  }
}