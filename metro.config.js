const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Force supabase-js to its CJS build — the ESM build (index.mjs) contains
  // `import(OTEL_PKG)` with a variable specifier that Hermes cannot parse.
  if (moduleName === '@supabase/supabase-js') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(
        __dirname,
        'node_modules/@supabase/supabase-js/dist/index.cjs',
      ),
    };
  }

  // Stub out opentelemetry — it's an optional observability dep that has no
  // place in a React Native bundle.
  if (
    moduleName === '@opentelemetry/api' ||
    moduleName.startsWith('@opentelemetry/')
  ) {
    return { type: 'empty' };
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
