import BaseRepository from './base.reponsitory.js'
import UserModel from '../models/user.js'
import { USER_ROLE } from '../constants/common.constant.js'
export default class UserRepository extends BaseRepository {
  constructor() {
    super(UserModel)
  }

  /* ---------- Auth / Sign-up ---------- */

  async findByEmail(email) {
    return this.findOne({ email })
  }

  async createUser(data) {
    return this.create({
      email: data.email,
      hash_password: data.hash_password,
      first_name: data.first_name,
      last_name: data.last_name,
      phone_number: data.phone_number || null,
      date_of_birth: data.date_of_birth || null,
      gender: data.gender || 'other',
      is_email_verified: false,
      role_id: data.role_id || USER_ROLE.CUSTOMER
    })
  }

  async setEmailVerification(email, token, expiresAt) {
    return this.update(
      { email },
      {
        email_verification_token: token,
        email_verification_expires: expiresAt
      }
    )
  }

  async verifyEmail(token) {
    return this.getModel().update(
      {
        is_email_verified: true,
        email_verification_token: null,
        email_verification_expires: null
      },
      {
        where: {
          email_verification_token: token,
          email_verification_expires: { $gt: new Date() }
        }
      }
    )
  }

  /* ---------- Login helpers ---------- */

  async incrementLoginAttempts(userId) {
    return this.getModel().increment('login_attempts', {
      where: { id: userId }
    })
  }

  async resetLoginAttempts(userId) {
    return this.update(
      { id: userId },
      {
        login_attempts: 0,
        account_locked_until: null
      }
    )
  }

  async updateLastLogin(userId) {
    return this.update(
      { id: userId },
      { last_login: new Date() }
    )
  }
}
