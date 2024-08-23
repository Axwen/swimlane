const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === 'production'
    ? '/swimlane/' // 将 'your-repo-name' 替换为你的 GitHub 仓库名
    : '/'
})
