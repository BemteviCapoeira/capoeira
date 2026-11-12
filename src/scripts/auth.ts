/** The GitHub token used by the "Add a song" pages: where it's kept, and how it's checked. */
import { SITE } from '../data/site';
import { gitHub, GitHubError } from './github';

const TOKEN_KEY = 'githubToken';

export const FORM_URL = `${import.meta.env.BASE_URL}new-song/`;
export const CONNECT_URL = `${import.meta.env.BASE_URL}new-song/connect/`;

/** sessionStorage by default (gone when the tab closes); localStorage when "remember" is ticked. */
export const tokenStore = {
  get(): string | null {
    try {
      return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string, remember: boolean) {
    try {
      (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
      (remember ? sessionStorage : localStorage).removeItem(TOKEN_KEY);
    } catch {}
  },
  remove() {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
  },
};

export class NoWriteAccess extends Error {
  constructor(login: string) {
    super(
      `@${login} doesn't have write access to ${SITE.repo.owner}/${SITE.repo.name}. Ask a maintainer to add you to the repository, then try again.`,
    );
    this.name = 'NoWriteAccess';
  }
}

export interface Session {
  client: ReturnType<typeof gitHub>;
  login: string;
  defaultBranch: string;
}

/** Checks the token works and can write to the songbook repository. */
export async function verifyToken(token: string): Promise<Session> {
  const client = gitHub(token, SITE.repo);
  const [user, repo] = await Promise.all([client.user(), client.repo()]);
  if (repo.permissions && repo.permissions.push === false) throw new NoWriteAccess(user.login);
  return { client, login: user.login, defaultBranch: repo.default_branch };
}

/** True when the token itself is the problem (as opposed to e.g. being offline). */
export function isTokenProblem(error: unknown): boolean {
  return error instanceof NoWriteAccess || (error instanceof GitHubError && [401, 403, 404].includes(error.status));
}
