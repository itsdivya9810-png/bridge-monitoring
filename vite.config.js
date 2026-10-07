import { defineConfig } from 'vite';

const [repositoryOwner, repositoryName] = (process.env.GITHUB_REPOSITORY || '').split('/');
const isUserOrOrganizationSite = repositoryName?.toLowerCase() === `${repositoryOwner?.toLowerCase()}.github.io`;

export default defineConfig({
  // GitHub project sites live at /<repository-name>/; local dev and user sites use /.
  base: repositoryName && !isUserOrOrganizationSite ? `/${repositoryName}/` : '/',
});
