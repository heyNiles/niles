module.exports = class Handler {
  constructor(ctx) {
    this.ctx = ctx;
    this.permissions = {};
  }

  async assertPermission(perm) {
    const { session: { intent } } = this.ctx;
    const { permission } = await intent.permissions.get(perm);

    if (!permission) {
      const error = new Error(`Permission "${perm.name}" required but not granted.`);
      error.code = 401;

      throw error;
    }
  }
};
