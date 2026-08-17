const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const previousEnhance = config.server?.enhanceMiddleware;
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware, metroServer) => {
    const inner = previousEnhance ? previousEnhance(middleware, metroServer) : middleware;
    return (req, res, next) => {
      // Google popup auth polls window.closed; same-origin COOP blocks that.
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
      return inner(req, res, next);
    };
  },
};

module.exports = config;
