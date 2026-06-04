const { generateChainId } = require('../util/index')

module.exports = (query) => {
  return new Promise(async (resolve) => {
    const platform = query.platform || 'pc'
    const cookie = query.cookie || ''

    let url = `https://music.163.com/login?codekey=${query.key}`

    if (platform === 'web') {
      const chainId = generateChainId(cookie)
      url += `&chainId=${chainId}`
    }

    return resolve({
      code: 200,
      status: 200,
      body: {
        code: 200,
        data: {
          qrurl: url,
        },
      },
    })
  })
}
