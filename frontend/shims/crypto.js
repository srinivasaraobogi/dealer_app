// Minimal crypto shim for React Native.
// Axios uses crypto.randomInt() to generate CSRF tokens; this provides
// a Math.random()-based fallback so the rest of axios works normally.
module.exports = {
  randomInt: (max) => Math.floor(Math.random() * max),
  getRandomValues: (arr) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  },
};
