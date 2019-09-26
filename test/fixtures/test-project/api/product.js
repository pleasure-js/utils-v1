module.exports = {
  model: {
    schema: {
      name: String,
      description: String,
      categories: {
        type: Array
      },
      price: {
        type: Number,
        default: 0
      },
      stock: {
        type: Number,
        default: 0
      }
    },
    schemaCreated (mongooseSchema) {
      mongooseSchema.index({ name: 'text' })
    }
  },
  access: {
    create ({ user }) {
      // only admins can create products
      return true
    }
  }
}
