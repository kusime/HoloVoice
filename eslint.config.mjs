// eslint.config.mjs —— ESLint 9 扁平配置，和 Prettier 彻底对齐
import js from '@eslint/js'
import ts from 'typescript-eslint'
import vue from 'eslint-plugin-vue'
import prettier from 'eslint-config-prettier'

export default [
  // 忽略目录
  { ignores: ['.nuxt/**', '.output/**', 'node_modules/**', 'dist/**'] },

  // 基础推荐
  js.configs.recommended,
  ...ts.configs.recommended,
  vue.configs['flat/recommended'],

  // 覆盖：关闭所有可能与 Prettier 冲突/误判的格式化规则
  {
    files: ['**/*.{js,ts,vue}'],
    languageOptions: {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
    },
    rules: {
      // 交给 Prettier 处理
      semi: 'off',
      '@typescript-eslint/semi': 'off',
      quotes: 'off',
      '@typescript-eslint/quotes': 'off',
      'comma-dangle': 'off',
      'object-curly-spacing': 'off',

      // Vue/SFC 缩进交给 Prettier
      indent: 'off',
      '@typescript-eslint/indent': 'off',
      'vue/script-indent': 'off',

      // 其它常见与 Prettier 冲突的
      'no-multi-spaces': 'off',
      'vue/html-indent': 'off',
      'vue/max-attributes-per-line': 'off',
    },
  },

  // 让 ESLint 接受 Prettier 的格式（等价 plugin:prettier/recommended）
  prettier,
]
