module.exports = {
    root: true,
    env: {
        node: true,
        browser: true,
        es6: true,
    },
    extends: 'airbnb-base',
    rules: {
        'linebreak-style': 0,
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        indent: [2, 4], // 缩进风格
        camelcase: 2, // 强制驼峰法命名
        'no-multiple-empty-lines': [1, { max: 2 }], // 空行最多不能超过2行
        'no-alert': 0, // 禁止使用alert confirm prompt
        'max-len': ['error', { code: 120 }],

    },
};
