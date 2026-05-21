module.exports = {
  '{src,test}/**/*.ts': ['eslint --fix', 'prettier --write'],
  '*.{js,json,md,yml,yaml}': ['prettier --write'],
  'test/**/*.js': ['prettier --write'],
};
