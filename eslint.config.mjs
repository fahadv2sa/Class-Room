import tseslint from 'typescript-eslint'

export default [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'dist/**',
      '.npm-cache/**',
      'next-env.d.ts',
    ],
  },
  ...tseslint.configs.recommended,
]
