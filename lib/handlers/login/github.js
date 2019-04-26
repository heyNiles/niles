module.exports = {
  permissions: {
    GITHUB_LOGIN: {
      name: 'loginWithGitHub',
      description: 'login with GitHub',
      usageConfirmation: (namespace, usageDescription) => `Allow skill "${namespace}" to access your GitHub login, in order to ${usageDescription}?`,
      decorator: 'logsInWithGitHubTo',
      checker: 'canLoginWithGitHub',
    },
  },
  authorizationEndpoint: params => `https://github.com/login/oauth/authorize?client_id=${params.clientId}&scope=${encodeURIComponent(params.scope)}&state=${params.state}`,
  onQuery: (query, configs, terminate) => {
    if (query) {
      if (query.startsWith('data=')) {
        terminate(query.replace('data=', ''));
      } else if (query.startsWith('error=')) {
        terminate(null, query.replace('error=', ''));
      }
    }
  },
};
