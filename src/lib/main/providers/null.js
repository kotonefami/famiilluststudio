class NullProvider {
  async parse(buf) {

  }

  static isSupport(buf) {
    return false;
  }
}

module.exports = NullProvider;
