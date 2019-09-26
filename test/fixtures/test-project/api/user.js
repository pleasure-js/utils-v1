const md5 = require('md5')
const { utils: { isEmail } } = require('pleasure')

const basicCreateAccess = () => ['fullName', 'email', 'password']
const basicReadAccess = () => ['_id', 'fullName', 'email', 'level']
const basicUpdateAccess = () => ['fullName', 'email', 'password']

module.exports = {
  model: {
    schema: {
      fullName: {
        type: String,
        required: true,
        $pleasure: {
          label: 'Full Name',
          placeholder: 'Full Name'
        }
      },
      email: {
        type: String,
        unique: true,
        required: true,/*
        validate: {
          validator (v) {
            return isEmail(v)
          },
          message: `error.invalid-email`
        },*/
        $pleasure: {
          label: 'E-mail',
          placeholder: 'E-mail address'
        }
      },
      level: {
        type: String,
        enum: ['admin', 'customer'],
        default: 'customer',
        $pleasure: {
          label: 'Level',
          placeholder: 'User Level'
        }
      },
      password: {
        type: String,
        required: true,
        $pleasure: {
          label: 'Password',
          placeholder: 'Password'
        }
      }
    },
    schemaCreated (mongooseSchema) {
      mongooseSchema.pre('save', function (next) {
        if (this.isModified('password')) {
          if (this.password && this.password.length < 6) {
            throw new Error(`Password too short.`)
          }

          this.password = md5(this.password)
        }
        next()
      })

      mongooseSchema.statics.login = async function ({ email, password }) {
        const InvalidCredentials = new Error(`error.invalid-credentials`)

        if (!email || !password) {
          throw InvalidCredentials
        }

        const user = await this.findOne({ email, password: md5(password) })

        if (!user) {
          throw InvalidCredentials
        }

        // this will be signed and returned as an accessToken using JWT.
        return user.toObject()
      }
    }
  },
  access: {
    read ({ user, id }) {
      return true
      // return user && (user.level === 'admin' || user._id === id) ? ['_id', 'fullName', 'level', 'email'] : false
    },
    create ({ user }) {
      const access = basicCreateAccess()

      // only admins can set a user level
      if (user && user.level === 'admin') {
        access.push('level')
      }

      return access
    },
    update ({ user }) {
      const access = []

      // only admins can set a user level
      if (user) {
        access.push(...basicUpdateAccess())

        if (user.level === 'admin') {
          access.push('level')
        }
      }

      return access
    },
    list ({ user }) {
      // only admins can list users
      return user && user.level === 'admin'
    }
  },
  flux: {
    access: {
      // called every time an entry that belongs to this entity is updated
      // must return an array indicating what groups of users should be notified
      // true for all, false for none
      // defaults to true
      update({ entry }) {
        return false
      }
    },
    payload: {
      update ({ group, entry }) {
        // console.log(`entry.$updated >>>`, entry.$before, entry.$after)
        return entry
      }
    }
  }
}
