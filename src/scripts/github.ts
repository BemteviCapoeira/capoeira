/**
 * Minimal GitHub REST client for the browser. The token is only ever sent to api.github.com.
 * Needs a fine-grained token with "Contents" and "Pull requests" read & write on the repo.
 */

const API = 'https://api.github.com';

export class GitHubError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface RepoRef {
  owner: string;
  name: string;
}

export interface NewFile {
  path: string;
  /** UTF-8 text… */
  text?: string;
  /** …or binary content, base64-encoded. */
  base64?: string;
}

export function gitHub(token: string, repo: RepoRef) {
  const repoPath = `/repos/${repo.owner}/${repo.name}`;

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      let message = res.statusText;
      try {
        message = (await res.json()).message ?? message;
      } catch {}
      throw new GitHubError(res.status, message);
    }
    return (await res.json()) as T;
  }

  return {
    user: () => request<{ login: string }>('GET', '/user'),

    repo: () => request<{ default_branch: string; permissions?: { push?: boolean } }>('GET', repoPath),

    async exists(path: string, ref: string): Promise<boolean> {
      try {
        await request('GET', `${repoPath}/contents/${path}?ref=${encodeURIComponent(ref)}`);
        return true;
      } catch (e) {
        if (e instanceof GitHubError && e.status === 404) return false;
        throw e;
      }
    },

    /** Commit `files` on a new branch off `base` (one commit) and open a pull request. Returns its URL. */
    async openPullRequest(opts: {
      base: string;
      branch: string;
      files: NewFile[];
      message: string;
      title: string;
      body: string;
      onProgress?: (step: string) => void;
    }): Promise<string> {
      const progress = opts.onProgress ?? (() => {});

      progress('Reading the latest version of the site…');
      const head = await request<{ object: { sha: string } }>('GET', `${repoPath}/git/ref/heads/${opts.base}`);
      const baseCommit = await request<{ tree: { sha: string } }>('GET', `${repoPath}/git/commits/${head.object.sha}`);

      progress('Uploading files…');
      const tree = [];
      for (const file of opts.files) {
        if (file.base64 !== undefined) {
          const blob = await request<{ sha: string }>('POST', `${repoPath}/git/blobs`, {
            content: file.base64,
            encoding: 'base64',
          });
          tree.push({ path: file.path, mode: '100644', type: 'blob', sha: blob.sha });
        } else {
          tree.push({ path: file.path, mode: '100644', type: 'blob', content: file.text ?? '' });
        }
      }
      const newTree = await request<{ sha: string }>('POST', `${repoPath}/git/trees`, {
        base_tree: baseCommit.tree.sha,
        tree,
      });
      const commit = await request<{ sha: string }>('POST', `${repoPath}/git/commits`, {
        message: opts.message,
        tree: newTree.sha,
        parents: [head.object.sha],
      });

      progress('Creating a branch…');
      let branch = opts.branch;
      try {
        await request('POST', `${repoPath}/git/refs`, { ref: `refs/heads/${branch}`, sha: commit.sha });
      } catch (e) {
        if (!(e instanceof GitHubError && e.status === 422)) throw e;
        branch = `${opts.branch}-${Date.now().toString(36)}`; // branch name taken (e.g. an earlier attempt)
        await request('POST', `${repoPath}/git/refs`, { ref: `refs/heads/${branch}`, sha: commit.sha });
      }

      progress('Opening the pull request…');
      const pr = await request<{ html_url: string }>('POST', `${repoPath}/pulls`, {
        title: opts.title,
        head: branch,
        base: opts.base,
        body: opts.body,
      });
      return pr.html_url;
    },
  };
}

/** A friendly explanation for API failures. */
export function explain(error: unknown): string {
  if (error instanceof Error && error.name === 'NoWriteAccess') return error.message;
  if (error instanceof TypeError) return "Couldn't reach GitHub. Check your internet connection and try again.";
  if (!(error instanceof GitHubError)) {
    return error instanceof Error ? `Something went wrong: ${error.message}` : 'Something went wrong.';
  }
  switch (error.status) {
    case 401:
      return 'GitHub rejected the token. It may be mistyped, expired or revoked. Create a new one and try again.';
    case 403:
      return `The token isn't allowed to do this (${error.message}). It needs "Contents" and "Pull requests" set to Read and write, and the organization may need to approve it.`;
    case 404:
      return "The token can't see the repository. When creating it, choose BemteviCapoeira as the owner and select the capoeira repository.";
    default:
      return `GitHub error ${error.status}: ${error.message}`;
  }
}
