window.__karma__.loaded = function() {
  System.main = 'test/build/index';

  steal.done().then(function() {
    if (window.__karma__) {
      window.__karma__.start();
    }
  });
};
