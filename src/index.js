// import ChainApi from './sdk/ChainApi'
console.log('ChainApi--->', "ChainApi")
// export default ChainApi


require('@babel/register')({
    plugins: ['@babel/plugin-transform-modules-commonjs']
});
require('./entry.js');




