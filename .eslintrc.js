module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'prettier'
	],
	rules: {
		'max-lines-per-function': ['error', 15],
		'max-lines': ['error', 200],
		'max-params': ['error', 4],
		'max-depth': ['error', 3],
		'no-console': 'warn',
		'@typescript-eslint/explicit-function-return-type': 'error',
		'@typescript-eslint/no-explicit-any': 'error',
		'@typescript-eslint/strict-boolean-expressions': 'error',
		'@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }]
	},
	ignorePatterns: ['dist/', '*.js']
}
